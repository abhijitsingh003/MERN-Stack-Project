const mongoose = require('mongoose');

const pendingShareSchema = mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  calendar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Calendar',
    required: true,
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    enum: ['editor', 'viewer'],
    default: 'viewer',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('PendingShare', pendingShareSchema);
