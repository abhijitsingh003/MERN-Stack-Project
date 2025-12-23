const express = require('express');
const router = express.Router();
const {
  getCalendars,
  createCalendar,
  updateCalendar,
  deleteCalendar,
} = require('../controllers/calendarController');
const { protect } = require('../middleware/authMiddleware');

const eventRouter = require('./eventRoutes');
const shareRouter = require('./shareRoutes');

// Re-route into other resource routers
router.use('/:calendarId/events', eventRouter);
router.use('/:id/share', shareRouter);

router.route('/').get(protect, getCalendars).post(protect, createCalendar);
router.route('/:id').patch(protect, updateCalendar).delete(protect, deleteCalendar);

module.exports = router;
