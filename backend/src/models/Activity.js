const mongoose = require('mongoose');

const activitySchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  action: {
    type: String, // e.g., 'updated', 'completed', 'created'
    required: true,
  },
  target: {
    type: String, // e.g., 'Task', 'Event', 'Design Review'
    required: true,
  },
  details: {
    type: String, // Optional details
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Activity', activitySchema);
