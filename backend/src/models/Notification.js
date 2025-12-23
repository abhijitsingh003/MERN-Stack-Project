const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String, // e.g., 'reminder', 'share_invite'
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId, // ID of the event or calendar
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Notification', notificationSchema);
