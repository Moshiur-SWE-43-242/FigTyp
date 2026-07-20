const express = require('express');
const Attempt = require('../models/Attempt');
const User = require('../models/User');

const router = express.Router();

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

    const users = await User.find({ _id: { $in: topAttempts.map((entry) => entry._id) } }).select('username fullName');
    const userMap = new Map(users.map((user) => [String(user._id), user]));

    res.json(topAttempts.map((entry, index) => {
      const user = userMap.get(String(entry._id));
      return {
        rank: index + 1,
        userId: entry._id,
        username: user?.username || user?.fullName || 'FigTyp Racer',
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
