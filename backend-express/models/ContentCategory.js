const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const contentCategorySchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4,
  },
  name: {
    type: String,
    enum: ['environmental', 'social', 'governance', 'economic', 'other'],
    unique: true,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  colorCode: {
    type: String,
    default: '#2ecc71',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, { collection: 'content_categories' });

contentCategorySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('ContentCategory', contentCategorySchema);
