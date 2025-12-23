const User = require('../models/User');

// @desc    Get user preferences
// @route   GET /api/users/preferences
// @access  Private
const getPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('emailNotifications');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      emailNotifications: user.emailNotifications ?? true,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user preferences
// @route   PATCH /api/users/preferences
// @access  Private
const updatePreferences = async (req, res) => {
  try {
    const { emailNotifications } = req.body;
    
    const updateData = {};
    if (typeof emailNotifications === 'boolean') {
      updateData.emailNotifications = emailNotifications;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    ).select('emailNotifications');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Preferences updated successfully',
      emailNotifications: user.emailNotifications,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getPreferences,
  updatePreferences,
};
