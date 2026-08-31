const express = require('express');
const ActivityLog = require('../models/ActivityLog');
const Notice = require('../models/Notice');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

const roomPlayersStore = require('../roomPlayersStore');

// Admin: Inspect realtime contest room players (for monitoring)
router.get('/contest-room/:id', protect, adminOnly, async (req, res) => {
  try {
    const contestId = req.params.id;
    const roomId = `contest:${contestId}`;
    const players = roomPlayersStore.rooms[roomId] || {};
    const list = Object.values(players).slice().sort((a, b) => {
      if (a.finished && !b.finished) return -1;
      if (!a.finished && b.finished) return 1;
      if ((b.progress || 0) !== (a.progress || 0)) return (b.progress || 0) - (a.progress || 0);
      if ((b.wpm || 0) !== (a.wpm || 0)) return (b.wpm || 0) - (a.wpm || 0);
      return 0;
    });
    res.json({ success: true, players: list });
  } catch (error) {
    console.error('Failed to load contest room players:', error);
    res.status(500).json({ success: false, error: 'Failed to load contest room players.' });
  }
});

router.get('/logs', protect, adminOnly, async (req, res) => {
  try {
    const logs = await ActivityLog.find().sort({ createdAt: -1 }).limit(250);
    const userIds = [...new Set(logs.map((log) => String(log.userId)).filter(Boolean))];
    const users = await User.find({ _id: { $in: userIds } }, 'email');
    const emailMap = new Map(users.map((user) => [String(user._id), user.email]));

    const filteredLogs = logs.map((log) => ({
      _id: log._id,
      userId: log.userId,
      email: emailMap.get(String(log.userId)) || 'unknown-user@figtyp.app',
      actionType: log.actionType,
      details: log.details,
      metadata: log.metadata,
      createdAt: log.createdAt
    }));

    res.json({ success: true, logs: filteredLogs });
  } catch (error) {
    console.error('Failed to load admin logs:', error);
    res.status(500).json({ success: false, error: 'Failed to load audit logs.' });
  }
});

router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find({}, 'username email role createdAt').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Failed to load admin user directory:', error);
    res.status(500).json({ success: false, error: 'Failed to load user directory.' });
  }
});

router.post('/cms/notice', protect, adminOnly, async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, error: 'Title and content are required.' });
    }
    const notice = new Notice({ title, content, active: true, createdBy: req.user.id });
    await notice.save();
    res.status(201).json({ success: true, notice });
  } catch (error) {
    console.error('Failed to create notice:', error);
    res.status(500).json({ success: false, error: 'Failed to create notice.' });
  }
});

router.delete('/cms/notice/:id', protect, adminOnly, async (req, res) => {
  try {
    const deleted = await Notice.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Notice not found.' });
    }
    res.json({ success: true, message: 'Notice deleted successfully.' });
  } catch (error) {
    console.error('Failed to delete notice:', error);
    res.status(500).json({ success: false, error: 'Failed to delete notice.' });
  }
});

module.exports = router;
