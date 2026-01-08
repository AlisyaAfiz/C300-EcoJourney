const express = require('express');
const router = express.Router();
const MultimediaContent = require('../models/MultimediaContent');
const axios = require('axios');

// Download route that proxies Cloudinary files with correct filename
router.get('/:id', async (req, res) => {
  try {
    console.log('Download request for ID:', req.params.id);
    
    // Get content from MongoDB
    const content = await MultimediaContent.findById(req.params.id);
    
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }
    
    if (!content.fileData) {
      return res.status(404).json({ message: 'No file available for download' });
    }
    
    // Get the original filename with extension
    const originalFilename = content.fileName || 'download';
    console.log('Downloading file:', originalFilename);
    console.log('From Cloudinary URL:', content.fileData);
    
    // Fetch file from Cloudinary
    const response = await axios.get(content.fileData, {
      responseType: 'stream'
    });
    
    // Set headers to force download with correct filename
    res.setHeader('Content-Disposition', `attachment; filename="${originalFilename}"`);
    res.setHeader('Content-Type', content.fileType || 'application/octet-stream');
    
    // Pipe the file stream to the response
    response.data.pipe(res);
    
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ message: 'Failed to download file', error: error.message });
  }
});

module.exports = router;
