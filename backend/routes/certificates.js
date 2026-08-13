const express = require('express');
const Certificate = require('../models/Certificate');
const { protect, adminOnly } = require('../middleware/auth');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
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

// Claim contest certificate (creates a PENDING certificate requiring admin approval)
router.post('/claim', protect, async (req, res) => {
  try {
    const { wpm, accuracy, challengeMode, fullName } = req.body;
    const user = await User.findById(req.user.id).select('email username');
    const userEmail = user?.email || null;
    const username = user?.username || null;

    const cert = new Certificate({
      userId: req.user.id,
      fullName: fullName || username || 'FigTyp User',
      mode: challengeMode || 'Contest',
      wpm,
      accuracy,
      status: 'PENDING',
      recipientEmail: userEmail
    });

    await cert.save();
    res.status(201).json({ success: true, certificate: { id: cert._id, status: cert.status } });
  } catch (err) {
    console.error('Failed to claim certificate:', err);
    res.status(500).json({ error: 'Failed to claim certificate.' });
  }
});

// Admin approves a pending certificate and notifies user by email
router.patch('/:id/approve', protect, adminOnly, async (req, res) => {
  try {
    const cert = await Certificate.findById(req.params.id);
    if (!cert) return res.status(404).json({ error: 'Certificate not found.' });
    cert.status = 'APPROVED';
    cert.approvedBy = req.user.id;
    cert.approvedAt = new Date();
    await cert.save();

    // Send notification email to recipient with a link to download/view certificate
    try {
      const recipient = cert.recipientEmail;
      if (recipient) {
        const front = process.env.FRONTEND_URL || 'https://typist.miracore.net';
        const downloadLink = `${front}/certificates/${cert._id}`;
        const html = `
          <div style="background:#0b0f19;padding:20px;color:#cbd5e1;font-family:Segoe UI,Roboto,Arial;">
            <h2 style="color:#00F3FF">Your FigTyp Certificate is Approved</h2>
            <p>Congratulations <strong>${cert.fullName}</strong>! Your certificate for <strong>${cert.mode}</strong> has been approved by admin.</p>
            <p>WPM: <strong>${cert.wpm}</strong> • Accuracy: <strong>${cert.accuracy}%</strong></p>
            <p><a href="${downloadLink}" style="color:#00F3FF;font-weight:bold;">Click here to view or download your certificate</a></p>
          </div>
        `;
        await sendEmail({ email: recipient, subject: 'Your FigTyp Certificate is Approved', html });
      }
    } catch (emailErr) {
      console.error('Failed to send certificate approval email:', emailErr);
    }

    res.json({ success: true, certificate: cert });
  } catch (err) {
    console.error('Approve certificate failed:', err);
    res.status(500).json({ error: 'Failed to approve certificate.' });
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