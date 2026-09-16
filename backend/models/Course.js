const mongoose = require('mongoose');

const lessonItemSchema = new mongoose.Schema({
  lessonId: { type: String, required: true },
  title: { type: String, required: true },
  text: { type: String, required: true },
  instructions: { type: String, default: '' },
  targetKeys: [{ type: String }],
  targetFinger: { type: String, default: 'index' },
  minWpm: { type: Number, default: 15 },
  minAccuracy: { type: Number, default: 90 },
  xpReward: { type: Number, default: 25 },
  coinsReward: { type: Number, default: 15 },
  order: { type: Number, default: 0 }
});

const courseSchema = new mongoose.Schema(
  {
    courseId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Pro'],
      default: 'Beginner'
    },
    category: {
      type: String,
      default: 'Beginner'
    },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    lessons: [lessonItemSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Course', courseSchema);
