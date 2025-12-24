const cron = require('node-cron');
const Event = require('../models/Event');
const Notification = require('../models/Notification');
const Calendar = require('../models/Calendar'); // To get the user

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
        await Notification.create({
          user: calendar.user,
          message: `Event Started: ${event.title}`,
          type: 'event_start',
          relatedId: event._id,
        });

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
        await Notification.create({
          user: calendar.user,
          message: `Event Ended: ${event.title}`,
          type: 'event_end',
          relatedId: event._id,
        });

        event.endNotificationSent = true;
        await event.save();
      }
    }
  });
};

module.exports = checkReminders;
