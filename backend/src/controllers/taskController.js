const Task = require('../models/Task');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');

// @desc    Get user tasks
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
  const tasks = await Task.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.status(200).json(tasks);
};

// @desc    Create a task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res) => {
  if (!req.body.text) {
    return res.status(400).json({ message: 'Please add text' });
  }

  const task = await Task.create({
    text: req.body.text,
    user: req.user.id,
  });

  // Create notification
  await Notification.create({
    user: req.user.id,
    message: `New task added: ${task.text}`,
    type: 'task',
    relatedId: task._id
  });

  res.status(200).json(task);
};

// @desc    Update a task (toggle complete)
// @route   PATCH /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  if (task.user.toString() !== req.user.id) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  const updatedTask = await Task.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  // Log activity if completed
  if (req.body.completed === true && !task.completed) {
    await Activity.create({
      user: req.user.id,
      action: 'completed',
      target: 'Task',
      details: task.text
    });
  }

  res.status(200).json(updatedTask);
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  if (task.user.toString() !== req.user.id) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  await task.deleteOne();

  res.status(200).json({ id: req.params.id });
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
};
