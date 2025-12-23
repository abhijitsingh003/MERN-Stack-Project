const Notification = require('../models/Notification');

const getNotifications = async (req, res) => {
  const notifications = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.status(200).json(notifications);
};

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return res.status(404).json({ message: 'Notification not found' });
  }

  if (notification.user.toString() !== req.user.id) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  notification.isRead = true;
  await notification.save();

  res.status(200).json(notification);
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return res.status(404).json({ message: 'Notification not found' });
  }

  if (notification.user.toString() !== req.user.id) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  await notification.deleteOne();
  res.status(200).json({ id: req.params.id });
};

// @desc    Clear all notifications
// @route   DELETE /api/notifications
// @access  Private
const clearAll = async (req, res) => {
  await Notification.deleteMany({ user: req.user.id });
  res.status(200).json({ message: 'All notifications cleared' });
};

module.exports = {
  getNotifications,
  markAsRead,
  deleteNotification,
  clearAll,
};
