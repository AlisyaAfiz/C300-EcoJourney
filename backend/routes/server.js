// routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../models/User'); // your Mongoose model
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Create user (admin only)
router.post('/', authMiddleware, roleMiddleware(['admin']), [
  body('username').notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').notEmpty(),
  body('lastName').notEmpty(),
  body('role').isIn(['admin','content_producer','content_manager'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { username, email, password, firstName, lastName, role, phone, organization } = req.body;

  try {
    // Hash is already in pre-save hook; ensure you don’t pass plain password around
    const user = new User({ username, email, password, firstName, lastName, role, phone, organization });
    await user.save();
    res.status(201).json({ id: user._id, username, email, role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List users with optional search
router.get('/', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  const { q, limit = 20, page = 1 } = req.query;
  const query = {};
  if (q) {
    query.$or = [
      { username: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
      { firstName: { $regex: q, $options: 'i' } },
      { lastName: { $regex: q, $options: 'i' } }
    ];
  }
  try {
    const users = await User.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-password'); // hide password
    const total = await User.countDocuments(query);
    res.json({ page, limit: Number(limit), total, users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single user
router.get('/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user
router.put('/:id', authMiddleware, roleMiddleware(['admin']), [
  body('email').optional().isEmail(),
  body('password').optional().isLength({ min: 6 }),
  body('role').optional().isIn(['admin','content_producer','content_manager'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const update = { ...req.body };
  if (update.password) update.password = update.password; // Mongoose pre-save will hash
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    Object.assign(user, update);
    await user.save();
    res.json({ message: 'User updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete user (or soft-delete by setting isDeleted)
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    // Soft-delete example:
    // await User.findByIdAndUpdate(req.params.id, { isDeleted: true });
    // Hard delete:
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
