const express = require('express');
const Blog = require('../models/Blog');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Helper to generate a slug from title
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

// GET /api/blogs - Get all published blogs (supports search & tag query)
router.get('/', async (req, res) => {
  try {
    const { search, tag, includeDrafts } = req.query;
    const query = {};

    // Only include drafts if explicitly requested by an admin query or in admin panel
    if (includeDrafts !== 'true') {
      query.isPublished = true;
    }

    if (tag) {
      query.tags = { $in: [tag] };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const blogs = await Blog.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: blogs.length, blogs });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({ error: 'Failed to retrieve blog articles.' });
  }
});

// GET /api/blogs/:slug - Get single blog post by slug
router.get('/:slug', async (req, res) => {
  try {
    const blog = await Blog.findOneAndUpdate(
      { slug: req.params.slug },
      { $inc: { viewsCount: 1 } },
      { returnDocument: 'after' }
    );

    if (!blog) {
      return res.status(404).json({ error: 'Article not found.' });
    }

    res.json({ success: true, blog });
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({ error: 'Failed to retrieve article.' });
  }
});

// POST /api/blogs - Create a new blog article (Super Admin only)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { title, excerpt, content, coverImage, author, readTimeMinutes, tags, isPublished, slug: customSlug } = req.body;

    if (!title || !content || !excerpt) {
      return res.status(400).json({ error: 'Title, excerpt, and content are required.' });
    }

    let finalSlug = customSlug ? slugify(customSlug) : slugify(title);

    // Ensure slug uniqueness
    const existing = await Blog.findOne({ slug: finalSlug });
    if (existing) {
      finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
    }

    const newBlog = await Blog.create({
      title,
      slug: finalSlug,
      excerpt,
      content,
      coverImage: coverImage || '',
      author: author || {
        name: 'FigTyp Master Instructor',
        role: 'Keystroke Specialist',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
      },
      readTimeMinutes: Number(readTimeMinutes) || Math.max(3, Math.ceil(content.split(/\s+/).length / 200)),
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : ['Touch Typing']),
      isPublished: isPublished !== undefined ? Boolean(isPublished) : true
    });

    res.status(201).json({ success: true, blog: newBlog });
  } catch (error) {
    console.error('Error creating blog:', error);
    res.status(500).json({ error: error.message || 'Failed to create blog post.' });
  }
});

// PUT /api/blogs/:id - Update an existing blog article (Super Admin only)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { title, excerpt, content, coverImage, author, readTimeMinutes, tags, isPublished, slug: customSlug } = req.body;

    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: 'Article not found.' });
    }

    if (title) blog.title = title;
    if (excerpt) blog.excerpt = excerpt;
    if (content) blog.content = content;
    if (coverImage !== undefined) blog.coverImage = coverImage;
    if (author) blog.author = { ...blog.author, ...author };
    if (readTimeMinutes) blog.readTimeMinutes = Number(readTimeMinutes);
    if (tags !== undefined) {
      blog.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
    }
    if (isPublished !== undefined) blog.isPublished = Boolean(isPublished);
    if (customSlug) blog.slug = slugify(customSlug);

    await blog.save();
    res.json({ success: true, blog });
  } catch (error) {
    console.error('Error updating blog:', error);
    res.status(500).json({ error: error.message || 'Failed to update article.' });
  }
});

// DELETE /api/blogs/:id - Delete a blog article (Super Admin only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: 'Article not found.' });
    }
    res.json({ success: true, message: 'Article deleted successfully.' });
  } catch (error) {
    console.error('Error deleting blog:', error);
    res.status(500).json({ error: 'Failed to delete article.' });
  }
});

module.exports = router;
