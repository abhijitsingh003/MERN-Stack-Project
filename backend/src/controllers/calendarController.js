const Calendar = require('../models/Calendar');
const Activity = require('../models/Activity');

// @desc    Get user calendars
// @route   GET /api/calendars
// @access  Private
const getCalendars = async (req, res) => {
  let calendars = await Calendar.find({ user: req.user.id }).sort({ isDefault: -1, createdAt: 1 });

  const hasDefault = calendars.some(c => c.isDefault);
  if (!hasDefault) {
    let personal = calendars.find(c => c.name === 'Personal');
    if (personal) {
      personal.isDefault = true;
      await personal.save();
    } else {
      personal = await Calendar.create({
        user: req.user.id,
        name: 'Personal',
        color: '#3b82f6',
        isDefault: true,
        settings: {
          defaultView: 'month',
          notifications: {
            emailReminders: true,
            inAppReminders: true,
          },
        },
      });
      calendars.push(personal);
    }

    calendars = calendars.sort((a, b) => {
      if (a.isDefault === b.isDefault) {
        return a.createdAt - b.createdAt;
      }
      return a.isDefault ? -1 : 1;
    });

    await Activity.create({
      user: req.user.id,
      action: 'created',
      target: 'Calendar',
      details: `Default calendar "Personal" ensured (${calendars[0]._id})`,
    });
  }

  res.status(200).json(calendars);
};

// @desc    Create a calendar
// @route   POST /api/calendars
// @access  Private
const createCalendar = async (req, res) => {
  if (!req.body.name) {
    return res.status(400).json({ message: 'Please add a name' });
  }

  const calendar = await Calendar.create({
    name: req.body.name,
    color: req.body.color,
    user: req.user.id,
    isDefault: req.body.isDefault,
  });

  res.status(200).json(calendar);
};

// @desc    Update a calendar
// @route   PATCH /api/calendars/:id
// @access  Private
const updateCalendar = async (req, res) => {
  const calendar = await Calendar.findById(req.params.id);

  if (!calendar) {
    return res.status(404).json({ message: 'Calendar not found' });
  }

  // Check for user
  if (!req.user) {
    return res.status(401).json({ message: 'User not found' });
  }

  // Make sure the logged in user matches the calendar user
  if (calendar.user.toString() !== req.user.id) {
    return res.status(401).json({ message: 'User not authorized' });
  }

  const updatedCalendar = await Calendar.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  res.status(200).json(updatedCalendar);
};

// @desc    Delete a calendar
// @route   DELETE /api/calendars/:id
// @access  Private
const deleteCalendar = async (req, res) => {
  const calendar = await Calendar.findById(req.params.id);

  if (!calendar) {
    return res.status(404).json({ message: 'Calendar not found' });
  }

  // Check for user
  if (!req.user) {
    return res.status(401).json({ message: 'User not found' });
  }

  // Make sure the logged in user matches the calendar user
  if (calendar.user.toString() !== req.user.id) {
    return res.status(401).json({ message: 'User not authorized' });
  }

  if (calendar.isDefault && req.query.allowDefaultDelete !== 'true') {
    return res.status(400).json({ message: 'Default calendar can only be removed from account settings' });
  }

  await calendar.deleteOne();

  res.status(200).json({ id: req.params.id });
};

module.exports = {
  getCalendars,
  createCalendar,
  updateCalendar,
  deleteCalendar,
};
