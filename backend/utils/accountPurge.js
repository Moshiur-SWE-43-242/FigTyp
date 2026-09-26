const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

/**
 * Automated 1-Year Inactivity Account Purge
 * Finds and permanently deletes accounts (excluding SUPER_ADMIN) that have
 * had zero login activity for over 1 year (365 days).
 */
const purgeInactiveAccounts = async () => {
  try {
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const filter = {
      role: { $ne: 'SUPER_ADMIN' },
      $or: [
        { lastLogin: { $lt: oneYearAgo } },
        { lastLogin: { $exists: false }, createdAt: { $lt: oneYearAgo } }
      ]
    };

    const count = await User.countDocuments(filter);
    if (count > 0) {
      const usersToPurge = await User.find(filter).select('_id username email').lean();
      const userIds = usersToPurge.map(u => u._id);
      
      const result = await User.deleteMany({ _id: { $in: userIds } });
      
      await ActivityLog.create({
        actionType: 'SYSTEM_PURGE',
        details: `Security Auto-Purge: Permanently removed ${result.deletedCount} account(s) inactive for >1 year (365 days).`,
        metadata: {
          purgedCount: result.deletedCount,
          purgedUsernames: usersToPurge.map(u => u.username)
        }
      }).catch(() => {});

      console.log(`🛡️ [Security Retention] Automatically purged ${result.deletedCount} inactive account(s) (>1 year no login).`);
    } else {
      console.log('🛡️ [Security Retention] Inactive account audit complete: No stale accounts (>1 year) detected.');
    }
  } catch (err) {
    console.error('❌ [Security Retention] Inactive account purge error:', err.message);
  }
};

module.exports = { purgeInactiveAccounts };
