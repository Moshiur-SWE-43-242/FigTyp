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

    // Send OTP to user's email in HTML format (Premium UI)
    const emailHTML = `
      <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        
        <!-- Premium Gradient Header -->
        <div style="background: linear-gradient(90deg, #00F3FF 0%, #7C3AED 100%); padding: 40px 20px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 28px; letter-spacing: 1px; font-weight: bold;">FigTyp Arena</h1>
          <p style="margin: 10px 0 0 0; font-size: 14px; font-weight: 500; opacity: 0.95;">Account Verification</p>
        </div>

        <!-- Email Body -->
        <div style="padding: 35px 30px; color: #4a5568; font-size: 15px; line-height: 1.6;">
          <p style="margin-top: 0;">Dear <strong>${username}</strong>,</p>

          <p>Welcome to <strong>FigTyp Arena</strong>! We're excited to have you join our community. To complete your account setup, please verify your email address with the code below.</p>

          <!-- Highlighted OTP Box -->
          <div style="border: 2px solid #00F3FF; border-radius: 8px; padding: 25px; text-align: center; margin: 30px 0;">
            <div style="font-size: 12px; color: #a0aec0; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 15px;">Your Verification Code</div>
            <div style="font-size: 40px; font-weight: bold; color: #00F3FF; letter-spacing: 10px; margin: 10px 0;">
              ${otp.split('').join(' ')}
            </div>
            <div style="font-size: 12px; color: #a0aec0; margin-top: 15px;">Valid for <strong>10 minutes</strong></div>
          </div>

          <!-- Security Notice Alert -->
          <div style="background-color: #FFFBEB; border-left: 4px solid #FCD34D; padding: 15px 20px; font-size: 13px; color: #92400E; margin-bottom: 25px; border-radius: 0 4px 4px 0;">
            <strong>⚠️ Security Notice:</strong> Never share this code with anyone. FigTyp support staff will never ask for your OTP.
          </div>

          <p style="font-size: 13px; color: #718096; margin-bottom: 0;">If you didn't request this code, please ignore this email. Your account remains secure.</p>
        </div>

        <!-- Footer Section -->
        <div style="background-color: #f8fafc; padding: 25px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; color: #718096; font-size: 13px; line-height: 1.5;">
            <strong style="color: #4a5568;">Md Moshiur Rahaman Riat</strong><br>
            Founder & Lead Developer<br>
            <span style="color: #00F3FF; font-weight: bold; font-size: 14px; display: inline-block; margin-top: 5px;">FigTyp Arena</span>
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
          <p style="margin: 0; font-size: 12px; color: #a0aec0; line-height: 1.6;">
            &copy; 2026 FigTyp Arena. All rights reserved.<br>
            <a href="#" style="color: #00F3FF; text-decoration: none; font-weight: bold; display: inline-block; margin-top: 5px;">Visit our website</a>
          </p>
        </div>

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