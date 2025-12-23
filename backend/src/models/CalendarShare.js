const mongoose = require('mongoose');

const calendarShareSchema = mongoose.Schema({
  calendar: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Calendar',
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User', // The user who the calendar is shared with
  },
  role: {
    type: String,
    enum: ['editor', 'viewer'],
    default: 'viewer',
  },
  status: {
    type: String,
    enum: ['pending', 'accepted'],
    default: 'pending',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('CalendarShare', calendarShareSchema);
