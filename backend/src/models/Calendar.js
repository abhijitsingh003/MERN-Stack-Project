const mongoose = require('mongoose');

const calendarSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  name: {
    type: String,
    required: [true, 'Please add a calendar name'],
  },
  color: {
    type: String,
    default: '#3b82f6', // Default blue
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  settings: {
    defaultView: {
      type: String,
      enum: ['day', 'week', 'month', 'year'],
      default: 'month',
    },
    notifications: {
      emailReminders: {
        type: Boolean,
        default: true,
      },
      inAppReminders: {
        type: Boolean,
        default: true,
      },
    },
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Calendar', calendarSchema);
