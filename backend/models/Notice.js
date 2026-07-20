const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  active: { type: Boolean, default: true },
  createdBy: { type: String, default: '' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notice', noticeSchema);
