const express = require('express');
const Setting = require('../models/Setting');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Map of URL slugs -> the JSON field name the frontend sends/expects.
const SETTING_FIELDS = {
  'logo': 'websiteLogo',
  'm-square-logo': 'mSquareLogo',
  'mira-core-logo': 'miraCoreLogo',
  'founder-picture': 'founderPicture',
  'founder-picture-size': 'founderPictureSize',
  'admin-signature': 'adminSignaturePic'
};

// Register a public GET and an admin-only POST for every branding setting.
Object.entries(SETTING_FIELDS).forEach(([slug, field]) => {

  // GET /api/settings/<slug> -> { <field>: value }
  router.get(`/${slug}`, async (req, res) => {
    try {
      const doc = await Setting.findOne({ key: field });
      res.json({ [field]: doc ? doc.value : '' });
    } catch (error) {
      console.error(`Error fetching setting ${field}:`, error);
      res.status(500).json({ error: `Failed to load ${field}.` });
    }
  });

  // POST /api/settings/<slug> with body { <field>: value } (Super Admin only)
  router.post(`/${slug}`, protect, adminOnly, async (req, res) => {
    try {
      const value = req.body[field];
      if (value === undefined) {
        return res.status(400).json({ error: `Missing field "${field}" in request body.` });
      }
      const doc = await Setting.findOneAndUpdate(
        { key: field },
        { value },
        { new: true, upsert: true }
      );
      res.json({ success: true, [field]: doc.value });
    } catch (error) {
      console.error(`Error saving setting ${field}:`, error);
      res.status(500).json({ error: `Failed to save ${field}.` });
    }
  });
});

module.exports = router;
