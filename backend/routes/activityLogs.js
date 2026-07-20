const express = require('express');
const ActivityLog = require('../models/ActivityLog');
const { protect } = require('../middleware/auth');
const router = express.Router();

// 1. Save a new activity log (logged-in users only)
router.post('/', protect, async (req, res) => {
  try {
    const { actionType, details, metadata } = req.body;

    // userId comes from the verified auth token, not the request body
    const newLog = new ActivityLog({
      userId: req.user.id,
      actionType,
      details,
      metadata
    });

    await newLog.save();
    res.status(201).json({ success: true, log: newLog });
  } catch (error) {
    console.error("Error saving activity log:", error);
    res.status(500).json({ error: "Failed to save activity log" });
  }
});

// 2. Get all activity logs for a specific user (only their own)
router.get('/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;

    // Users may only read their own history; admins may read anyone's
    if (req.user.id !== userId && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: "You can only view your own activity logs." });
    }

    // Newest history entries first
    const logs = await ActivityLog.find({ userId }).sort({ createdAt: -1 }).limit(50);
    res.status(200).json({ success: true, logs });
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    res.status(500).json({ error: "Failed to fetch activity logs" });
  }
});

module.exports = router;
