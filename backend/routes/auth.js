const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const sendEmail = require('../utils/sendEmail'); 

const router = express.Router();

// 1. User Registration & Send OTP API
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      return res.status(400).json({ error: "Username or Email already exists." });
    }

    // Hash the password for security
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // Valid for 10 minutes

    // --- SUPER ADMIN LOGIC ---
    // Assign SUPER_ADMIN role to emails listed in SUPER_ADMIN_EMAILS (comma-separated), otherwise GENERAL_USER
    const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || 'riat.moshiur22@gmail.com,rahaman242-35-606@diu.edu.bd')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);
    const userRole = superAdminEmails.includes(email.toLowerCase()) ? 'SUPER_ADMIN' : 'GENERAL_USER';

    // Create new unverified user
    user = new User({
      username,
      email,
      password: hashedPassword,
      role: userRole,
      otp,
      otpExpires
    });

    await user.save();

    // Send OTP to user's email in HTML format
    const emailHTML = `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <p>Dear ${username},</p>
        
        <p>Welcome to FigTyp Arena!</p>
        
        <p style="font-size: 16px;"><strong>Your verification OTP is: ${otp}</strong></p>
        
        <p>This code is valid for 10 minutes. For security reasons, please do not share this OTP with anyone.</p>
        
        <p>Thank you for joining us!</p>
        
        <p>Best regards,<br>
        <strong>Md Moshiur Rahaman Riat</strong><br>
        Founder, FigTyp</p>
      </div>
    `;
    
    await sendEmail({
      email: user.email,
      subject: 'FigTyp Arena - Account Verification OTP',
      html: emailHTML 
    });

    res.status(201).json({ message: "OTP sent to your email. Please verify." });

  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ error: "Server error during registration." });
  }
});

// 2. Verify OTP API

router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "User not found." });
    }

    // Check if OTP is correct and not expired
    if (user.otp !== otp || user.otpExpires < new Date()) {
      return res.status(400).json({ error: "Invalid or expired OTP." });
    }

    // Update user verification status
    user.isVerified = true;
    user.otp = undefined; // Clear OTP
    user.otpExpires = undefined; // Clear expiration
    user.lastActive = new Date();
    await user.save();

    await ActivityLog.create({
      userId: String(user._id),
      actionType: 'PROFILE_UPDATE',
      details: 'User verified account with OTP',
      metadata: { email: user.email }
    });

    // Generate Login Token
    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.json({
      message: "Account verified successfully!",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        xp: user.xp,
        level: user.level,
        coins: user.coins
      }
    });

  } catch (error) {
    console.error("OTP Verification Error:", error);
    res.status(500).json({ error: "Server error during OTP verification." });
  }
});

// 3. User Login API
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "No account found with this email." });
    }

    // Ensure user is verified before allowing login
    if (!user.isVerified) {
      return res.status(401).json({ error: "Please verify your email using OTP first." });
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Incorrect password." });
    }

    user.lastActive = new Date();
    await user.save();

    await ActivityLog.create({
      userId: String(user._id),
      actionType: 'LOGIN',
      details: 'User logged in successfully',
      metadata: { email: user.email }
    });

    // Generate Login Token
    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        xp: user.xp,
        level: user.level,
        coins: user.coins
      }
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Server error during login." });
  }
});

module.exports = router;