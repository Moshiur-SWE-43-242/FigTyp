const mongoose = require('mongoose');

const wordBankSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    category: {
      type: String,
      enum: ['tech', 'common200', 'common1000', 'quotes', 'code', 'custom'],
      default: 'tech'
    },
    description: { type: String, default: '' },
    words: [{ type: String }],
    passages: [{ type: String }],
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard', 'Expert'],
      default: 'Medium'
    },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('WordBank', wordBankSchema);
