const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path'); 
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { purgeInactiveAccounts } = require('./utils/accountPurge');

// Security & Middlewares
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Anti-Tamper & Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Auth rate limiter to protect against brute-force & credential stuffing
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again in 15 minutes.' }
});

// Routes Setup
const authRoutes = require('./routes/auth');
const contestRoutes = require('./routes/contests');
const certificateRoutes = require('./routes/certificates');
const attemptRoutes = require('./routes/attempts');
const activityLogRoutes = require('./routes/activityLogs');
const settingsRoutes = require('./routes/settings');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const noticeRoutes = require('./routes/notices');
const leaderboardRoutes = require('./routes/leaderboard');
const cmsRoutes = require('./routes/cms');
const lessonRoutes = require('./routes/lessons');
const wordbankRoutes = require('./routes/wordbanks');
const blogRoutes = require('./routes/blogs');
const { seedBlogs } = require('./scripts/seedBlogs');

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/wordbanks', wordbankRoutes);
app.use('/api/blogs', blogRoutes);

// Storage for uploaded course/lesson videos and platform assets
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
const videoUploadsDir = path.join(uploadsDir, 'videos');
if (!fs.existsSync(videoUploadsDir)) fs.mkdirSync(videoUploadsDir, { recursive: true });

app.use('/uploads', express.static(uploadsDir));

// Monolithic Deployment: Serve Frontend Production Assets
const frontendDist = path.join(__dirname, '../frontend/dist');
const rootDist = path.join(__dirname, '../dist');
const distDir = fs.existsSync(frontendDist) ? frontendDist : rootDist;

app.use(express.static(distDir));

app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

// Socket.io Realtime Contest Progress with Privacy Shielding
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || '*' }
});

const roomPlayersStore = require('./roomPlayersStore');
const roomPlayers = roomPlayersStore.rooms; // Shared in-memory session tracking for contest rooms

io.on('connection', (socket) => {
  
  socket.on('join-contest', ({ contestId, username, userId }) => {
    if (!contestId) return;
    const roomId = `contest:${contestId}`;
    socket.join(roomId);
    
    socket.data.contestId = contestId;
    socket.data.userId = userId;
    socket.data.username = username;
    socket.data.roomId = roomId;

    if (!roomPlayers[roomId]) roomPlayers[roomId] = {};
    
    // Store only non-sensitive live racing fields
    roomPlayers[roomId][socket.id] = {
      id: userId,
      socketId: socket.id,
      username: username || 'Racer',
      wpm: 0,
      progress: 0,
      accuracy: 100,
      finished: false,
      finishTime: null,
      ready: false
    };

    // Emit a deterministically sorted leaderboard (finished first, then progress, then wpm)
    const getSortedPlayers = () => Object.values(roomPlayers[roomId] || {}).slice().sort((a, b) => {
      if (a.finished && !b.finished) return -1;
      if (!a.finished && b.finished) return 1;
      if ((b.progress || 0) !== (a.progress || 0)) return (b.progress || 0) - (a.progress || 0);
      if ((b.wpm || 0) !== (a.wpm || 0)) return (b.wpm || 0) - (a.wpm || 0);
      if (a.finishTime && b.finishTime) return new Date(a.finishTime) - new Date(b.finishTime);
      return 0;
    });

    io.to(roomId).emit('update-leaderboard', getSortedPlayers());
  });

  // Toggle ready status in lobby
  socket.on('toggle-ready', ({ contestId, ready }) => {
    if (!contestId) return;
    const roomId = `contest:${contestId}`;
    if (roomPlayers[roomId] && roomPlayers[roomId][socket.id]) {
      roomPlayers[roomId][socket.id].ready = Boolean(ready);
      const players = Object.values(roomPlayers[roomId]);
      io.to(roomId).emit('update-leaderboard', players);
      io.to(roomId).emit('player-ready-changed', {
        socketId: socket.id,
        userId: roomPlayers[roomId][socket.id].id,
        ready: Boolean(ready)
      });
    }
  });

  // Host starts the synchronized race countdown
  socket.on('start-race', ({ contestId, countdownSeconds = 5 }) => {
    if (!contestId) return;
    const roomId = `contest:${contestId}`;
    const startTimestamp = Date.now() + (countdownSeconds * 1000);
    
    // Reset players for race
    if (roomPlayers[roomId]) {
      Object.keys(roomPlayers[roomId]).forEach(sId => {
        roomPlayers[roomId][sId].wpm = 0;
        roomPlayers[roomId][sId].progress = 0;
        roomPlayers[roomId][sId].accuracy = 100;
        roomPlayers[roomId][sId].finished = false;
        roomPlayers[roomId][sId].finishTime = null;
      });
      io.to(roomId).emit('update-leaderboard', Object.values(roomPlayers[roomId]));
    }

    io.to(roomId).emit('race-starting', {
      countdownSeconds,
      startTimestamp,
      contestId
    });
  });

  // Host triggers rematch / room reset
  socket.on('reset-race', ({ contestId }) => {
    if (!contestId) return;
    const roomId = `contest:${contestId}`;
    if (roomPlayers[roomId]) {
      Object.keys(roomPlayers[roomId]).forEach(sId => {
        roomPlayers[roomId][sId].wpm = 0;
        roomPlayers[roomId][sId].progress = 0;
        roomPlayers[roomId][sId].accuracy = 100;
        roomPlayers[roomId][sId].finished = false;
        roomPlayers[roomId][sId].finishTime = null;
        roomPlayers[roomId][sId].ready = false;
      });
      io.to(roomId).emit('update-leaderboard', Object.values(roomPlayers[roomId]));
    }
    io.to(roomId).emit('race-reset', { contestId });
  });

  // Host kicks a participant
  socket.on('kick-player', ({ contestId, targetSocketId }) => {
    if (!contestId || !targetSocketId) return;
    const roomId = `contest:${contestId}`;
    const targetSocket = io.sockets.sockets.get(targetSocketId);
    if (targetSocket) {
      targetSocket.emit('kicked-from-room', { message: 'You have been removed from this race room by the host.' });
      targetSocket.leave(roomId);
    }
    if (roomPlayers[roomId] && roomPlayers[roomId][targetSocketId]) {
      delete roomPlayers[roomId][targetSocketId];
      io.to(roomId).emit('update-leaderboard', Object.values(roomPlayers[roomId]));
    }
  });

  socket.on('update-progress', ({ contestId, userId, wpm, accuracy, progress, finished }) => {
    if (!contestId) return;
    const roomId = `contest:${contestId}`;
    
    if (roomPlayers[roomId] && roomPlayers[roomId][socket.id]) {
      const player = roomPlayers[roomId][socket.id];
      
      if (finished && !player.finished) {
        player.finishTime = new Date().toISOString(); 
      }

      player.wpm = wpm;
      player.accuracy = accuracy;
      player.progress = progress;
      player.finished = finished;
      
      const sortedList = Object.values(roomPlayers[roomId]).slice().sort((a, b) => {
        if (a.finished && !b.finished) return -1;
        if (!a.finished && b.finished) return 1;
        if ((b.progress || 0) !== (a.progress || 0)) return (b.progress || 0) - (a.progress || 0);
        if ((b.wpm || 0) !== (a.wpm || 0)) return (b.wpm || 0) - (a.wpm || 0);
        if (a.finishTime && b.finishTime) return new Date(a.finishTime) - new Date(b.finishTime);
        return 0;
      });
      io.to(roomId).emit('update-leaderboard', sortedList);
    }
  });

  socket.on('disconnect', () => {
    const roomId = socket.data.roomId;
    if (roomId && roomPlayers[roomId] && roomPlayers[roomId][socket.id]) {
      const player = roomPlayers[roomId][socket.id];
      
      // Retain finished users on the leaderboard even if they disconnect
      if (!player.finished) {
        delete roomPlayers[roomId][socket.id];
      } else {
        player.isOffline = true;
      }

      const sortedList = Object.values(roomPlayers[roomId]).slice().sort((a, b) => {
        if (a.finished && !b.finished) return -1;
        if (!a.finished && b.finished) return 1;
        if ((b.progress || 0) !== (a.progress || 0)) return (b.progress || 0) - (a.progress || 0);
        if ((b.wpm || 0) !== (a.wpm || 0)) return (b.wpm || 0) - (a.wpm || 0);
        if (a.finishTime && b.finishTime) return new Date(a.finishTime) - new Date(b.finishTime);
        return 0;
      });
      io.to(roomId).emit('update-leaderboard', sortedList);
    }
  });
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("🔥 MongoDB Database Connected Successfully!");
    seedBlogs();
    purgeInactiveAccounts();
    // Daily security retention sweep for inactive accounts >1 year
    setInterval(purgeInactiveAccounts, 24 * 60 * 60 * 1000);
  })
  .catch((err) => console.log("❌ Database Connection Error: ", err));

// Start HTTP Server
const PORT = process.env.PORT || 5000;

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Error: Port ${PORT} is already in use by another process.`);
    console.error(`💡 To terminate the process occupying port ${PORT} on Windows (PowerShell), run:`);
    console.error(`   Stop-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess -Force\n`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', err);
    process.exit(1);
  }
});

server.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});