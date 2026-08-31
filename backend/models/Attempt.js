const mongoose = require('mongoose');

const attemptSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  contestId: { type: String, index: true }, // To track which contest (if any) this attempt belongs to
  mode: { type: String, enum: ['time', 'words', 'quote', 'code', 'course', 'contest'], default: 'quote' },
  duration: { type: Number, default: 0 },
  wordCount: { type: Number, default: 0 },
  wpm: { type: Number, default: 0, index: true },
  rawWpm: { type: Number, default: 0 },
  accuracy: { type: Number, default: 100 },
  consistency: { type: Number, default: 100 },
  correctChars: { type: Number, default: 0 },
  incorrectChars: { type: Number, default: 0 },
  totalChars: { type: Number, default: 0 },
  errorHeatmap: { type: Object, default: {} }
}, {
  timestamps: true
});

module.exports = mongoose.model('Attempt', attemptSchema);
