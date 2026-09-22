const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // User identifier for the log
  actionType: { 
    type: String, 
    enum: ['PRACTICE', 'CONTEST_JOIN', 'CONTEST_FINISH', 'PROFILE_UPDATE', 'LEVEL_UP', 'CERTIFICATE_CLAIM', 'LOGIN'], 
    required: true 
  },
  details: { type: String, required: true }, // Example: "Joined Global Speed Match" or "Scored 45 WPM"
  metadata: { type: Object }, // Extra metadata such as WPM, Accuracy, Contest ID, etc.
  createdAt: { type: Date, default: Date.now }
});

// Storage guard: only recent activity is ever read back (routes cap at 50/250),
// so let MongoDB auto-purge old entries via a TTL index instead of letting the
// collection grow unbounded. Retention is configurable (default 90 days).
const ACTIVITY_LOG_TTL_DAYS = Math.max(1, parseInt(process.env.ACTIVITY_LOG_TTL_DAYS || '90', 10) || 90);
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: ACTIVITY_LOG_TTL_DAYS * 24 * 60 * 60 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);