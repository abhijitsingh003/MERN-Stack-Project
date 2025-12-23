const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');

// /api/calendars/:calendarId/events
router.route('/')
  .get(protect, getEvents)
  .post(protect, createEvent);

// /api/events/:id
router.route('/:id')
  .get(protect, async (req, res) => {
      // Basic get event by ID implementation inline or import
      const Event = require('../models/Event');
      const event = await Event.findById(req.params.id);
      if (!event) return res.status(404).json({ message: 'Event not found' });
      res.status(200).json(event);
  })
  .patch(protect, updateEvent)
  .delete(protect, deleteEvent);

module.exports = router;
