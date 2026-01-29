const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const generateToken = (userId, role) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT secret not configured');
  }
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

const generatePasswordResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateToken,
  generatePasswordResetToken,
  verifyToken,
};
