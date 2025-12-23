const express = require('express');
const router = express.Router();
const {
  checkAvailability,
  findFreeSlots,
  searchUsers
} = require('../controllers/availabilityController');
const { protect } = require('../middleware/authMiddleware');

// Check availability for users at a specific time
router.post('/check', protect, checkAvailability);

// Find free time slots for multiple users
router.post('/slots', protect, findFreeSlots);

// Search users for attendee autocomplete
router.get('/users/search', protect, searchUsers);

module.exports = router;
