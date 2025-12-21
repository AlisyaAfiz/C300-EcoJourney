const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const multimediaContentSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4,
  },
  title: {
    type: String,
    required: true,
    maxlength: 255,
  },
  description: {
    type: String,
    required: true,
  },
  contentType: {
    type: String,
    enum: ['image', 'video', 'audio', 'document', 'article'],
    required: true,
  },
  category: {
    type: String,
    ref: 'ContentCategory',
    default: null,
  },
  file: {
    type: String,
    required: true,
  },
  thumbnail: {
    type: String,
    default: null,
  },
  tags: {
    type: [String],
    default: [],
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected', 'published', 'archived'],
    default: 'draft',
  },
  creator: {
    type: String,
    ref: 'User',
    required: true,
  },
  viewCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  publishedAt: {
    type: Date,
    default: null,
  },
}, { collection: 'multimedia_content' });

// Create indexes
multimediaContentSchema.index({ status: 1 });
multimediaContentSchema.index({ creator: 1 });
multimediaContentSchema.index({ category: 1 });

// Methods
multimediaContentSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save();
};

multimediaContentSchema.methods.publish = function() {
  if (this.status === 'approved') {
    this.status = 'published';
    this.publishedAt = new Date();
    return this.save();
  }
  return Promise.resolve(false);
};

multimediaContentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('MultimediaContent', multimediaContentSchema);
