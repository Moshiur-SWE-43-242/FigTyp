const express = require('express');
const ActivityLog = require('../models/ActivityLog');
const Notice = require('../models/Notice');
const User = require('../models/User');
const Attempt = require('../models/Attempt');
const Certificate = require('../models/Certificate');
const Contest = require('../models/Contest');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

const roomPlayersStore = require('../roomPlayersStore');

// Admin: System Telemetry & Live Stats
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const [totalUsers, totalAttempts, totalCertificates, totalContests] = await Promise.all([
      User.countDocuments(),
      Attempt.countDocuments(),
      Certificate.countDocuments(),
      Contest.countDocuments()
    ]);

    // Active rooms count
    const activeRoomsCount = Object.keys(roomPlayersStore.rooms || {}).length;

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalAttempts,
        totalCertificates,
        totalContests,
        activeRoomsCount,
        serverUptimeSeconds: Math.floor(process.uptime()),
        memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        nodeVersion: process.version
      }
    });
  } catch (error) {
    console.error('Failed to load system stats:', error);
    res.status(500).json({ success: false, error: 'Failed to load telemetry stats' });
  }
});

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
    const users = await User.find({ _id: { $in: userIds } }, 'email username');
    const emailMap = new Map(users.map((user) => [String(user._id), user.email]));
    const nameMap = new Map(users.map((user) => [String(user._id), user.username]));

    const filteredLogs = logs.map((log) => ({
      _id: log._id,
      userId: log.userId,
      email: emailMap.get(String(log.userId)) || 'unknown-user@figtyp.app',
      username: nameMap.get(String(log.userId)) || 'Typist',
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

// Full User Directory for Admin
router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find(
      {},
      'username email role coins xp level streak createdAt lastActive institute fullName'
    ).sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Failed to load admin user directory:', error);
    res.status(500).json({ success: false, error: 'Failed to load user directory.' });
  }
});

// Update User Role (e.g., promote to ADMIN or GENERAL_USER)
router.patch('/users/:id/role', protect, adminOnly, async (req, res) => {
  try {
    const { role } = req.body;
    if (!role || !['GENERAL_USER', 'GUEST', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Valid role is required' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.role = role;
    await user.save();

    res.json({ success: true, message: `Role updated to ${role}`, user: { id: user._id, username: user.username, role: user.role } });
  } catch (error) {
    console.error('Failed to update user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Adjust User Balance (Coins, XP, Level)
router.patch('/users/:id/balance', protect, adminOnly, async (req, res) => {
  try {
    const { coins, xp, level } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (typeof coins === 'number') user.coins = Math.max(0, coins);
    if (typeof xp === 'number') user.xp = Math.max(0, xp);
    if (typeof level === 'number') user.level = Math.max(1, level);

    await user.save();
    res.json({
      success: true,
      message: 'User balances updated successfully',
      user: { id: user._id, username: user.username, coins: user.coins, xp: user.xp, level: user.level }
    });
  } catch (error) {
    console.error('Failed to adjust user balance:', error);
    res.status(500).json({ error: 'Failed to adjust user balance' });
  }
});

// Delete or Remove User
router.delete('/users/:id', protect, adminOnly, async (req, res) => {
  try {
    const targetId = req.params.id;
    if (!targetId) {
      return res.status(400).json({ success: false, error: 'User ID is required.' });
    }

    // Prevent self-deletion
    if (String(req.user.id) === String(targetId)) {
      return res.status(400).json({ success: false, error: 'Cannot delete your own admin account.' });
    }

    let deleted = null;
    const mongoose = require('mongoose');
    if (mongoose.Types.ObjectId.isValid(targetId)) {
      deleted = await User.findByIdAndDelete(targetId);
    } else {
      deleted = await User.findOneAndDelete({ _id: targetId });
    }

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'User not found in database.' });
    }

    // Cascade delete user-associated records to keep database clean
    await Promise.allSettled([
      Attempt.deleteMany({ userId: targetId }),
      Certificate.deleteMany({ userId: targetId }),
      ActivityLog.deleteMany({ userId: targetId })
    ]);

    res.json({ success: true, message: `User ${deleted.username || targetId} deleted successfully.` });
  } catch (error) {
    console.error('Failed to delete user:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to delete user' });
  }
});

// Notice Management
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

// Admin: Get all custom logo & tournament host requests
router.get('/logo-requests', protect, adminOnly, async (req, res) => {
  try {
    const requests = await User.find(
      { customLogoApproval: { $in: ['PENDING', 'APPROVED', 'REJECTED'] } },
      'username email fullName customLogoApproval customLogoOrgName customLogoRequestDate createdAt'
    ).sort({ customLogoRequestDate: -1 });

    res.json({ success: true, requests });
  } catch (error) {
    console.error('Failed to load logo requests:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch host requests.' });
  }
});

// Admin: Review (Approve / Reject) custom logo & tournament request
router.post('/review-logo-request', protect, adminOnly, async (req, res) => {
  try {
    const { userId, status } = req.body;
    if (!userId || !['APPROVED', 'REJECTED', 'NONE'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Valid userId and status (APPROVED/REJECTED/NONE) are required.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    user.customLogoApproval = status;
    await user.save();

    await ActivityLog.create({
      userId: req.user.id,
      actionType: 'ADMIN_ACTION',
      details: {
        action: `Custom Logo Request ${status}`,
        targetUserId: user._id,
        targetUsername: user.username
      }
    });

    res.json({
      success: true,
      message: `Host request for ${user.username} has been ${status.toLowerCase()}!`,
      user: {
        id: user._id,
        username: user.username,
        customLogoApproval: user.customLogoApproval
      }
    });
  } catch (error) {
    console.error('Failed to review logo request:', error);
    res.status(500).json({ success: false, error: 'Failed to update request.' });
  }
});

module.exports = router;

