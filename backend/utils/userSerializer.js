// Helper to convert Mongoose User document to a sanitized client object and manage daily streaks

const toClientUser = (user) => {
  if (!user) return null;
  return {
    id: user._id ? user._id.toString() : user.id,
    username: user.username || '',
    email: user.email || '',
    fullName: user.fullName || '',
    phoneNumber: user.phoneNumber || '',
    bio: user.bio || '',
    country: user.country || '',
    socialLink: user.socialLink || '',
    institute: user.institute || '',
    professionalRole: user.professionalRole || '',
    registrationId: user.registrationId || '',
    themePreference: user.themePreference || 'theme_cyan',
    avatarUrl: user.avatarUrl || '',
    xp: user.xp || 0,
    level: user.level || 1,
    coins: user.coins || 0,
    streak: typeof user.streak === 'number' ? user.streak : 0,
    streakLastUpdated: user.streakLastUpdated ? (user.streakLastUpdated.toISOString ? user.streakLastUpdated.toISOString() : user.streakLastUpdated) : null,
    role: user.role || 'GENERAL_USER',
    badges: user.badges || [],
    completedLessons: user.completedLessons || [],
    dailyPracticeCount: user.dailyPracticeCount || 0,
    customLogoApproval: user.customLogoApproval || 'NONE',
    customLogoOrgName: user.customLogoOrgName || '',
    lastActive: user.lastActive ? (user.lastActive.toISOString ? user.lastActive.toISOString() : user.lastActive) : null,
    createdAt: user.createdAt ? (user.createdAt.toISOString ? user.createdAt.toISOString() : user.createdAt) : null,
    updatedAt: user.updatedAt ? (user.updatedAt.toISOString ? user.updatedAt.toISOString() : user.updatedAt) : null
  };
};

const updateDailyStreak = (user) => {
  if (!user) return;
  const now = new Date();
  const lastActive = user.streakLastUpdated || user.lastActive;

  if (!lastActive) {
    user.streak = Math.max(1, user.streak || 1);
    user.streakLastUpdated = now;
    user.lastActive = now;
    return;
  }

  const lastDate = new Date(lastActive);
  const diffMs = now.getTime() - lastDate.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  const isSameDay =
    now.getUTCFullYear() === lastDate.getUTCFullYear() &&
    now.getUTCMonth() === lastDate.getUTCMonth() &&
    now.getUTCDate() === lastDate.getUTCDate();

  if (isSameDay) {
    // User already active today: keep streak and touch lastActive
    user.lastActive = now;
  } else if (diffHours > 48) {
    // Missed streak window: reset to 1
    user.streak = 1;
    user.streakLastUpdated = now;
    user.lastActive = now;
  } else {
    // Consecutive day (either 18h-48h or next calendar day): increment streak
    user.streak = (user.streak || 0) + 1;
    user.streakLastUpdated = now;
    user.lastActive = now;
  }
};

module.exports = {
  toClientUser,
  updateDailyStreak
};
