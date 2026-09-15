const express = require('express');
const CMSContent = require('../models/CMSContent');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (user && user.role === 'SUPER_ADMIN') {
      next();
    } else {
      res.status(403).json({ error: 'Admin access required' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Authorization error' });
  }
};

// GET: Fetch all content for a specific content type
router.get('/type/:contentType', async (req, res) => {
  try {
    const { contentType } = req.params;
    const content = await CMSContent.find({
      contentType,
      isActive: true
    })
      .sort({ order: 1 })
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username');

    res.json(content);
  } catch (error) {
    console.error('Failed to fetch CMS content:', error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

// GET: Fetch specific content by key
router.get('/key/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const content = await CMSContent.findOne({ key, isActive: true })
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username');

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    res.json(content);
  } catch (error) {
    console.error('Failed to fetch CMS content:', error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

// GET: Fetch all CMS content (admin only)
router.get('/', protect, isAdmin, async (req, res) => {
  try {
    const content = await CMSContent.find()
      .sort({ contentType: 1, order: 1 })
      .populate('createdBy', 'username email')
      .populate('updatedBy', 'username email');

    res.json(content);
  } catch (error) {
    console.error('Failed to fetch CMS content:', error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

const applyCMSContentUpdates = (content, updates) => {
  const {
    contentType,
    key,
    title,
    shortDescription,
    fullDescription,
    date,
    color,
    data,
    order,
    isActive
  } = updates;

  if (contentType !== undefined) content.contentType = contentType;
  if (key !== undefined) content.key = key;
  if (title !== undefined) content.title = title;
  if (shortDescription !== undefined) content.shortDescription = shortDescription;
  if (fullDescription !== undefined) content.fullDescription = fullDescription;
  if (date !== undefined) content.date = date;
  if (color !== undefined) content.color = color;
  if (data !== undefined) content.data = data;
  if (order !== undefined) content.order = order;
  if (isActive !== undefined) content.isActive = isActive;
};

// POST: Create new CMS content (admin only)
router.post('/', protect, isAdmin, async (req, res) => {
  try {
    const { contentType, key, title, shortDescription, fullDescription, date, color, data, order } = req.body;

    if (!contentType || !key) {
      return res.status(400).json({ error: 'Content type and key are required' });
    }

    // Check for duplicate key
    const existing = await CMSContent.findOne({ key });
    if (existing) {
      return res.status(400).json({ error: 'Content key already exists' });
    }

    const content = new CMSContent({
      contentType,
      key,
      title,
      shortDescription,
      fullDescription,
      date,
      color,
      data,
      order: order || 0,
      createdBy: req.user.id
    });

    await content.save();
    res.status(201).json({ success: true, content });
  } catch (error) {
    console.error('Failed to create CMS content:', error);
    res.status(500).json({ error: 'Failed to create content' });
  }
});

// PUT: Update CMS content (admin only)
router.put('/:id', protect, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const content = await CMSContent.findById(id);
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    if (req.body.key && req.body.key !== content.key) {
      const duplicate = await CMSContent.findOne({ key: req.body.key, _id: { $ne: id } });
      if (duplicate) {
        return res.status(400).json({ error: 'Content key already exists' });
      }
    }

    applyCMSContentUpdates(content, req.body);
    content.updatedBy = req.user.id;
    await content.save();

    res.json({ success: true, content });
  } catch (error) {
    console.error('Failed to update CMS content:', error);
    res.status(500).json({ error: 'Failed to update content' });
  }
});

// PATCH: Partial update CMS content (admin only, docs-compatible)
router.patch('/:id', protect, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const content = await CMSContent.findById(id);
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    if (req.body.key && req.body.key !== content.key) {
      const duplicate = await CMSContent.findOne({ key: req.body.key, _id: { $ne: id } });
      if (duplicate) {
        return res.status(400).json({ error: 'Content key already exists' });
      }
    }

    applyCMSContentUpdates(content, req.body);
    content.updatedBy = req.user.id;
    await content.save();

    res.json({ success: true, content });
  } catch (error) {
    console.error('Failed to patch CMS content:', error);
    res.status(500).json({ error: 'Failed to update content' });
  }
});

// DELETE: Delete CMS content (admin only)
router.delete('/:id', protect, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const content = await CMSContent.findByIdAndDelete(id);

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    res.json({ success: true, message: 'Content deleted' });
  } catch (error) {
    console.error('Failed to delete CMS content:', error);
    res.status(500).json({ error: 'Failed to delete content' });
  }
});

module.exports = router;
