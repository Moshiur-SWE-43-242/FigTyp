const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, default: '' },
  phoneNumber: { type: String, default: '' },
  bio: { type: String, default: '' },
  country: { type: String, default: '' },
  socialLink: { type: String, default: '' },
  institute: { type: String, default: '' },
  professionalRole: { type: String, default: '' },
  registrationId: { type: String, default: '', unique: false },
  themePreference: { type: String, default: 'theme_cyan' },
  avatarUrl: { type: String, default: '' },
  badges: { type: [String], default: [] },
  completedLessons: { type: [String], default: [] },
  streak: { type: Number, default: 0 },
  streakLastUpdated: { type: Date },
  lastActive: { type: Date },
  lastLogin: { type: Date, default: Date.now },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  coins: { type: Number, default: 0 },
  role: { type: String, enum: ['GENERAL_USER', 'SUPER_ADMIN'], default: 'GENERAL_USER' },
  
  // Host Approval for Contest Logo & Expanded Participants
  isApprovedHost: { type: Boolean, default: false },
  hostRequestStatus: { type: String, enum: ['NONE', 'PENDING', 'APPROVED', 'REJECTED'], default: 'NONE' },

  // OTP Verification Fields
  isVerified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpires: { type: Date }
}, { 
  timestamps: true 
});

// Storage guard: abandoned sign-ups (registered but never OTP-verified) otherwise
// linger forever. This TTL index removes such accounts once their OTP window has
// passed. Verified users clear `otpExpires`, so they are never matched (both the
// missing-field rule of TTL indexes and the partial filter protect them).
userSchema.index(
  { otpExpires: 1 },
  { expireAfterSeconds: 0, partialFilterExpression: { isVerified: false } }
);

module.exports = mongoose.model('User', userSchema);
