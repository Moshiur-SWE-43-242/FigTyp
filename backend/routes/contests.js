const express = require('express');
const Contest = require('../models/Contest');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// 1. Create a New Contest API (Super Admin only)
router.post('/create', protect, adminOnly, async (req, res) => {
  try {
    const newContest = new Contest(req.body);
    await newContest.save();

    res.status(201).json({
      success: true,
      message: "Contest launched successfully!",
      contest: newContest
    });
  } catch (error) {
    console.error("Error creating contest:", error);
    res.status(500).json({ success: false, error: "Failed to launch contest." });
  }
});

// 2. Get All Contests API (For the Arena)
router.get('/', async (req, res) => {
  try {
    // Fetch all contests, sorting by newest first
    const contests = await Contest.find().sort({ createdAt: -1 });
    res.json({ success: true, contests });
  } catch (error) {
    console.error("Error fetching contests:", error);
    res.status(500).json({ success: false, error: "Failed to load contests." });
  }
});

// 3. Update a Contest API (Super Admin only)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const updated = await Contest.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, error: "Contest not found." });
    }
    res.json({ success: true, message: "Contest updated successfully!", contest: updated });
  } catch (error) {
    console.error("Error updating contest:", error);
    res.status(500).json({ success: false, error: "Failed to update contest." });
  }
});

// 4. Delete a Contest API (Super Admin only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const deleted = await Contest.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: "Contest not found." });
    }
    res.json({ success: true, message: "Contest deleted successfully!" });
  } catch (error) {
    console.error("Error deleting contest:", error);
    res.status(500).json({ success: false, error: "Failed to delete contest." });
  }
});

module.exports = router;
