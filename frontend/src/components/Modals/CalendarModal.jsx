import { useState, useEffect } from 'react';
import { useCalendar } from '../../context/CalendarContext';
import { X, Calendar as CalendarIcon, Users } from 'lucide-react';
import GlassPanel from '../UI/GlassPanel';
import { motion, AnimatePresence } from 'framer-motion';

const CalendarModal = ({ isOpen, onClose, calendarToEdit }) => {
  const [name, setName] = useState('');
  const [shareWith, setShareWith] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [role, setRole] = useState('viewer');
  const { addCalendar, shareCalendar, updateCalendar } = useCalendar();

  // Reset or pre-fill form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (calendarToEdit) {
        setName(calendarToEdit.name);
        setIsShared(false); // Can be expanded to load shares if needed
        setShareWith('');
      } else {
        setName('');
        setIsShared(false);
        setShareWith('');
      }
    }
  }, [isOpen, calendarToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (calendarToEdit) {
      await updateCalendar(calendarToEdit._id, { name });
    } else {
      const newCalendar = await addCalendar({ name });

      if (newCalendar && newCalendar._id && isShared && shareWith.trim()) {
        const emails = shareWith.split(',').map(e => e.trim()).filter(e => e);
        for (const email of emails) {
          try {
            await shareCalendar(newCalendar._id, email, role);
          } catch (error) {
            console.error(`Failed to share with ${email}`, error);
          }
        }
      }
    }

    onClose();
    setName('');
    setShareWith('');
    setIsShared(false);
    setRole('viewer');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="w-full max-w-md relative z-10"
          >
            <GlassPanel className="p-0 border border-white/10 shadow-2xl bg-dark-bg/90 backdrop-blur-2xl">
              <div className="p-6 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-blue-500" /> {calendarToEdit ? 'Edit Calendar' : 'Create Calendar'}
                </h3>
                <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Marketing Campaign"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <label className="flex items-start cursor-pointer">
                      <input
                        type="checkbox"
                        className="mt-1 mr-3 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-offset-gray-900"
                        checked={isShared}
                        onChange={(e) => setIsShared(e.target.checked)}
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white flex items-center gap-2">
                          <Users className="w-4 h-4 text-purple-400" /> Share this calendar
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">Allow others to view or edit.</p>
                      </div>
                    </label>

                    <AnimatePresence>
                      {isShared && (
                        <motion.div
                          initial={{ height: 0, opacity: 0, marginTop: 0 }}
                          animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
                          exit={{ height: 0, opacity: 0, marginTop: 0 }}
                          className="space-y-4 overflow-hidden"
                        >
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Share with</label>
                            <input
                              type="text"
                              className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                              placeholder="email@example.com, another@example.com"
                              value={shareWith}
                              onChange={(e) => setShareWith(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Permission</label>
                            <select
                              className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
                              value={role}
                              onChange={(e) => setRole(e.target.value)}
                            >
                              <option value="viewer" className="bg-gray-900">Can view only</option>
                              <option value="editor" className="bg-gray-900">Can edit events</option>
                            </select>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-5 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all hover:scale-105 active:scale-95"
                    >
                      {calendarToEdit ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </GlassPanel>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CalendarModal;
