import { useState } from 'react';
import { useCalendar } from '../context/CalendarContext';
import { Plus, Trash2, CheckCircle, Circle, Clock, Sparkles, PartyPopper } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassPanel from '../components/UI/GlassPanel';
import { format } from 'date-fns';

const TasksPage = () => {
  const { tasks, addTask, toggleTask, deleteTask } = useCalendar();
  const [newTask, setNewTask] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    setIsAdding(true);
    await addTask(newTask);
    setNewTask('');
    setIsAdding(false);
  };

  const pendingTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            My Tasks
          </h1>
          <p className="text-gray-400 mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            {pendingTasks.length} pending tasks
          </p>
        </div>
      </div>

      {/* Input Section */}
      <GlassPanel className="p-4 mb-8">
        <form onSubmit={handleAddTask} className="flex items-center gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Plus className="h-5 w-5 text-gray-500" />
            </div>
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Add a new task..."
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={!newTask.trim() || isAdding}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAdding ? 'Adding...' : 'Add Task'}
          </button>
        </form>
      </GlassPanel>

      {/* Tasks Lists */}
      <div className="space-y-6">
        {/* Pending Tasks */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider pl-2">To Do</h2>
          <AnimatePresence mode='popLayout'>
            {pendingTasks.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-12 px-8 text-center rounded-2xl bg-gradient-to-br from-white/[0.02] to-transparent border border-white/5"
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                  <PartyPopper className="w-6 h-6 text-blue-400" />
                </div>
                <p className="text-gray-400 text-sm font-medium mb-1">All caught up!</p>
                <p className="text-blue-400 text-xs font-medium">No pending tasks. Great job!</p>
              </motion.div>
            )}
            {pendingTasks.map((task) => (
              <GlassPanel
                key={task._id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group p-4 flex items-center justify-between border-l-4 border-l-blue-500"
                whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
              >
                <div className="flex items-center gap-4 flex-1">
                  <button
                    onClick={() => toggleTask(task._id, task.completed)}
                    className="text-gray-400 hover:text-blue-500 transition-colors"
                  >
                    <Circle className="w-6 h-6" />
                  </button>
                  <span className="text-gray-100 font-medium">{task.text}</span>
                </div>
                <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {task.createdAt ? format(new Date(task.createdAt), 'MMM d') : 'Today'}
                  </span>
                  <button
                    onClick={() => deleteTask(task._id)}
                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </GlassPanel>
            ))}
          </AnimatePresence>
        </div>

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div className="space-y-3 pt-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider pl-2">Completed</h2>
            <AnimatePresence mode='popLayout'>
              {completedTasks.map((task) => (
                <motion.div
                  key={task._id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-4 flex items-center justify-between rounded-xl bg-white/5 border border-white/5 opacity-60 hover:opacity-100 transition-all"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <button
                      onClick={() => toggleTask(task._id, task.completed)}
                      className="text-green-500 hover:text-green-400 transition-colors"
                    >
                      <CheckCircle className="w-6 h-6" />
                    </button>
                    <span className="text-gray-400 line-through font-medium">{task.text}</span>
                  </div>
                  <button
                    onClick={() => deleteTask(task._id)}
                    className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default TasksPage;
