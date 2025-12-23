const express = require('express');
const router = express.Router();
const { getActivity } = require('../controllers/activityController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getActivity);

module.exports = router;
