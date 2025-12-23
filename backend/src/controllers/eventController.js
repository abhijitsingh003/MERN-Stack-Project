const Event = require('../models/Event');
const Calendar = require('../models/Calendar');
const CalendarShare = require('../models/CalendarShare');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');
const User = require('../models/User');
const sendEmail = require('../utils/emailService');

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

  const emailSubject = `New event in "${calendar.name}": ${title}`;
  const eventStart = start ? new Date(start) : null;
  const eventEnd = end ? new Date(end) : null;
  const startText = eventStart ? eventStart.toLocaleString() : '';
  const endText = eventEnd ? eventEnd.toLocaleString() : '';
  const creatorName = creator ? creator.name : 'Someone';
  const viewLink = `http://localhost:5173/`;

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f7fb;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f7fb;">
        <tr>
          <td style="padding: 40px 20px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08); overflow: hidden;">
              <!-- Header with gradient -->
              <tr>
                <td style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%); padding: 40px 40px 32px; text-align: center;">
                  <div style="width: 64px; height: 64px; background-color: rgba(255, 255, 255, 0.2); border-radius: 16px; margin: 0 auto 20px; display: inline-flex; align-items: center; justify-content: center;">
                    <span style="font-size: 32px;">🎉</span>
                  </div>
                  <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">New Event Created</h1>
                  <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.85);">in ${calendar.name}</p>
                </td>
              </tr>
              
              <!-- Main content -->
              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #64748b; text-align: center;">
                    <strong style="color: #1e293b;">${creatorName}</strong> created a new event in your shared calendar.
                  </p>
                  
                  <!-- Event Card -->
                  <div style="background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border: 1px solid #d8b4fe; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                    <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #7c3aed;">${title}</h2>
                    
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 8px 0;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td style="width: 24px; vertical-align: top;">
                                <span style="font-size: 16px;">📅</span>
                              </td>
                              <td style="padding-left: 12px;">
                                <p style="margin: 0; font-size: 13px; color: #94a3b8;">Date & Time</p>
                                <p style="margin: 4px 0 0; font-size: 14px; color: #1e293b; font-weight: 500;">
                                  ${startText}${endText ? ` → ${endText}` : ''}
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      ${location ? `
                      <tr>
                        <td style="padding: 8px 0;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td style="width: 24px; vertical-align: top;">
                                <span style="font-size: 16px;">📍</span>
                              </td>
                              <td style="padding-left: 12px;">
                                <p style="margin: 0; font-size: 13px; color: #94a3b8;">Location</p>
                                <p style="margin: 4px 0 0; font-size: 14px; color: #1e293b; font-weight: 500;">${location}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      ` : ''}
                      ${description ? `
                      <tr>
                        <td style="padding: 8px 0;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td style="width: 24px; vertical-align: top;">
                                <span style="font-size: 16px;">📝</span>
                              </td>
                              <td style="padding-left: 12px;">
                                <p style="margin: 0; font-size: 13px; color: #94a3b8;">Description</p>
                                <p style="margin: 4px 0 0; font-size: 14px; color: #1e293b;">${description}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      ` : ''}
                    </table>
                  </div>
                  
                  <!-- CTA Button -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td style="text-align: center; padding: 8px 0 16px;">
                        <a href="${viewLink}" style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 10px; box-shadow: 0 4px 14px rgba(139, 92, 246, 0.4);">
                          View in CalManage
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 20px 40px; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;">
                    You're receiving this because you have access to the "${calendar.name}" calendar.
                  </p>
                </td>
              </tr>
              

              <tr>
                <td style="padding: 20px 40px 24px; text-align: center;">
                  <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                    © ${new Date().getFullYear()} CalManage. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  // Collect recipients who have email notifications enabled
  const recipientEmails = [];

  // Check creator's preference
  if (creator.emailNotifications !== false) {
    recipientEmails.push(creator.email);
  }

  // Check shared users' preferences
  for (const share of shares) {
    if (share.user.email) {
      // Fetch full user to check preference
      const sharedUser = await User.findById(share.user._id).select('emailNotifications email');
      if (sharedUser && sharedUser.emailNotifications !== false) {
        recipientEmails.push(sharedUser.email);
      }
    }
  }

  const uniqueEmails = Array.from(new Set(recipientEmails.filter(Boolean)));
  if (uniqueEmails.length > 0) {
    for (const email of uniqueEmails) {
      await sendEmail(email, emailSubject, emailHtml);
    }
  }

  const populatedEvent = await Event.findById(event._id)
    .populate('createdBy', 'name email')
    .populate('calendar', 'name');

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

  // Send email notifications for event deletion
  const viewLink = `http://localhost:5173/`;
  const deleteEmailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f7fb;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f7fb;">
        <tr>
          <td style="padding: 40px 20px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08); overflow: hidden;">
              <!-- Header with gradient -->
              <tr>
                <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%); padding: 40px 40px 32px; text-align: center;">
                  <div style="width: 64px; height: 64px; background-color: rgba(255, 255, 255, 0.2); border-radius: 16px; margin: 0 auto 20px; display: inline-flex; align-items: center; justify-content: center;">
                    <span style="font-size: 32px;">🗑️</span>
                  </div>
                  <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">Event Deleted</h1>
                  <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.85);">from ${calendarName}</p>
                </td>
              </tr>
              
              <!-- Main content -->
              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #64748b; text-align: center;">
                    <strong style="color: #1e293b;">${deleterName}</strong> deleted an event from your shared calendar.
                  </p>
                  
                  <!-- Event Card -->
                  <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border: 1px solid #fca5a5; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                    <h2 style="margin: 0; font-size: 20px; font-weight: 600; color: #dc2626; text-decoration: line-through;">${eventTitle}</h2>
                  </div>
                  
                  <!-- CTA Button -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td style="text-align: center; padding: 8px 0 16px;">
                        <a href="${viewLink}" style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 10px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);">
                          View Calendar
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 20px 40px; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;">
                    You're receiving this because you have access to the "${calendarName}" calendar.
                  </p>
                </td>
              </tr>
              

              <tr>
                <td style="padding: 20px 40px 24px; text-align: center;">
                  <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                    © ${new Date().getFullYear()} CalManage. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  // Collect recipients who have email notifications enabled
  const deleteRecipientEmails = [];

  // Check deleter's preference
  if (deleter && deleter.emailNotifications !== false) {
    deleteRecipientEmails.push(deleter.email);
  }

  // Check calendar owner's preference
  const calendarOwner = await User.findById(calendar.user).select('email emailNotifications');
  if (calendarOwner && calendarOwner._id.toString() !== req.user.id.toString() && calendarOwner.emailNotifications !== false) {
    deleteRecipientEmails.push(calendarOwner.email);
  }

  // Check shared users' preferences
  for (const share of shares) {
    if (share.user._id.toString() !== req.user.id.toString()) {
      const sharedUser = await User.findById(share.user._id).select('emailNotifications email');
      if (sharedUser && sharedUser.emailNotifications !== false) {
        deleteRecipientEmails.push(sharedUser.email);
      }
    }
  }

  const uniqueDeleteEmails = Array.from(new Set(deleteRecipientEmails.filter(Boolean)));
  if (uniqueDeleteEmails.length > 0) {
    const deleteEmailSubject = `Event deleted from "${calendarName}": ${eventTitle}`;
    for (const email of uniqueDeleteEmails) {
      await sendEmail(email, deleteEmailSubject, deleteEmailHtml);
    }
  }

  res.status(200).json({ id: req.params.id });
};

module.exports = {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
};
