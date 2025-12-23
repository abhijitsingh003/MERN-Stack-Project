const express = require('express');
const router = express.Router();
const { getPreferences, updatePreferences } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.route('/preferences')
  .get(protect, getPreferences)
  .patch(protect, updatePreferences);

module.exports = router;
