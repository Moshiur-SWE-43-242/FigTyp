const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  fullName: { type: String, required: true },
  mode: { type: String, required: true },
  wpm: { type: Number, required: true },
  accuracy: { type: Number, required: true },
  signature: { type: String, default: 'Md Moshiur Rahaman Riat' },
  issueDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Certificate', certificateSchema);