const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Log Cloudinary configuration status (without revealing secrets)
console.log('=== Cloudinary Configuration ===');
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME ? '✅ Set' : '❌ Missing');
console.log('API Key:', process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Missing');
console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? '✅ Set' : '❌ Missing');

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('⚠️  WARNING: Cloudinary credentials are not fully configured!');
  console.error('⚠️  Uploads will fail until you set these environment variables:');
  console.error('⚠️  - CLOUDINARY_CLOUD_NAME');
  console.error('⚠️  - CLOUDINARY_API_KEY');
  console.error('⚠️  - CLOUDINARY_API_SECRET');
}

// Configure Storage for media (images/videos - use 'auto')
const mediaStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'eco-journey-media',
    resource_type: 'auto', // Auto-detect for images/videos
    // No allowed_formats - let Cloudinary accept anything
  },
});

// Configure Storage for documents (PDFs, docs - use 'raw')
const documentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'eco-journey-documents',
    resource_type: 'raw', // Required for non-image files like PDFs
    // No allowed_formats - let Cloudinary accept anything
  },
});

// Configure combined storage that accepts everything
const combinedStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'eco-journey-uploads',
    resource_type: 'auto', // Try auto first
    // No format restrictions - accept everything
  }
});

// Create uploaders
const uploadDocument = multer({ 
  storage: documentStorage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

const uploadMedia = multer({ 
  storage: mediaStorage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

const uploadCombined = multer({ 
  storage: combinedStorage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

module.exports = {
  cloudinary,
  uploadDocument,
  uploadMedia,
  uploadCombined
};
