const jwt = require('jsonwebtoken');

// Get JWT secret with validation
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('❌ CRITICAL: JWT_SECRET is not configured in environment variables');
    console.error('⚠️  This will cause authentication failures across the application');
    throw new Error('JWT_SECRET not configured');
  }
  return secret;
};

// Basic auth middleware
const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Use unified secret handling
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.message.includes('JWT_SECRET')) {
      console.error('❌ Authentication middleware error:', error.message);
      return res.status(500).json({ 
        message: 'Server misconfigured: Authentication system not available',
        details: 'JWT_SECRET is missing from environment configuration'
      });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Content manager only middleware
const contentManagerOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'manager' || req.user.role === 'content_manager' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Content managers only.' });
  }
};

// Admin only middleware
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admins only.' });
  }
};

module.exports = {
  authMiddleware,
  contentManagerOnly,
  adminOnly
};
