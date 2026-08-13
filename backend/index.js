const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path'); 
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));

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

app.use('/api/auth', authRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// Monolithic Deployment: Serve Frontend Production Assets
app.use(express.static(path.join(__dirname, '../dist')));

app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
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
      finishTime: null
    };

    // Emit a deterministically sorted leaderboard (finished first, then progress, then wpm)
    const sortedList = Object.values(roomPlayers[roomId]).slice().sort((a, b) => {
      if (a.finished && !b.finished) return -1;
      if (!a.finished && b.finished) return 1;
      if ((b.progress || 0) !== (a.progress || 0)) return (b.progress || 0) - (a.progress || 0);
      if ((b.wpm || 0) !== (a.wpm || 0)) return (b.wpm || 0) - (a.wpm || 0);
      // Fallback: earlier finishTime is better
      if (a.finishTime && b.finishTime) return new Date(a.finishTime) - new Date(b.finishTime);
      return 0;
    });

    io.to(roomId).emit('update-leaderboard', sortedList);
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
  .then(() => console.log("🔥 MongoDB Database Connected Successfully!"))
  .catch((err) => console.log("❌ Database Connection Error: ", err));

// Start HTTP Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});