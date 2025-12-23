const Event = require('../models/Event');
const User = require('../models/User');
const Calendar = require('../models/Calendar');
const CalendarShare = require('../models/CalendarShare');

// @desc    Check availability for multiple users at a specific time
// @route   POST /api/availability/check
// @access  Private
const checkAvailability = async (req, res) => {
  try {
    const { emails, startTime, endTime } = req.body;
    
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ message: 'Please provide user emails' });
    }
    
    if (!startTime || !endTime) {
      return res.status(400).json({ message: 'Please provide start and end times' });
    }
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    const availability = [];
    
    for (const email of emails) {
      // Find user by email
      const user = await User.findOne({ email: email.toLowerCase() });
      
      if (!user) {
        availability.push({
          email,
          exists: false,
          status: 'unknown',
          message: 'User not found in system'
        });
        continue;
      }
      
      // Get all calendars owned by this user
      const userCalendars = await Calendar.find({ user: user._id });
      const calendarIds = userCalendars.map(c => c._id);
      
      // Check for overlapping events
      const conflictingEvents = await Event.find({
        calendar: { $in: calendarIds },
        $or: [
          // Event starts during the requested time
          { start: { $gte: start, $lt: end } },
          // Event ends during the requested time
          { end: { $gt: start, $lte: end } },
          // Event spans the entire requested time
          { start: { $lte: start }, end: { $gte: end } }
        ]
      });
      
      const isBlocked = conflictingEvents.length > 0;
      
      availability.push({
        email,
        exists: true,
        userId: user._id,
        name: user.name,
        status: isBlocked ? 'blocked' : 'free',
        // Don't expose event details for privacy - just the count
        conflictCount: conflictingEvents.length
      });
    }
    
    res.status(200).json(availability);
  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({ message: 'Server error checking availability' });
  }
};

// @desc    Find available time slots for multiple users
// @route   POST /api/availability/slots
// @access  Private
const findFreeSlots = async (req, res) => {
  try {
    const { emails, date, durationMinutes = 30 } = req.body;
    
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ message: 'Please provide user emails' });
    }
    
    if (!date) {
      return res.status(400).json({ message: 'Please provide a date' });
    }
    
    const targetDate = new Date(date);
    const dayStart = new Date(targetDate);
    dayStart.setHours(8, 0, 0, 0); // Start at 8 AM
    
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(20, 0, 0, 0); // End at 8 PM
    
    // Collect all busy times for all users
    const allBusySlots = [];
    const foundUsers = [];
    
    for (const email of emails) {
      const user = await User.findOne({ email: email.toLowerCase() });
      
      if (!user) continue;
      
      foundUsers.push({ email, name: user.name, userId: user._id });
      
      // Get user's calendars
      const userCalendars = await Calendar.find({ user: user._id });
      const calendarIds = userCalendars.map(c => c._id);
      
      // Get events for this user on the target date
      const events = await Event.find({
        calendar: { $in: calendarIds },
        start: { $lt: dayEnd },
        end: { $gt: dayStart }
      }).select('start end');
      
      for (const event of events) {
        allBusySlots.push({
          email,
          start: new Date(Math.max(event.start, dayStart)),
          end: new Date(Math.min(event.end, dayEnd))
        });
      }
    }
    
    // Sort busy slots by start time
    allBusySlots.sort((a, b) => a.start - b.start);
    
    // Find free slots that work for everyone
    const freeSlots = [];
    const slotDuration = durationMinutes * 60 * 1000; // Convert to ms
    
    // Check every 30-minute interval
    let currentTime = new Date(dayStart);
    
    while (currentTime.getTime() + slotDuration <= dayEnd.getTime()) {
      const slotStart = new Date(currentTime);
      const slotEnd = new Date(currentTime.getTime() + slotDuration);
      
      // Check if this slot conflicts with any busy time
      const hasConflict = allBusySlots.some(busy => {
        return (slotStart < busy.end && slotEnd > busy.start);
      });
      
      if (!hasConflict) {
        freeSlots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
          startFormatted: slotStart.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          }),
          endFormatted: slotEnd.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          })
        });
      }
      
      // Move to next 30-minute slot
      currentTime = new Date(currentTime.getTime() + 30 * 60 * 1000);
    }
    
    res.status(200).json({
      date: targetDate.toISOString().split('T')[0],
      duration: durationMinutes,
      users: foundUsers,
      freeSlots,
      totalSlots: freeSlots.length
    });
  } catch (error) {
    console.error('Find free slots error:', error);
    res.status(500).json({ message: 'Server error finding free slots' });
  }
};

// @desc    Search users by email for attendee autocomplete
// @route   GET /api/availability/users/search
// @access  Private
const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(200).json([]);
    }
    
    // Search by email or name, exclude current user
    const users = await User.find({
      _id: { $ne: req.user.id },
      $or: [
        { email: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } }
      ]
    })
    .select('name email')
    .limit(5);
    
    res.status(200).json(users);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error searching users' });
  }
};

module.exports = {
  checkAvailability,
  findFreeSlots,
  searchUsers
};
