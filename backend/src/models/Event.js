const mongoose = require('mongoose');

const eventSchema = mongoose.Schema({
  calendar: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Calendar',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  title: {
    type: String,
    required: [true, 'Please add a title'],
  },
  description: {
    type: String,
  },
  location: {
    type: String,
  },
  start: {
    type: Date,
    required: [true, 'Please add a start date'],
  },
  end: {
    type: Date,
    required: [true, 'Please add an end date'],
  },
  allDay: {
    type: Boolean,
    default: false,
  },
  recurrence: {
    type: String, // e.g., 'daily', 'weekly', 'monthly', or null
    default: null,
  },
  reminders: [{
    time: { type: Number }, // Minutes before event
    sent: { type: Boolean, default: false },
  }],
  // Meeting-specific fields
  isMeeting: {
    type: Boolean,
    default: false,
  },
  meetingLink: {
    type: String,
  },
  meetingPlatform: {
    type: String,
    enum: ['zoom', 'teams', 'meet', 'other', null],
    default: null,
  },
  attendees: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    email: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending',
    },
  }],
  // Legacy field - keep for backwards compatibility
  participants: [{
    type: String, // Email addresses
  }],
}, {
  timestamps: true,
});

module.exports = mongoose.model('Event', eventSchema);
