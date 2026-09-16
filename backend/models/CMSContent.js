const mongoose = require('mongoose');

const cmsContentSchema = new mongoose.Schema(
  {
    contentType: {
      type: String,
      required: true
    },
    key: {
      type: String,
      required: true,
      unique: true
    },
    title: String,
    shortDescription: String,
    fullDescription: String,
    date: String,
    color: String,
    data: {
      type: mongoose.Schema.Types.Mixed
    },
    isActive: {
      type: Boolean,
      default: true
    },
    order: {
      type: Number,
      default: 0
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('CMSContent', cmsContentSchema);
