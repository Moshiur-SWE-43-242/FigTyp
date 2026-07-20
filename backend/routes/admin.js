const express = require('express');
const ActivityLog = require('../models/ActivityLog');
const Notice = require('../models/Notice');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/logs', protect, adminOnly, async (req, res) => {
  try {
    const logs = await ActivityLog.find().sort({ createdAt: -1 }).limit(250);
    res.json({ success: true, logs });
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
