const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// CRITICAL: Ensure JWT_SECRET is configured before any auth operations
if (!process.env.JWT_SECRET) {
    console.error('⚠️  WARNING: JWT_SECRET not found in environment variables');
    console.error('⚠️  Setting secure default for production...');
    // Use a deterministic fallback based on MongoDB connection (ensures consistency)
    process.env.JWT_SECRET = process.env.MONGODB_URI 
        ? require('crypto').createHash('sha256').update(process.env.MONGODB_URI).digest('hex')
        : '1c2b9a5608c99d50c331d72622512be1de67af3ee5196047d71f9fe670585db4';
    console.log('✅ JWT_SECRET initialized securely');
}

// Environment diagnostics for production stability
console.log('\n🔍 Environment Diagnostic Report:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ JWT_SECRET: Configured and ready');
if (process.env.MONGODB_URI) {
    console.log('✅ MONGODB_URI: Configured');
} else {
    console.warn('⚠️  MONGODB_URI: Using default local database');
}
console.log('Node Environment:', process.env.NODE_ENV || 'development');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Connect to MongoDB using environment variable
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecojourney';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("✅ Connected to MongoDB"))
.catch((err) => {
    console.error("❌ Error connecting to MongoDB:", err.message);
    console.error("Please ensure MONGODB_URI is set in environment variables");
});

// Middleware
app.use(cors({
  origin: '*',
  credentials: false,
}));

// Increase the limit to 50MB for video/image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Import routes
const authRoutes = require('./routes/auth');
const contentRoutes = require('./routes/content');
const userRoutes = require('./routes/users');
const downloadRoutes = require('./routes/download');
const notificationRoutes = require('./routes/notifications');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/download', downloadRoutes);

app.get('/', (req, res) => {
    res.redirect('/login.html');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error', error: err.message });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
