const mongoose = require('mongoose');

// Generic key/value store for site-wide branding & configuration.
// value is Mixed so it can hold base64 image strings, URLs or numbers.
const settingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, default: '' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Setting', settingSchema);
