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

// ==========================================
// Monolithic Deployment: Serve Frontend
// ==========================================
app.use(express.static(path.join(__dirname, '../dist')));

app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

// ==========================================
// Socket.io — Realtime Contest Race Progress
// ==========================================
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || '*' }
});

const roomPlayers = {}; // Memory storage for live rooms

io.on('connection', (socket) => {
  // A player joins a contest room
  socket.on('join-contest', ({ contestId, username, userId }) => {
    if (!contestId) return;
    const roomId = `contest:${contestId}`;
    socket.join(roomId);
    
    socket.data.contestId = contestId;
    socket.data.userId = userId;
    socket.data.username = username;
    socket.data.roomId = roomId;

    if (!roomPlayers[roomId]) roomPlayers[roomId] = {};
    
    // Initialize player data
    roomPlayers[roomId][socket.id] = {
      id: userId,
      socketId: socket.id,
      username,
      wpm: 0,
      progress: 0,
      accuracy: 100,
      finished: false
    };

    // Broadcast to everyone in the room
    io.to(roomId).emit('update-leaderboard', Object.values(roomPlayers[roomId]));
  });

  // A player pushes a live progress update
  socket.on('update-progress', ({ contestId, userId, wpm, accuracy, progress, finished }) => {
    if (!contestId) return;
    const roomId = `contest:${contestId}`;
    
    if (roomPlayers[roomId] && roomPlayers[roomId][socket.id]) {
      roomPlayers[roomId][socket.id] = {
        ...roomPlayers[roomId][socket.id],
        wpm,
        accuracy,
        progress,
        finished
      };
      
      io.to(roomId).emit('update-leaderboard', Object.values(roomPlayers[roomId]));
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const roomId = socket.data.roomId;
    if (roomId && roomPlayers[roomId] && roomPlayers[roomId][socket.id]) {
      delete roomPlayers[roomId][socket.id];
      io.to(roomId).emit('update-leaderboard', Object.values(roomPlayers[roomId]));
    }
  });
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("🔥 MongoDB Database Connected Successfully!"))
  .catch((err) => console.log("❌ Database Connection Error: ", err));

// Server Port
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});