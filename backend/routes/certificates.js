const express = require('express');
const Certificate = require('../models/Certificate');
const { protect } = require('../middleware/auth');
const router = express.Router();

// Generate New Certificate (logged-in users only)
router.post('/generate', protect, async (req, res) => {
  try {
    const { wpm, accuracy, challengeMode, fullName } = req.body;
    
    const newCert = new Certificate({
      userId: req.user.id,
      fullName: fullName || 'FigTyp User',
      mode: challengeMode || 'Arena Match',
      wpm,
      accuracy
    });
    
    await newCert.save();

    res.status(200).json({ 
      success: true, 
      certificate: {
        id: newCert._id,
        fullName: newCert.fullName,
        mode: newCert.mode,
        wpm: newCert.wpm,
        accuracy: newCert.accuracy,
        issueDate: newCert.issueDate,
        signature: newCert.signature
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate certificate." });
  }
});

// Get All Certificates for current user
router.get('/', protect, async (req, res) => {
  try {
    const certs = await Certificate.find({ userId: req.user.id }).sort({ issueDate: -1 });
    const formattedCerts = certs.map(c => ({
      id: c._id,
      fullName: c.fullName,
      mode: c.mode,
      wpm: c.wpm,
      accuracy: c.accuracy,
      issueDate: c.issueDate,
      signature: c.signature
    }));
    res.json(formattedCerts);
  } catch (error) {
    res.status(500).json({ error: "Failed to load certificates." });
  }
});

module.exports = router;