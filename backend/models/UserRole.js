const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const userRoleSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4,
  },
  name: {
    type: String,
    enum: ['admin', 'content_manager', 'content_producer'],
    unique: true,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, { collection: 'user_roles' });

userRoleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('UserRole', userRoleSchema);
