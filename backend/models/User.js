const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, default: '' },
  phoneNumber: { type: String, default: '' },
  socialLink: { type: String, default: '' },
  institute: { type: String, default: '' },
  professionalRole: { type: String, default: '' },
  themePreference: { type: String, default: 'theme_cyan' },
  avatarUrl: { type: String, default: '' },
  badges: { type: [String], default: [] },
  streak: { type: Number, default: 0 },
  lastActive: { type: Date },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  coins: { type: Number, default: 0 },
  role: { type: String, enum: ['GENERAL_USER', 'SUPER_ADMIN'], default: 'GENERAL_USER' },
  
  // OTP Verification Fields
  isVerified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpires: { type: Date }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('User', userSchema);
