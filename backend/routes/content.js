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
const { upload } = require('../config/cloudinary');

// Get all content (no authentication required for public access)
router.get('/all', async (req, res) => {
  try {
    const content = await MultimediaContent.find()
      .sort({ createdAt: -1 });

    res.json(content);
  } catch (error) {
    console.error('Error fetching all content:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Upload new content with Cloudinary (supports both media and document files)
router.post('/upload', upload.fields([
  { name: 'mediaFile', maxCount: 1 },
  { name: 'documentFile', maxCount: 1 }
]), async (req, res) => {
  console.log('========================================');
  console.log('📤 UPLOAD ENDPOINT HIT!');
  console.log('========================================');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Request body keys:', Object.keys(req.body));
  console.log('Files received:', req.files ? Object.keys(req.files) : 'NO FILES');
  console.log('========================================');
  console.log('🔄 INSIDE MAIN UPLOAD HANDLER');
  console.log('========================================');
  
  try {
    const { 
      title, 
      description, 
      category, 
      type
    } = req.body;

    console.log('📋 Form data received:');
    console.log('  - Title:', title);
    console.log('  - Description:', description?.substring(0, 50));
    console.log('  - Category:', category);
    console.log('  - Type:', type);

    if (!title || !category) {
      console.error('❌ Missing required fields');
      return res.status(400).json({ message: 'Title and category are required' });
    }

    // ✅ Safely check if files were uploaded
    const mediaFile = req.files?.mediaFile?.[0];
    const documentFile = req.files?.documentFile?.[0];

    // Log what we received
    console.log('=== Upload Request ===');
    console.log('Files object exists:', !!req.files);
    console.log('Files received:', req.files ? Object.keys(req.files) : 'NO FILES');
    console.log('Media file:', mediaFile ? {
      filename: mediaFile.originalname,
      size: mediaFile.size,
      mimetype: mediaFile.mimetype,
      path: mediaFile.path
    } : 'NO MEDIA FILE');
    console.log('Document file:', documentFile ? {
      filename: documentFile.originalname,
      size: documentFile.size,
      mimetype: documentFile.mimetype,
      path: documentFile.path
    } : 'NO DOCUMENT FILE');

    // ✅ Check if at least one file was uploaded
    if (!mediaFile && !documentFile) {
      console.error('❌ No files received from frontend!');
      return res.status(400).json({ 
        message: 'No files uploaded. Please upload at least one file.',
        receivedFields: req.files ? Object.keys(req.files) : []
      });
    }

    // ✅ Safely get Cloudinary URLs (only if files exist)
    let mediaCloudURL = '';
    let documentCloudURL = '';

    if (mediaFile && mediaFile.path) {
      mediaCloudURL = mediaFile.path;
      console.log('✅ Media uploaded to Cloudinary:', mediaCloudURL);
    }

    if (documentFile && documentFile.path) {
      documentCloudURL = documentFile.path;
      console.log('✅ Document uploaded to Cloudinary:', documentCloudURL);
    }

    console.log('💾 Preparing to save to MongoDB...');

    // ✅ Save Cloudinary URLs to MongoDB (NOT base64 strings)
    const contentData = {
      title,
      description: description || '',
      contentType: type === 'PDF' ? 'document' : 'document',
      category: category,
      file: documentCloudURL || mediaCloudURL || 'no-file',
      status: 'pending',
      creator: 'system',
      fileData: documentCloudURL, // ✅ Cloudinary URL for document
      mediaData: mediaCloudURL, // ✅ Cloudinary URL for media
      fileSize: documentFile?.size || mediaFile?.size || 0,
      date: new Date().toISOString(),
      type: type || 'Document',
      fileName: documentFile?.originalname,
      fileType: documentFile?.mimetype,
      mediaFileName: mediaFile?.originalname,
      mediaFileType: mediaFile?.mimetype,
    };

    console.log('📝 Content data prepared:', {
      title: contentData.title,
      hasMediaURL: !!contentData.mediaData,
      hasFileURL: !!contentData.fileData
    });

    const content = new MultimediaContent(contentData);
    await content.save();

    console.log('✅✅✅ Content saved to MongoDB successfully! ID:', content._id);

    res.status(201).json({
      message: 'Content uploaded successfully',
      content,
    });
  } catch (error) {
    console.error('❌❌❌ Upload error in main handler:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      errorName: error.name,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

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

    // Don't populate - creator and category are stored as plain strings, not references
    const content = await MultimediaContent.find(query)
      .sort({ createdAt: -1 });

    res.json(content);
  } catch (error) {
    console.error('Error fetching all content:', error);
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
    // Don't populate - creator and category are stored as plain strings, not references
    const content = await MultimediaContent.findById(req.params.id);

    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    await content.incrementViewCount();
    
    // Log to verify data is present
    console.log('Content ID:', content._id);
    console.log('Has mediaData:', !!content.mediaData);
    console.log('Has fileData:', !!content.fileData);
    console.log('MediaData length:', content.mediaData ? content.mediaData.length : 0);
    console.log('FileData length:', content.fileData ? content.fileData.length : 0);
    
    res.json(content);
  } catch (error) {
    console.error('Error fetching content by ID:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update content with file upload support (no authentication for now to match upload behavior)
router.put('/:id', upload.fields([
  { name: 'mediaFile', maxCount: 1 },
  { name: 'documentFile', maxCount: 1 }
]), async (req, res) => {
  console.log('========================================');
  console.log('📝 UPDATE ENDPOINT HIT!');
  console.log('========================================');
  
  try {
    let content = await MultimediaContent.findById(req.params.id);

    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    const { title, description, category, type } = req.body;

    console.log('📋 Update data received:');
    console.log('  - Title:', title);
    console.log('  - Description:', description?.substring(0, 50));
    console.log('  - Category:', category);
    console.log('  - Type:', type);

    // Update basic fields if provided
    if (title) content.title = title;
    if (description) content.description = description;
    if (category) content.category = category;
    if (type) content.type = type;

    // Check if new files were uploaded
    const mediaFile = req.files?.mediaFile?.[0];
    const documentFile = req.files?.documentFile?.[0];

    console.log('Files in update:', {
      hasMedia: !!mediaFile,
      hasDocument: !!documentFile
    });

    // Update media file if provided (replaces old one)
    if (mediaFile && mediaFile.path) {
      content.mediaData = mediaFile.path;
      content.mediaFileName = mediaFile.originalname;
      content.mediaFileType = mediaFile.mimetype;
      console.log('✅ Media updated to:', content.mediaData);
    }

    // Update document file if provided (replaces old one)
    if (documentFile && documentFile.path) {
      content.fileData = documentFile.path;
      content.file = documentFile.path;
      content.fileName = documentFile.originalname;
      content.fileType = documentFile.mimetype;
      content.fileSize = documentFile.size;
      console.log('✅ Document updated to:', content.fileData);
    }

    // Update the modification date
    content.date = new Date().toISOString();

    await content.save();
    
    console.log('✅ Content updated successfully! ID:', content._id);
    
    res.json({ message: 'Content updated', content });
  } catch (error) {
    console.error('❌ Update error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete content (creator or admin)
// Delete content (no authentication required for now, to match upload behavior)
router.delete('/:id', async (req, res) => {
  try {
    const content = await MultimediaContent.findById(req.params.id);

    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    // Delete from database
    await MultimediaContent.deleteOne({ _id: req.params.id });
    
    // Note: Cloudinary files will remain - you may want to delete them too
    // If using Cloudinary, uncomment and add:
    // const { cloudinary } = require('../config/cloudinary');
    // if (content.fileData) await cloudinary.uploader.destroy(publicId);
    
    res.json({ message: 'Content deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
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
