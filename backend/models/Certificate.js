const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  fullName: { type: String, required: true },
  institute: { type: String, default: '' },
  mode: { type: String, required: true },
  wpm: { type: Number, required: true },
  accuracy: { type: Number, required: true },
  signature: { type: String, default: 'Md Moshiur Rahaman Riat' },
  issueDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REVOKED', 'DECLINED'], default: 'APPROVED' },
  approvedBy: { type: String, default: null },
  approvedAt: { type: Date, default: null },
  recipientEmail: { type: String, default: null },
  contestId: { type: String, default: null },
  contestTitle: { type: String, default: null },
  contestLogo: { type: String, default: null }
});

module.exports = mongoose.model('Certificate', certificateSchema);