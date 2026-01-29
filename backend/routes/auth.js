const express = require('express');
const router = express.Router();
const User = require('../models/User');
const PasswordResetToken = require('../models/PasswordResetToken');
const { generateToken, generatePasswordResetToken } = require('../utils/tokenUtils');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../utils/emailService');
const { body, validationResult } = require('express-validator');

// Register
router.post('/register', [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      firstName,
      lastName,
    });

    await user.save();
    await sendWelcomeEmail(email, username);

    const token = generateToken(user._id, user.role);
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login
router.post('/login', [
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, username, password } = req.body;
    
    // Find user by email OR username
    let user;
    if (email) {
      user = await User.findOne({ email });
    } else if (username) {
      user = await User.findOne({ username });
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if account is locked
    if (user.isLocked && new Date() < user.lockedUntil) {
      return res.status(403).json({ message: 'Account is locked. Try again later.' });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      user.loginAttempts += 1;
      if (user.loginAttempts >= 5) {
        await user.lockAccount();
        return res.status(403).json({ message: 'Too many login attempts. Account locked.' });
      }
      await user.save();
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Unlock account on successful login
    if (user.isLocked) {
      await user.unlockAccount();
    }
    user.loginAttempts = 0;
    user.lastLoginIp = req.ip;
    await user.save();

    const token = generateToken(user._id, user.role);
    res.json({
      message: 'Logged in successfully',
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Forgot Password
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Valid email is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate reset token
    const token = generatePasswordResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await PasswordResetToken.updateOne(
      { user: user._id },
      {
        token,
        expiresAt,
        isUsed: false,
        usedAt: null,
      },
      { upsert: true }
    );

    const resetLink = `http://localhost:3000/reset-password?token=${token}`;
    await sendPasswordResetEmail(email, resetLink);

    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reset Password
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Token is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, newPassword } = req.body;
    const resetToken = await PasswordResetToken.findOne({ token });

    if (!resetToken || !resetToken.isValid()) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const user = await User.findById(resetToken.user);
    user.password = newPassword;
    await user.save();

    resetToken.isUsed = true;
    resetToken.usedAt = new Date();
    await resetToken.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
