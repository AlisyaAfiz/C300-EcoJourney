const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const contentApprovalWorkflowSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4,
  },
  content: {
    type: String,
    ref: 'MultimediaContent',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'requested_changes'],
    default: 'pending',
  },
  approver: {
    type: String,
    ref: 'User',
    default: null,
  },
  comments: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, { collection: 'content_approval_workflows' });

contentApprovalWorkflowSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('ContentApprovalWorkflow', contentApprovalWorkflowSchema);
