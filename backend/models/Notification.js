const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: String,
      ref: 'User',
      required: true
    },
    recipientEmail: String,
    content: {
      type: String,
      ref: 'MultimediaContent',
      required: true
    },
    contentTitle: String,
    type: {
      type: String,
      enum: ['approved', 'rejected', 'pending', 'submitted'],
      default: 'pending'
    },
    status: {
      type: String,
      enum: ['unread', 'read'],
      default: 'unread'
    },
    message: String,
    approverComments: String,
    approverName: String,
    read: {
      type: Boolean,
      default: false
    },
    readAt: Date,
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', NotificationSchema);
