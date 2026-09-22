const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const sendEmail = require('../utils/sendEmail'); 
const { toClientUser, updateDailyStreak } = require('../utils/userSerializer');

const router = express.Router();

// 1. User Registration & Send OTP API
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      return res.status(400).json({ error: "Username must be at least 3 characters long." });
    }
    const cleanUsername = username.trim().toLowerCase().replace(/\s/g, '');

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: "A valid email address is required." });
    }
    const cleanEmail = email.trim().toLowerCase();

    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long." });
    }

    // Check if user already exists
    let user = await User.findOne({ $or: [{ email: cleanEmail }, { username: cleanUsername }] });
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

    // Premium Deep Dark HTML Email Template for Registration
    const emailHTML = `
      <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0B0F19; border: 1px solid #1E293B; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.6);">
        
        <div style="background: linear-gradient(90deg, #00F3FF 0%, #7C3AED 100%); padding: 40px 20px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 28px; letter-spacing: 1px; font-weight: bold;">FigTyp Arena</h1>
          <p style="margin: 10px 0 0 0; font-size: 14px; font-weight: 500; opacity: 0.95;">Account Verification</p>
        </div>

        <div style="padding: 40px 30px; color: #cbd5e1; font-size: 15px; line-height: 1.6;">
          <p style="margin-top: 0; color: #f8fafc;">Dear <strong style="color: #ffffff;">${username}</strong>,</p>
          <p>Welcome to <strong style="color: #ffffff;">FigTyp Arena</strong>! We're excited to have you join our community. To complete your account setup, please verify your email address with the code below.</p>

          <div style="border: 2px solid #00F3FF; border-radius: 12px; padding: 30px; text-align: center; margin: 35px 0; background-color: rgba(0, 243, 255, 0.05);">
            <div style="font-size: 12px; color: #94a3b8; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 15px; font-weight: 600;">Your Verification Code</div>
            
            <!-- OTP with letter-spacing (Allows 1-click full copy without spaces) -->
            <div style="font-size: 44px; font-weight: bold; color: #00F3FF; letter-spacing: 16px; margin: 15px 0; padding-left: 16px;">${otp}</div>
            
            <div style="font-size: 13px; color: #94a3b8; margin-top: 15px;">Valid for <strong style="color: #cbd5e1;">10 minutes</strong></div>
          </div>

          <div style="background-color: rgba(245, 158, 11, 0.1); border-left: 4px solid #F59E0B; padding: 16px 20px; font-size: 13px; color: #FCD34D; margin-bottom: 25px; border-radius: 0 6px 6px 0;">
            <strong style="color: #F59E0B;">⚠️ Security Notice:</strong> Never share this code with anyone. FigTyp support staff will never ask for your OTP.
          </div>

          <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">If you didn't request this code, please ignore this email. Your account remains secure.</p>
        </div>

        <div style="background-color: #06080F; padding: 30px; text-align: center; border-top: 1px solid #1E293B;">
          <p style="margin: 0; color: #94a3b8; font-size: 13px; line-height: 1.6;">
            <strong style="color: #f1f5f9;">Md Moshiur Rahaman Riat</strong><br>
            Founder & Lead Developer<br>
            <span style="color: #00F3FF; font-weight: bold; font-size: 14px; display: inline-block; margin-top: 6px;">FigTyp Arena</span>
          </p>
          <hr style="border: none; border-top: 1px solid #1E293B; margin: 20px 0;">
          <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.6;">
            &copy; 2026 FigTyp Arena. All rights reserved.<br>
            <a href="https://typist.miracore.net" style="color: #00F3FF; text-decoration: none; font-weight: bold; display: inline-block; margin-top: 6px;">Visit our website</a>
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


// 2. Verify OTP API (For New Accounts)
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
    updateDailyStreak(user);
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
      user: toClientUser(user)
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

    updateDailyStreak(user);
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
      user: toClientUser(user)
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Server error during login." });
  }
});

// 3b. Social Login & Auto-Profile Extraction (Google, GitHub, Apple)
router.post('/social-login', async (req, res) => {
  try {
    const { provider, email, name, avatarUrl, agreedToImport } = req.body;

    if (!provider || !email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid provider and email address are required for social login.' });
    }

    if (!agreedToImport) {
      return res.status(400).json({ error: 'Consent to import profile details is required to continue.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = await User.findOne({ email: cleanEmail });

    if (user) {
      // Existing user: Auto-extract / enrich profile details if consented
      if (name && (!user.fullName || user.fullName === user.username)) {
        user.fullName = name.trim();
      }
      if (avatarUrl && (!user.avatarUrl || user.avatarUrl.includes('placeholder'))) {
        user.avatarUrl = avatarUrl.trim();
      }
      user.isVerified = true;
      updateDailyStreak(user);
      await user.save();

      await ActivityLog.create({
        userId: String(user._id),
        actionType: 'LOGIN',
        details: `Logged in via ${provider.toUpperCase()}`,
        metadata: { provider, email: cleanEmail }
      });
    } else {
      // New user: Auto-register with extracted profile info
      let baseUsername = (name || cleanEmail.split('@')[0] || 'typist')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .slice(0, 15);

      if (baseUsername.length < 3) baseUsername = 'user_' + Math.floor(1000 + Math.random() * 9000);

      // Ensure unique username
      let candidateUsername = baseUsername;
      let counter = 1;
      while (await User.findOne({ username: candidateUsername })) {
        candidateUsername = `${baseUsername}${counter}`;
        counter++;
      }

      // Generate random secure password for social user
      const randomPassword = Math.random().toString(36).slice(-10) + '!A1';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || 'riat.moshiur22@gmail.com,rahaman242-35-606@diu.edu.bd')
        .split(',')
        .map(e => e.trim().toLowerCase())
        .filter(Boolean);
      const userRole = superAdminEmails.includes(cleanEmail) ? 'SUPER_ADMIN' : 'GENERAL_USER';

      user = new User({
        username: candidateUsername,
        email: cleanEmail,
        fullName: (name || candidateUsername).trim(),
        avatarUrl: avatarUrl ? avatarUrl.trim() : '',
        password: hashedPassword,
        role: userRole,
        isVerified: true
      });

      await user.save();

      await ActivityLog.create({
        userId: String(user._id),
        actionType: 'LOGIN',
        details: `Auto-registered and logged in via ${provider.toUpperCase()}`,
        metadata: { provider, email: cleanEmail }
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        username: user.username,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: `Authenticated with ${provider.toUpperCase()} successfully!`,
      token,
      user: toClientUser(user)
    });
  } catch (error) {
    console.error('Social Login Error:', error);
    res.status(500).json({ error: 'Server error during social authentication.' });
  }
});


// 4. Forgot Password API (Send OTP)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "No account found with this email." });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // Valid for 10 minutes
    await user.save();

    // Premium Deep Dark HTML Email Template for Password Reset
    const emailHTML = `
      <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0B0F19; border: 1px solid #1E293B; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.6);">
        <div style="background: linear-gradient(90deg, #FF4D6D 0%, #7C3AED 100%); padding: 40px 20px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 28px; letter-spacing: 1px; font-weight: bold;">FigTyp Arena</h1>
          <p style="margin: 10px 0 0 0; font-size: 14px; font-weight: 500; opacity: 0.95;">Password Reset Request</p>
        </div>
        <div style="padding: 40px 30px; color: #cbd5e1; font-size: 15px; line-height: 1.6;">
          <p style="margin-top: 0; color: #f8fafc;">Dear <strong style="color: #ffffff;">${user.username}</strong>,</p>
          <p>We received a request to reset the password for your <strong style="color: #ffffff;">FigTyp Arena</strong> account. Use the verification code below to set up a new password.</p>
          
          <div style="border: 2px solid #FF4D6D; border-radius: 12px; padding: 30px; text-align: center; margin: 35px 0; background-color: rgba(255, 77, 109, 0.05);">
            <div style="font-size: 12px; color: #94a3b8; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 15px; font-weight: 600;">Your Reset Code</div>
            
            <!-- OTP with letter-spacing (Allows 1-click full copy without spaces) -->
            <div style="font-size: 44px; font-weight: bold; color: #FF4D6D; letter-spacing: 16px; margin: 15px 0; padding-left: 16px;">${otp}</div>
            
            <div style="font-size: 13px; color: #94a3b8; margin-top: 15px;">Valid for <strong style="color: #cbd5e1;">10 minutes</strong></div>
          </div>
          
          <div style="background-color: rgba(245, 158, 11, 0.1); border-left: 4px solid #F59E0B; padding: 16px 20px; font-size: 13px; color: #FCD34D; margin-bottom: 25px; border-radius: 0 6px 6px 0;">
            <strong style="color: #F59E0B;">⚠️ Security Notice:</strong> Never share this code with anyone. FigTyp support staff will never ask for your OTP.
          </div>

          <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">If you didn't request a password reset, you can safely ignore this email.</p>
        </div>
        <div style="background-color: #06080F; padding: 30px; text-align: center; border-top: 1px solid #1E293B;">
          <p style="margin: 0; color: #94a3b8; font-size: 13px; line-height: 1.6;">
            <strong style="color: #f1f5f9;">Md Moshiur Rahaman Riat</strong><br>
            Founder & Lead Developer<br>
            <span style="color: #FF4D6D; font-weight: bold; font-size: 14px; display: inline-block; margin-top: 6px;">FigTyp Arena</span>
          </p>
        </div>
      </div>
    `;

    await sendEmail({
      email: user.email,
      subject: 'FigTyp Arena - Password Reset Code',
      html: emailHTML 
    });

    res.json({ message: "Password reset OTP sent to your email." });

  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ error: "Server error during password reset request." });
  }
});


// 5. Reset Password API (Verify OTP & Save New Password)
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters long." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Check if OTP matches and is not expired
    if (user.otp !== otp || user.otpExpires < new Date()) {
      return res.status(400).json({ error: "Invalid or expired OTP." });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    // Clear OTP fields
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    await ActivityLog.create({
      userId: String(user._id),
      actionType: 'PROFILE_UPDATE',
      details: 'User successfully reset their password',
      metadata: { email: user.email }
    });

    res.json({ message: "Password reset successful! You can now login." });

  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ error: "Server error during password reset." });
  }
});

module.exports = router;