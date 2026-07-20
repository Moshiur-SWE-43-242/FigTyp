const express = require('express');
const Attempt = require('../models/Attempt');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

const toClientAttempt = (attempt) => ({
  id: attempt._id,
  _id: attempt._id,
  userId: attempt.userId,
  mode: attempt.mode,
  duration: attempt.duration,
  wordCount: attempt.wordCount,
  wpm: attempt.wpm,
  rawWpm: attempt.rawWpm,
  accuracy: attempt.accuracy,
  consistency: attempt.consistency,
  correctChars: attempt.correctChars,
  incorrectChars: attempt.incorrectChars,
  totalChars: attempt.totalChars,
  quoteText: attempt.quoteText,
  errorHeatmap: attempt.errorHeatmap || {},
  createdAt: attempt.createdAt
});

const calculateStreak = async (userId) => {
  const attempts = await Attempt.find({ userId }).select('createdAt').sort({ createdAt: -1 }).limit(90);
  const activeDays = new Set(attempts.map((attempt) => attempt.createdAt.toISOString().slice(0, 10)));
  let streak = 0;
  const cursor = new Date();

  while (activeDays.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};

router.post('/', protect, async (req, res) => {
  try {
    const payload = req.body || {};
    const attempt = new Attempt({
      userId: req.user.id,
      mode: payload.mode || 'quote',
      duration: Number(payload.duration) || 0,
      wordCount: Number(payload.wordCount) || 0,
      wpm: Number(payload.wpm) || 0,
      rawWpm: Number(payload.rawWpm) || Number(payload.wpm) || 0,
      accuracy: Number(payload.accuracy ?? 100),
      consistency: Number(payload.consistency ?? 100),
      correctChars: Number(payload.correctChars) || 0,
      incorrectChars: Number(payload.incorrectChars) || 0,
      totalChars: Number(payload.totalChars) || 0,
      quoteText: payload.quoteText || '',
      errorHeatmap: payload.errorHeatmap || {}
    });

    await attempt.save();

    const xpGain = Math.max(0, Math.round((attempt.wpm || 0) * Math.max(0, attempt.accuracy || 0) / 100));
    const coinGain = attempt.wpm >= 30 && attempt.accuracy >= 80 ? Math.max(1, Math.round(attempt.wpm / 2)) : 0;
    const user = await User.findById(req.user.id);
    if (user) {
      user.xp += xpGain;
      user.coins += coinGain;
      user.lastActive = new Date();
      user.streak = await calculateStreak(req.user.id);

      while (user.xp >= user.level * 150) {
        user.xp -= user.level * 150;
        user.level += 1;
      }

      await user.save();
    }

    res.status(201).json({ success: true, attempt: toClientAttempt(attempt) });
  } catch (error) {
    console.error('Error saving attempt:', error);
    res.status(500).json({ error: 'Failed to save typing attempt.' });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    const attempts = await Attempt.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(250);
    res.json(attempts.map(toClientAttempt));
  } catch (error) {
    console.error('Error fetching attempts:', error);
    res.status(500).json({ error: 'Failed to load typing attempts.' });
  }
});

module.exports = router;
