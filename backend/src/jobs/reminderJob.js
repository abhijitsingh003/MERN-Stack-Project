const cron = require('node-cron');
const Event = require('../models/Event');
const Notification = require('../models/Notification');
const Calendar = require('../models/Calendar');
const CalendarShare = require('../models/CalendarShare');
const User = require('../models/User');
const sendEmail = require('../utils/emailService');

// Email template for event start - Lighter green with improved UI
const getEventStartEmailHtml = (event, calendarName) => {
  const startText = event.start ? new Date(event.start).toLocaleString() : '';
  const endText = event.end ? new Date(event.end).toLocaleString() : '';
  const viewLink = `http://localhost:5173/`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc;">
        <tr>
          <td style="padding: 48px 24px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08); overflow: hidden;">
              <!-- Header with lighter gradient -->
              <tr>
                <td style="background: linear-gradient(135deg, #34d399 0%, #10b981 50%, #059669 100%); padding: 48px 32px 40px; text-align: center;">
                  <div style="width: 72px; height: 72px; background-color: rgba(255, 255, 255, 0.25); border-radius: 20px; margin: 0 auto 24px; line-height: 72px; text-align: center;">
                    <span style="font-size: 36px; vertical-align: middle;">🚀</span>
                  </div>
                  <h1 style="margin: 0; font-size: 26px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">Event Started!</h1>
                  <p style="margin: 10px 0 0; font-size: 15px; color: rgba(255, 255, 255, 0.9); font-weight: 500;">${calendarName}</p>
                </td>
              </tr>
              
              <!-- Main content -->
              <tr>
                <td style="padding: 32px;">
                  <!-- Event Title -->
                  <h2 style="margin: 0 0 24px; font-size: 22px; font-weight: 600; color: #1e293b; text-align: center;">${event.title}</h2>
                  
                  <!-- Event Details Card -->
                  <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 16px; padding: 20px;">
                    <!-- Date & Time -->
                    <div style="display: flex; padding: 12px 0; border-bottom: 1px solid #dcfce7;">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                          <td style="width: 40px; vertical-align: top; padding-top: 2px;">
                            <div style="width: 36px; height: 36px; background-color: #dcfce7; border-radius: 10px; line-height: 36px; text-align: center;">
                              <span style="font-size: 18px;">📅</span>
                            </div>
                          </td>
                          <td style="padding-left: 14px; vertical-align: middle;">
                            <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">When</p>
                            <p style="margin: 6px 0 0; font-size: 14px; color: #1e293b; font-weight: 500; line-height: 1.4;">
                              ${startText}${endText ? `<br/><span style="color: #64748b;">to</span> ${endText}` : ''}
                            </p>
                          </td>
                        </tr>
                      </table>
                    </div>
                    ${event.location ? `
                    <!-- Location -->
                    <div style="padding: 12px 0;">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                          <td style="width: 40px; vertical-align: top; padding-top: 2px;">
                            <div style="width: 36px; height: 36px; background-color: #dcfce7; border-radius: 10px; line-height: 36px; text-align: center;">
                              <span style="font-size: 18px;">📍</span>
                            </div>
                          </td>
                          <td style="padding-left: 14px; vertical-align: middle;">
                            <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Where</p>
                            <p style="margin: 6px 0 0; font-size: 14px; color: #1e293b; font-weight: 500;">${event.location}</p>
                          </td>
                        </tr>
                      </table>
                    </div>
                    ` : ''}
                  </div>
                  
                  <!-- CTA Button -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td style="text-align: center; padding: 28px 0 8px;">
                        <a href="${viewLink}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #34d399 0%, #10b981 100%); color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 12px; box-shadow: 0 4px 16px rgba(16, 185, 129, 0.35);">
                          View in CalManage
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;">
                    You're receiving this because you have access to "${calendarName}"
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
};

// Email template for event end - Lighter red with improved UI
const getEventEndEmailHtml = (event, calendarName) => {
  const startText = event.start ? new Date(event.start).toLocaleString() : '';
  const endText = event.end ? new Date(event.end).toLocaleString() : '';
  const viewLink = `http://localhost:5173/`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc;">
        <tr>
          <td style="padding: 48px 24px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08); overflow: hidden;">
              <!-- Header with lighter red gradient -->
              <tr>
                <td style="background: linear-gradient(135deg, #f87171 0%, #ef4444 50%, #dc2626 100%); padding: 48px 32px 40px; text-align: center;">
                  <div style="width: 72px; height: 72px; background-color: rgba(255, 255, 255, 0.25); border-radius: 20px; margin: 0 auto 24px; line-height: 72px; text-align: center;">
                    <span style="font-size: 36px; vertical-align: middle;">🎊</span>
                  </div>
                  <h1 style="margin: 0; font-size: 26px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">Event Ended</h1>
                  <p style="margin: 10px 0 0; font-size: 15px; color: rgba(255, 255, 255, 0.9); font-weight: 500;">${calendarName}</p>
                </td>
              </tr>
              
              <!-- Main content -->
              <tr>
                <td style="padding: 32px;">
                  <!-- Event Title -->
                  <h2 style="margin: 0 0 24px; font-size: 22px; font-weight: 600; color: #1e293b; text-align: center;">${event.title}</h2>
                  
                  <!-- Event Details Card -->
                  <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 16px; padding: 20px;">
                    <!-- Duration -->
                    <div style="padding: 12px 0;">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                          <td style="width: 40px; vertical-align: top; padding-top: 2px;">
                            <div style="width: 36px; height: 36px; background-color: #fee2e2; border-radius: 10px; line-height: 36px; text-align: center;">
                              <span style="font-size: 18px;">⏱️</span>
                            </div>
                          </td>
                          <td style="padding-left: 14px; vertical-align: middle;">
                            <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Duration</p>
                            <p style="margin: 6px 0 0; font-size: 14px; color: #1e293b; font-weight: 500; line-height: 1.4;">
                              ${startText}${endText ? `<br/><span style="color: #64748b;">to</span> ${endText}` : ''}
                            </p>
                          </td>
                        </tr>
                      </table>
                    </div>
                  </div>
                  
                  <!-- CTA Button -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td style="text-align: center; padding: 28px 0 8px;">
                        <a href="${viewLink}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #f87171 0%, #ef4444 100%); color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 12px; box-shadow: 0 4px 16px rgba(239, 68, 68, 0.35);">
                          View in CalManage
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;">
                    You're receiving this because you have access to "${calendarName}"
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
};

// Helper function to get all email recipients for a calendar event
const getEventRecipientEmails = async (calendar, calendarId) => {
  const recipientEmails = [];

  // Get calendar owner
  const owner = await User.findById(calendar.user).select('email emailNotifications');
  if (owner && owner.emailNotifications !== false) {
    recipientEmails.push(owner.email);
  }

  // Get all shared users
  const shares = await CalendarShare.find({
    calendar: calendarId,
    status: 'accepted',
  }).populate('user', 'email');

  for (const share of shares) {
    if (share.user && share.user.email) {
      const sharedUser = await User.findById(share.user._id).select('email emailNotifications');
      if (sharedUser && sharedUser.emailNotifications !== false) {
        recipientEmails.push(sharedUser.email);
      }
    }
  }

  return Array.from(new Set(recipientEmails.filter(Boolean)));
};

const checkReminders = () => {
  cron.schedule('* * * * *', async () => {
    console.log('Checking for reminders...');
    const now = new Date();

    // Find events that have reminders not sent
    // This is a simplified logic. In production, you'd query more efficiently.
    // We look for events where start time - reminder time <= now

    // For efficiency, let's just find events starting in the next 24 hours
    const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // 1. Process standard reminders
    const eventsWithReminders = await Event.find({
      start: { $gte: now, $lte: next24h },
      'reminders.sent': false,
    }).populate('calendar');

    for (const event of eventsWithReminders) {
      for (const reminder of event.reminders) {
        if (reminder.sent) continue;

        const reminderTime = new Date(event.start.getTime() - reminder.time * 60000);

        if (reminderTime <= now) {
          const calendar = event.calendar;
          if (calendar) {
            await Notification.create({
              user: calendar.user,
              message: `Reminder: ${event.title} starts in ${reminder.time} minutes`,
              type: 'reminder',
              relatedId: event._id,
            });

            reminder.sent = true;
          }
        }
      }
      await event.save();
    }

    // 2. Process Start Notifications
    // Find events that have started (start <= now) but haven't sent start notification
    // Limit to events that started in the last 24 hours to avoid spamming for old events
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const startingEvents = await Event.find({
      start: { $lte: now, $gte: last24h },
      startNotificationSent: { $ne: true },
    }).populate('calendar');

    for (const event of startingEvents) {
      const calendar = event.calendar;
      if (calendar) {
        // Create in-app notification
        await Notification.create({
          user: calendar.user,
          message: `Event Started: ${event.title}`,
          type: 'event_start',
          relatedId: event._id,
        });

        // Send email notifications
        try {
          const recipientEmails = await getEventRecipientEmails(calendar, calendar._id);
          if (recipientEmails.length > 0) {
            const emailSubject = `🚀 Event Started: ${event.title}`;
            const emailHtml = getEventStartEmailHtml(event, calendar.name);

            Promise.all(recipientEmails.map(email => sendEmail(email, emailSubject, emailHtml)))
              .catch(err => console.error('Error sending event start emails:', err));
          }
        } catch (err) {
          console.error('Error preparing event start emails:', err);
        }

        event.startNotificationSent = true;
        await event.save();
      }
    }

    // 3. Process End Notifications
    // Find events that have ended (end <= now) but haven't sent end notification
    const endingEvents = await Event.find({
      end: { $lte: now, $gte: last24h },
      endNotificationSent: { $ne: true },
    }).populate('calendar');

    for (const event of endingEvents) {
      const calendar = event.calendar;
      if (calendar) {
        // Create in-app notification
        await Notification.create({
          user: calendar.user,
          message: `Event Ended: ${event.title}`,
          type: 'event_end',
          relatedId: event._id,
        });

        // Send email notifications
        try {
          const recipientEmails = await getEventRecipientEmails(calendar, calendar._id);
          if (recipientEmails.length > 0) {
            const emailSubject = `🎊 Event Ended: ${event.title}`;
            const emailHtml = getEventEndEmailHtml(event, calendar.name);

            Promise.all(recipientEmails.map(email => sendEmail(email, emailSubject, emailHtml)))
              .catch(err => console.error('Error sending event end emails:', err));
          }
        } catch (err) {
          console.error('Error preparing event end emails:', err);
        }

        event.endNotificationSent = true;
        await event.save();
      }
    }
  });
};

module.exports = checkReminders;
