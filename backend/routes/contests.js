const express = require('express');
const Contest = require('../models/Contest');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Helper to generate a 6-character room invite code
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'FIG';
  for (let i = 0; i < 3; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Handler for Creating a Contest / Race Room
const handleCreateContest = async (req, res) => {
  try {
    const data = { ...req.body };
    if (!data.inviteCode) {
      data.inviteCode = generateRoomCode();
    }
    data.shareCode = data.inviteCode;
    data.joinCode = data.inviteCode;
    data.createdBy = req.user.id;
    data.hostUsername = req.user.username || 'Host';
    if (!data.status) data.status = 'LOBBY';

    // Normalize text input between passage and contestText
    if (!data.passage && data.contestText) {
      data.passage = data.contestText;
    }
    if (!data.passage) {
      data.passage = 'The quick brown fox jumps over the lazy dog.';
    }

    if (data.contestLogo && !data.logoUrl) {
      data.logoUrl = data.contestLogo;
    }

    const newContest = new Contest(data);
    await newContest.save();

    res.status(201).json({
      success: true,
      message: "Race room launched successfully!",
      contest: newContest
    });
  } catch (error) {
    console.error("Error creating contest:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to launch contest room." });
  }
};

// 1. Create a New Contest / Race Room (Accessible at both / and /create)
router.post('/create', protect, handleCreateContest);
router.post('/', protect, handleCreateContest);

// 2. Get All Contests API (For the Arena)
router.get('/', async (req, res) => {
  try {
    const contests = await Contest.find().sort({ createdAt: -1 });
    res.json({ success: true, contests });
  } catch (error) {
    console.error("Error fetching contests:", error);
    res.status(500).json({ success: false, error: "Failed to load contests." });
  }
});

// 2b. Lookup contest by Invite Code / Share Code
router.get('/code/:code', async (req, res) => {
  try {
    const code = req.params.code.trim().toUpperCase();
    const contest = await Contest.findOne({
      $or: [
        { inviteCode: code },
        { shareCode: code },
        { joinCode: code }
      ]
    });
    if (!contest) {
      return res.status(404).json({ success: false, error: "Race room not found." });
    }
    res.json({ success: true, contest });
  } catch (error) {
    console.error("Error fetching contest by code:", error);
    res.status(500).json({ success: false, error: "Failed to search contest." });
  }
});

// 3. Update a Contest API (Super Admin or Room Host)
router.put('/:id', protect, async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);
    if (!contest) {
      return res.status(404).json({ success: false, error: "Contest not found." });
    }

    const isAdmin = req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN';
    const isOwner = contest.createdBy && contest.createdBy.toString() === req.user.id;
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, error: "Unauthorized to modify this race room." });
    }

    const updateData = { ...req.body };
    if (updateData.startTime !== undefined) {
      updateData.startTime = updateData.startTime ? new Date(updateData.startTime) : null;
    }
    if (updateData.endTime !== undefined) {
      updateData.endTime = updateData.endTime ? new Date(updateData.endTime) : null;
    }
    if (updateData.duration !== undefined) {
      updateData.duration = Number(updateData.duration) || contest.duration;
    }
    if (updateData.passage) {
      updateData.passage = updateData.passage.trim();
    }

    const updated = await Contest.findByIdAndUpdate(req.params.id, updateData, { returnDocument: 'after' });
    res.json({ success: true, message: "Contest updated successfully!", contest: updated });
  } catch (error) {
    console.error("Error updating contest:", error);
    res.status(500).json({ success: false, error: "Failed to update contest: " + (error.message || error) });
  }
});

// 3b. Toggle Contest Status API (Admin or Room Host)
router.patch('/:id/toggle-status', protect, async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);
    if (!contest) {
      return res.status(404).json({ success: false, error: "Contest not found." });
    }

    const isAdmin = req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN';
    const isOwner = contest.createdBy && contest.createdBy.toString() === req.user.id;
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, error: "Unauthorized to modify this race room." });
    }

    const newStatus = contest.status === 'INACTIVE' ? 'LOBBY' : 'INACTIVE';
    contest.status = newStatus;
    await contest.save();

    res.json({
      success: true,
      message: `Contest ${newStatus === 'INACTIVE' ? 'turned off' : 'reactivated'} successfully!`,
      contest
    });
  } catch (error) {
    console.error("Error toggling contest status:", error);
    res.status(500).json({ success: false, error: "Failed to toggle contest status." });
  }
});

// 4. Delete a Contest API (Super Admin or Room Host)
router.delete('/:id', protect, async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);
    if (!contest) {
      return res.status(404).json({ success: false, error: "Contest not found." });
    }

    const isAdmin = req.user.role === 'SUPER_ADMIN';
    const isOwner = contest.createdBy && contest.createdBy.toString() === req.user.id;
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, error: "Unauthorized to delete this race room." });
    }

    await Contest.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Contest deleted successfully!" });
  } catch (error) {
    console.error("Error deleting contest:", error);
    res.status(500).json({ success: false, error: "Failed to delete contest." });
  }
});

module.exports = router;
