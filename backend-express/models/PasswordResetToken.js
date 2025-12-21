const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const passwordResetTokenSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4,
  },
  user: {
    type: String,
    ref: 'User',
    required: true,
    unique: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  isUsed: {
    type: Boolean,
    default: false,
  },
  usedAt: {
    type: Date,
    default: null,
  },
}, { collection: 'password_reset_tokens' });

// Method to check if token is valid
passwordResetTokenSchema.methods.isValid = function() {
  return !this.isUsed && new Date() < this.expiresAt;
};

// Static method to generate token
passwordResetTokenSchema.statics.generateToken = function() {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
};

module.exports = mongoose.model('PasswordResetToken', passwordResetTokenSchema);
