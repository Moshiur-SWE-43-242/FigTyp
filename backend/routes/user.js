const express = require('express');
const Attempt = require('../models/Attempt');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Helper to convert Mongoose User document to a sanitized client object
const toClientUser = (user) => ({
  id: user._id,
  username: user.username || '',
  email: user.email || '',
  fullName: user.fullName || '',
  phoneNumber: user.phoneNumber || '',
  socialLink: user.socialLink || '',
  institute: user.institute || '',
  professionalRole: user.professionalRole || '',
  themePreference: user.themePreference || 'theme_cyan',
  avatarUrl: user.avatarUrl || '',
  xp: user.xp || 0,
  level: user.level || 1,
  coins: user.coins || 0,
  streak: user.streak || 0,
  role: user.role || 'GENERAL_USER',
  dailyPracticeCount: user.dailyPracticeCount || 0,
  lastActive: user.lastActive ? user.lastActive.toISOString() : null,
  createdAt: user.createdAt ? user.createdAt.toISOString() : null,
  updatedAt: user.updatedAt ? user.updatedAt.toISOString() : null
});

// Calculate statistics strictly for the logged-in user
const calculateUserStats = async (userId) => {
  const attempts = await Attempt.find({ userId }).sort({ createdAt: -1 }).limit(250);
  const validAttempts = attempts.filter((attempt) => typeof attempt.wpm === 'number' && attempt.wpm >= 0);

  const averageWpm = validAttempts.length
    ? Math.round(validAttempts.reduce((sum, attempt) => sum + attempt.wpm, 0) / validAttempts.length)
    : 0;

  const bestWpm = validAttempts.length
    ? Math.max(...validAttempts.map((attempt) => attempt.wpm))
    : 0;

  const averageAccuracy = validAttempts.length
    ? Number((validAttempts.reduce((sum, attempt) => sum + attempt.accuracy, 0) / validAttempts.length).toFixed(1))
    : 100;

  const activeDays = new Set(attempts.map((attempt) => attempt.createdAt.toISOString().slice(0, 10))).size;
  const totalDurationMinutes = Math.round(attempts.reduce((sum, attempt) => sum + (attempt.duration || 0), 0) / 60);

  return {
    attemptsCount: attempts.length,
    averageWpm,
    bestWpm,
    averageAccuracy,
    activeDays,
    totalDurationMinutes,
  };
};

// GET: Load logged-in user profile strictly
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const stats = await calculateUserStats(req.user.id);
    res.json({ user: toClientUser(user), stats });
  } catch (error) {
    console.error('Failed to load user profile:', error);
    res.status(500).json({ error: 'Failed to load user profile.' });
  }
});

// POST: Update user settings
router.post('/settings', protect, async (req, res) => {
  try {
    const { avatarUrl, themePreference } = req.body;
    const updates = {};

    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
    if (themePreference !== undefined) updates.themePreference = themePreference;
    updates.lastActive = new Date();

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ success: true, user: toClientUser(user) });
  } catch (error) {
    console.error('Failed to update user settings:', error);
    res.status(500).json({ error: 'Failed to update user settings.' });
  }
});

// POST: Complete user profile details
router.post('/complete-profile', protect, async (req, res) => {
  try {
    const {
      username,
      fullName,
      phoneNumber,
      socialLink,
      institute,
      professionalRole,
    } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (username && username.trim() && username !== user.username) {
      const duplicate = await User.findOne({ username: username.trim(), _id: { $ne: req.user.id } });
      if (duplicate) {
        return res.status(400).json({ error: 'Username already taken.' });
      }
      user.username = username.trim();
    }

    if (fullName !== undefined) user.fullName = fullName.trim();
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber.trim();
    if (socialLink !== undefined) user.socialLink = socialLink.trim();
    if (institute !== undefined) user.institute = institute.trim();
    if (professionalRole !== undefined) user.professionalRole = professionalRole.trim();
    user.lastActive = new Date();

    await user.save();
    res.json({ success: true, user: toClientUser(user) });
  } catch (error) {
    console.error('Failed to complete profile:', error);
    res.status(500).json({ error: 'Failed to update user profile.' });
  }
});

// GET: Check daily practice count for logged-in user
router.get('/practice-status', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const today = new Date().toISOString().split('T')[0];
    const lastDate = user.lastPracticeDate ? user.lastPracticeDate.toISOString().split('T')[0] : null;

    let count = user.dailyPracticeCount || 0;
    if (lastDate !== today) {
      count = 0; // Reset count on a new day
    }
    res.json({ dailyPracticeCount: count });
  } catch (error) {
    console.error('Failed to get practice status:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// POST: Increment daily practice count for logged-in user
router.post('/increment-practice', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const today = new Date().toISOString().split('T')[0];
    const lastDate = user.lastPracticeDate ? user.lastPracticeDate.toISOString().split('T')[0] : null;

    if (lastDate !== today) {
      user.dailyPracticeCount = 1;
    } else {
      user.dailyPracticeCount = (user.dailyPracticeCount || 0) + 1;
    }
    user.lastPracticeDate = new Date();
    await user.save();

    res.json({ success: true, dailyPracticeCount: user.dailyPracticeCount });
  } catch (error) {
    console.error('Failed to increment practice count:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;