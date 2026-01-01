const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Storage for documents (PDFs, etc.)
const documentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'eco-journey-documents',
    allowed_formats: ['pdf', 'doc', 'docx', 'txt'],
    resource_type: 'raw', // For non-image files
  },
});

// Configure Storage for media (images, videos)
const mediaStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'eco-journey-media',
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'mp4', 'mov', 'avi'],
    resource_type: 'auto', // Automatically detect image or video
  },
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

module.exports = {
  cloudinary,
  uploadDocument,
  uploadMedia
};
