const express = require('express');
const Attempt = require('../models/Attempt');
const User = require('../models/User');

const router = express.Router();

// GET: Public Practice Leaderboard (Only username, rank, wpm, accuracy, createdAt)
router.get('/practice', async (req, res) => {
  try {
    const topAttempts = await Attempt.aggregate([
      { $match: { wpm: { $gt: 0 } } },
      { $sort: { wpm: -1, accuracy: -1, createdAt: -1 } },
      {
        $group: {
          _id: '$userId',
          wpm: { $first: '$wpm' },
          accuracy: { $first: '$accuracy' },
          createdAt: { $first: '$createdAt' }
        }
      },
      { $sort: { wpm: -1, accuracy: -1 } },
      { $limit: 25 }
    ]);

    // Fetch strictly usernames for the aggregated users
    const users = await User.find({ _id: { $in: topAttempts.map((entry) => entry._id) } }).select('username');
    const userMap = new Map(users.map((user) => [String(user._id), user]));

    // Sanitize response to omit email, phone, and full names
    res.json(topAttempts.map((entry, index) => {
      const user = userMap.get(String(entry._id));
      return {
        rank: index + 1,
        username: user?.username || 'Anonymous Typist',
        wpm: entry.wpm,
        accuracy: entry.accuracy,
        createdAt: entry.createdAt
      };
    }));
  } catch (error) {
    console.error('Error loading leaderboard:', error);
    res.status(500).json({ error: 'Failed to load practice leaderboard.' });
  }
});

module.exports = router;