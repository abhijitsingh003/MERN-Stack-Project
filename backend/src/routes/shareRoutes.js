const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  shareCalendar,
  getShares,
  removeShare,
  getMyInvites,
  respondToInvite,
  getCalendarShares
} = require('../controllers/shareController');
const { protect } = require('../middleware/authMiddleware');

// Route for getting my invites (not dependent on calendarId, but router mergeParams might be tricky if we use it under /calendars/:id/share)
// We should probably mount this router separately for invites, or handle it here carefully.
// If mounted at /api/shares/invites, we need a new mount in server.js. 
// If we keep it here, we need to make sure it doesn't conflict.

router.get('/invites', protect, getMyInvites);
router.patch('/invites/:id', protect, respondToInvite);

// Get shares for a specific calendar (for owner to manage)
router.get('/calendar/:calendarId', protect, getCalendarShares);

router.route('/').get(protect, getShares).post(protect, shareCalendar);
router.route('/:shareId').delete(protect, removeShare);

module.exports = router;
