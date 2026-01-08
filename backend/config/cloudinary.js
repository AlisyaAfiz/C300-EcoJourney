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

// Configure Storage - one config that handles all files
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    // Check if it's a media file or document based on field name
    const isMediaField = file.fieldname === 'mediaFile';
    
    // Preserve original filename (without extension) as public_id
    const filenameWithoutExt = file.originalname.replace(/\.[^/.]+$/, '');
    const timestamp = Date.now();
    const publicId = `${filenameWithoutExt}_${timestamp}`;
    
    return {
      folder: isMediaField ? 'eco-journey-media' : 'eco-journey-documents',
      resource_type: isMediaField ? 'auto' : 'raw',
      public_id: publicId,
      // No format restrictions
    };
  }
});

// Create one uploader for all files
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

module.exports = {
  cloudinary,
  upload
};
