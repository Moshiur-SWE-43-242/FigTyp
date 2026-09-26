const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  excerpt: { type: String, required: true },
  content: { type: String, required: true },
  coverImage: { type: String, default: '' },
  author: {
    name: { type: String, default: 'FigTyp Research Team' },
    role: { type: String, default: 'Keyboard Performance Lab' },
    avatar: { type: String, default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' }
  },
  readTimeMinutes: { type: Number, default: 5 },
  tags: [{ type: String, trim: true }],
  isPublished: { type: Boolean, default: true },
  viewsCount: { type: Number, default: 0 }
}, {
  timestamps: true
});

module.exports = mongoose.model('Blog', blogSchema);
