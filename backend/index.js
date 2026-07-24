const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path'); // নতুন যুক্ত করা হয়েছে (স্ট্যাটিক ফাইলের জন্য)
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
// 1. Serve the static files from the React frontend app (from the "dist" folder)
app.use(express.static(path.join(__dirname, '../dist')));

//2. any route that doesn't match the above API routes will serve the frontend's index.html (for SPA routing)
app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

// Socket.io — realtime contest race progress
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || '*' }
});

io.on('connection', (socket) => {
  // A player joins a contest room
  socket.on('join-contest', ({ contestId, username, userId }) => {
    if (!contestId) return;
    socket.join(`contest:${contestId}`);
    socket.data.contestId = contestId;
    socket.data.userId = userId;
    socket.data.username = username;

    // Let everyone else in the room know a new racer arrived
    socket.to(`contest:${contestId}`).emit('progress-pushed', {
      userId,
      username,
      wpm: 0,
      progress: 0,
      accuracy: 100
    });
  });

  // A player pushes a live progress update — broadcast to the rest of the room
  socket.on('update-progress', ({ contestId, userId, wpm, accuracy, progress }) => {
    if (!contestId) return;
    socket.to(`contest:${contestId}`).emit('progress-pushed', {
      userId,
      username: socket.data.username,
      wpm,
      accuracy,
      progress
    });
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