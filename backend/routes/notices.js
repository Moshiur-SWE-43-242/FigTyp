const express = require('express');
const Notice = require('../models/Notice');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const notices = await Notice.find({ active: true }).sort({ createdAt: -1 });
    const formatted = notices.map((notice) => ({
      id: notice._id,
      title: notice.title,
      content: notice.content,
      active: notice.active,
      createdAt: notice.createdAt
    }));
    res.json(formatted);
  } catch (error) {
    console.error('Failed to load notices:', error);
    res.status(500).json({ error: 'Failed to load notices.' });
  }
});

module.exports = router;
