const express = require('express');
const CMSContent = require('../models/CMSContent');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Middleware to check if user is admin (Super Admin or Admin)
const isAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN')) {
    return next();
  }
  return res.status(403).json({ error: 'Admin access required' });
};

// Auto-seed default CMS timeline if database is empty
const seedDefaultCMS = async () => {
  try {
    const count = await CMSContent.countDocuments();
    if (count > 0) return;

    const defaultTimeline = [
      {
        contentType: 'timeline',
        key: 'consortium_formed_feb2025',
        title: 'M-Square Devs Group Consortium Formed',
        shortDescription: 'The engineering consortium commenced shaping FigTyp\'s modular learning architecture and design systems.',
        fullDescription: 'The M-Square Devs Group consortium was established to architect and deliver FigTyp\'s immersive learning ecosystem. The team focused on designing modular curriculum architecture, premium user interfaces, and comprehensive learning pathways prioritizing cognitive engagement and mechanical accuracy.',
        date: 'Feb 2025',
        color: 'purple',
        order: 1,
        isActive: true
      },
      {
        contentType: 'timeline',
        key: 'neural_telemetry_oct2025',
        title: 'Real-Time Neural Telemetry Engine',
        shortDescription: 'Platform research team rolled out kinetic typing intelligence, live WebSocket competition rooms, and finger heatmaps.',
        fullDescription: 'Platform expansion phase saw significant advancement in typing intelligence algorithms, real-time analytics engines, and professional certification systems. The team integrated cognitive workflow design patterns to maximize skill retention and performance tracking capabilities.',
        date: 'Oct 2025',
        color: 'cyan',
        order: 2,
        isActive: true
      },
      {
        contentType: 'timeline',
        key: 'daffodil_swe_2026_q1',
        title: 'Daffodil SWE Engineering Alliance',
        shortDescription: 'Moshiur Riat initiates prototyping of FigTyp enterprise architecture with Daffodil International University standards.',
        fullDescription: 'Academic and software engineering research collaboration with Daffodil International University to prototype and validate FigTyp\'s modular design specifications. This partnership brought rigorous software testing, scalable MongoDB schema design, and deterministic socket state synchronization to the platform.',
        date: '2026, Q1',
        color: 'emerald',
        order: 3,
        isActive: true
      },
      {
        contentType: 'timeline',
        key: 'commercial_saas_2026',
        title: 'Commercial SaaS & Global Arena Release',
        shortDescription: 'FigTyp Arena officially enters production, offering low-latency multiplayer races, verifiable certificates, and CMU.',
        fullDescription: 'FigTyp Arena officially launched as a full-featured commercial SaaS platform, introducing competitive typing arenas with real-time multiplayer capabilities, SHA-256 verifiable diploma certificates, and autonomous Control Management Unit.',
        date: '2026',
        color: 'teal',
        order: 4,
        isActive: true
      }
    ];

    await CMSContent.insertMany(defaultTimeline);
    console.log('Default CMS timeline content initialized.');
  } catch (err) {
    console.error('Failed to seed default CMS content:', err);
  }
};
seedDefaultCMS();

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
