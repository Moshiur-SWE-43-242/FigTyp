const mongoose = require('mongoose');

const contestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  duration: { type: Number, required: true }, // Number format for seconds
  visibility: { type: String, enum: ['PUBLIC', 'PRIVATE'], default: 'PUBLIC' }, 
  startTime: { type: Date },
  endTime: { type: Date },
  passage: { type: String, required: true },
  inviteCode: { type: String },
  shareCode: { type: String },
  shareUrl: { type: String },
  joinCode: { type: String },
  createdBy: { type: String } 
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Contest', contestSchema);