const Event = require('../models/Event');
const Calendar = require('../models/Calendar');
const CalendarShare = require('../models/CalendarShare');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');
const User = require('../models/User');

const resolveCalendarAccess = async (calendarId, userId) => {
  const calendar = await Calendar.findById(calendarId);
  if (!calendar) {
    return { calendar: null, role: null, isOwner: false };
  }
  const isOwner = calendar.user.toString() === userId.toString();
  if (isOwner) {
    return { calendar, role: 'owner', isOwner: true };
  }
  const share = await CalendarShare.findOne({
    calendar: calendarId,
    user: userId,
    status: 'accepted',
  });
  if (!share) {
    return { calendar, role: null, isOwner: false };
  }
  return { calendar, role: share.role, isOwner: false };
};

// @desc    Get events for a calendar
// @route   GET /api/calendars/:calendarId/events
// @access  Private
const getEvents = async (req, res) => {
  const { calendarId } = req.params;
  const access = await resolveCalendarAccess(calendarId, req.user.id);
  if (!access.calendar) {
    return res.status(404).json({ message: 'Calendar not found' });
  }
  if (!access.isOwner && !access.role) {
    return res.status(401).json({ message: 'Not authorized' });
  }
  const events = await Event.find({ calendar: calendarId }).populate('createdBy', 'name email');
  res.status(200).json(events);
};

// @desc    Create an event
// @route   POST /api/calendars/:calendarId/events
// @access  Private
const createEvent = async (req, res) => {
  const { title, start, end, description, location, allDay, recurrence, reminders, participants, attendees, isMeeting, meetingLink, meetingPlatform } = req.body;
  const { calendarId } = req.params;

  if (!calendarId) {
    return res.status(400).json({ message: 'Calendar ID is required' });
  }

  // Basic validation
  if (!start || !end) {
    return res.status(400).json({ message: 'Start and End dates are required' });
  }

  const startDate = new Date(start);
  const endDate = new Date(end);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return res.status(400).json({ message: 'Invalid date format' });
  }

  const access = await resolveCalendarAccess(calendarId, req.user.id);
  if (!access.calendar) {
    return res.status(404).json({ message: 'Calendar not found' });
  }
  if (!access.isOwner && access.role !== 'editor') {
    return res.status(401).json({ message: 'Not authorized' });
  }

  const event = await Event.create({
    calendar: calendarId,
    createdBy: req.user.id,
    title,
    start,
    end,
    description,
    location,
    allDay,
    recurrence,
    reminders,
    participants,
    attendees,
    isMeeting,
    meetingLink,
    meetingPlatform
  });

  const calendar = access.calendar;
  const creator = await User.findById(req.user.id).select('name email emailNotifications');

  const shares = await CalendarShare.find({
    calendar: calendarId,
    status: 'accepted',
  }).populate('user', 'name email');

  const audienceUserIds = new Set();
  audienceUserIds.add(calendar.user.toString());
  for (const share of shares) {
    audienceUserIds.add(share.user._id.toString());
  }

  const activities = [];
  const notifications = [];

  for (const userId of audienceUserIds) {
    const isCreator = userId === req.user.id.toString();
    const actorName = creator ? creator.name : 'Someone';
    const prefix = isCreator ? 'You created' : `${actorName} created`;
    activities.push({
      user: userId,
      action: 'created',
      target: 'Event',
      details: `${prefix} event "${event.title}" in calendar "${calendar.name}" (${event._id})`,
    });
    notifications.push({
      user: userId,
      message: `${prefix} "${event.title}" in ${calendar.name}`,
      type: 'event_created',
      relatedId: event._id,
    });
  }

  if (activities.length > 0) {
    await Activity.insertMany(activities);
  }
  if (notifications.length > 0) {
    await Notification.insertMany(notifications);
  }

  // Fetch populated event for response
  const populatedEvent = await Event.findById(event._id)
    .populate('createdBy', 'name email')
    .populate('calendar', 'name');

  // Send response immediately (emails will be sent when event starts via cron job)
  res.status(201).json({ success: true, event: populatedEvent });
};

// @desc    Update an event
// @route   PATCH /api/events/:id
// @access  Private
const updateEvent = async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    return res.status(404).json({ message: 'Event not found' });
  }

  const access = await resolveCalendarAccess(event.calendar, req.user.id);
  if (!access.calendar) {
    return res.status(404).json({ message: 'Calendar not found' });
  }
  if (!access.isOwner && access.role !== 'editor') {
    return res.status(401).json({ message: 'Not authorized' });
  }

  const updateData = {};
  if (typeof req.body.title !== 'undefined') updateData.title = req.body.title;
  if (typeof req.body.start !== 'undefined') updateData.start = req.body.start;
  if (typeof req.body.end !== 'undefined') updateData.end = req.body.end;
  if (typeof req.body.description !== 'undefined') updateData.description = req.body.description;
  if (typeof req.body.location !== 'undefined') updateData.location = req.body.location;
  if (typeof req.body.allDay !== 'undefined') updateData.allDay = req.body.allDay;
  if (typeof req.body.recurrence !== 'undefined') updateData.recurrence = req.body.recurrence;
  if (typeof req.body.reminders !== 'undefined') updateData.reminders = req.body.reminders;
  if (typeof req.body.participants !== 'undefined') updateData.participants = req.body.participants;
  if (typeof req.body.attendees !== 'undefined') updateData.attendees = req.body.attendees;
  if (typeof req.body.isMeeting !== 'undefined') updateData.isMeeting = req.body.isMeeting;
  if (typeof req.body.meetingLink !== 'undefined') updateData.meetingLink = req.body.meetingLink;
  if (typeof req.body.meetingPlatform !== 'undefined') updateData.meetingPlatform = req.body.meetingPlatform;

  const updatedEvent = await Event.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true }
  );

  await Activity.create({
    user: req.user.id,
    action: 'updated',
    target: 'Event',
    details: updatedEvent ? `${updatedEvent.title} (${updatedEvent._id})` : `${event.title} (${event._id})`,
  });

  res.status(200).json(updatedEvent);
};

// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Private
const deleteEvent = async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    return res.status(404).json({ message: 'Event not found' });
  }

  const access = await resolveCalendarAccess(event.calendar, req.user.id);
  if (!access.calendar) {
    return res.status(404).json({ message: 'Calendar not found' });
  }
  if (!access.isOwner && access.role !== 'editor') {
    return res.status(401).json({ message: 'Not authorized' });
  }

  const isCreator = event.createdBy && event.createdBy.toString() === req.user.id.toString();
  if (!access.isOwner && !isCreator) {
    return res.status(401).json({ message: 'Not authorized to delete this event' });
  }

  // Get deleter info
  const deleter = await User.findById(req.user.id).select('name email emailNotifications');
  const calendar = access.calendar;

  // Get all shared users for this calendar
  const shares = await CalendarShare.find({
    calendar: event.calendar,
    status: 'accepted',
  }).populate('user', 'name email');

  // Build audience: owner + all shared users
  const audienceUserIds = new Set();
  audienceUserIds.add(calendar.user.toString());
  for (const share of shares) {
    audienceUserIds.add(share.user._id.toString());
  }

  // Store event info before deletion
  const eventTitle = event.title;
  const eventId = event._id;
  const calendarName = calendar.name;
  const deleterName = deleter ? deleter.name : 'Someone';

  // Delete the event
  await event.deleteOne();

  // Create activities and notifications for all participants
  const activities = [];
  const notifications = [];

  for (const userId of audienceUserIds) {
    const isDeleter = userId === req.user.id.toString();
    const prefix = isDeleter ? 'You deleted' : `${deleterName} deleted`;

    activities.push({
      user: userId,
      action: 'deleted',
      target: 'Event',
      details: `${prefix} event "${eventTitle}" from calendar "${calendarName}"`,
    });

    notifications.push({
      user: userId,
      message: `${prefix} "${eventTitle}" from ${calendarName}`,
      type: 'event_deleted',
      relatedId: eventId,
    });
  }

  if (activities.length > 0) {
    await Activity.insertMany(activities);
  }
  if (notifications.length > 0) {
    await Notification.insertMany(notifications);
  }

  // Send response immediately (no emails for deletion - emails only for event start/end)
  res.status(200).json({ id: req.params.id });
};

module.exports = {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
};
