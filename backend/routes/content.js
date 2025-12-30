const express = require('express');
const router = express.Router();
const MultimediaContent = require('../models/MultimediaContent');
const ContentApproval = require('../models/ContentApproval');
const { authMiddleware, contentManagerOnly } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const {
  sendContentSubmissionNotification,
  sendContentApprovedEmail,
  sendContentRejectedEmail,
} = require('../utils/emailService');

// Get all content with filtering
router.get('/', async (req, res) => {
  try {
    const { status, category, search } = req.query;
    let query = {};

    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const content = await MultimediaContent.find(query)
      .populate('creator', 'username email')
      .populate('category', 'name colorCode')
      .sort({ createdAt: -1 });

    res.json(content);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create content
router.post('/', authMiddleware, [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('contentType').isIn(['image', 'video', 'audio', 'document', 'article']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, contentType, category, tags } = req.body;

    const content = new MultimediaContent({
      title,
      description,
      contentType,
      category: category || null,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      creator: req.user.id,
      file: req.body.file || 'temp-path',
      status: 'pending',
    });

    await content.save();
    await sendContentSubmissionNotification(req.user.email, title);

    res.status(201).json({
      message: 'Content submitted successfully',
      content,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get content by ID
router.get('/:id', async (req, res) => {
  try {
    const content = await MultimediaContent.findById(req.params.id)
      .populate('creator', 'username email organization')
      .populate('category', 'name colorCode');

    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    await content.incrementViewCount();
    res.json(content);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update content (creator only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    let content = await MultimediaContent.findById(req.params.id);

    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    if (content.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this content' });
    }

    const { title, description, category, tags } = req.body;

    if (title) content.title = title;
    if (description) content.description = description;
    if (category) content.category = category;
    if (tags) content.tags = tags.split(',').map(t => t.trim());

    await content.save();
    res.json({ message: 'Content updated', content });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete content (creator or admin)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const content = await MultimediaContent.findById(req.params.id);

    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    if (content.creator.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this content' });
    }

    await MultimediaContent.deleteOne({ _id: req.params.id });
    res.json({ message: 'Content deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Approve content (content manager only)
router.post('/:id/approve', authMiddleware, contentManagerOnly, async (req, res) => {
  try {
    const { comments } = req.body;
    let content = await MultimediaContent.findById(req.params.id);

    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    content.status = 'approved';
    await content.save();

    await ContentApprovalWorkflow.create({
      content: req.params.id,
      status: 'approved',
      approver: req.user.id,
      comments: comments || '',
    });

    const creator = await require('../models/User').findById(content.creator);
    await sendContentApprovedEmail(creator.email, content.title);

    res.json({ message: 'Content approved', content });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reject content (content manager only)
router.post('/:id/reject', authMiddleware, contentManagerOnly, async (req, res) => {
  try {
    const { comments } = req.body;
    let content = await MultimediaContent.findById(req.params.id);

    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    content.status = 'rejected';
    await content.save();

    await ContentApprovalWorkflow.create({
      content: req.params.id,
      status: 'rejected',
      approver: req.user.id,
      comments: comments || '',
    });

    const creator = await require('../models/User').findById(content.creator);
    await sendContentRejectedEmail(creator.email, content.title, comments || 'No reason provided');

    res.json({ message: 'Content rejected', content });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Publish content (content manager only)
router.post('/:id/publish', authMiddleware, contentManagerOnly, async (req, res) => {
  try {
    const content = await MultimediaContent.findById(req.params.id);

    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    const success = await content.publish();
    if (!success) {
      return res.status(400).json({ message: 'Content must be approved before publishing' });
    }

    res.json({ message: 'Content published', content });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
