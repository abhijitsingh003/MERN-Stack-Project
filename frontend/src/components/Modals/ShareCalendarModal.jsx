import { useState, useEffect, useCallback } from 'react';
import { X, Check, Mail, Shield, Send, Loader2, Users, Trash2, UserX, Clock } from 'lucide-react';
import { useCalendar } from '../../context/CalendarContext';
import { useAuth } from '../../context/AuthContext';
import GlassPanel from '../UI/GlassPanel';
import { motion, AnimatePresence } from 'framer-motion';

const ShareCalendarModal = ({ isOpen, onClose, calendarId, calendarName }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [status, setStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'
  const [message, setMessage] = useState('');

  // State for existing shares
  const [existingShares, setExistingShares] = useState([]);
  const [pendingShares, setPendingShares] = useState([]);
  const [loadingShares, setLoadingShares] = useState(false);
  const [removingShareId, setRemovingShareId] = useState(null);

  const { shareCalendar } = useCalendar();
  const { token } = useAuth();

  // Fetch existing shares when modal opens
  const fetchShares = useCallback(async () => {
    if (!calendarId || !token) return;

    setLoadingShares(true);
    try {
      const res = await fetch(`http://localhost:5000/api/shares/calendar/${calendarId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setExistingShares(data.shares || []);
        setPendingShares(data.pendingShares || []);
      }
    } catch (err) {
      console.error('Failed to fetch shares:', err);
    } finally {
      setLoadingShares(false);
    }
  }, [calendarId, token]);

  useEffect(() => {
    if (isOpen && calendarId) {
      fetchShares();
    }
  }, [isOpen, calendarId, fetchShares]);

  // Remove a share
  const handleRemoveShare = async (shareId) => {
    setRemovingShareId(shareId);
    try {
      const res = await fetch(`http://localhost:5000/api/shares/${shareId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setExistingShares(prev => prev.filter(s => s._id !== shareId));
        setPendingShares(prev => prev.filter(s => s._id !== shareId));
      }
    } catch (err) {
      console.error('Failed to remove share:', err);
    } finally {
      setRemovingShareId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const res = await shareCalendar(calendarId, email, role);
      if (res.message) {
        setStatus('success');
        setMessage(res.message);
        setEmail('');
        // Refresh shares list
        fetchShares();
        // Reset after a delay
        setTimeout(() => {
          setStatus('idle');
          setMessage('');
        }, 2000);
      } else {
        setStatus('error');
        setMessage('Failed to share calendar');
      }
    } catch (err) {
      setStatus('error');
      setMessage(err?.response?.data?.message || 'Error sending invitation');
    }
  };

  const handleClose = () => {
    setEmail('');
    setRole('viewer');
    setStatus('idle');
    setMessage('');
    setExistingShares([]);
    setPendingShares([]);
    onClose();
  };

  const allShares = [
    ...existingShares,
    ...pendingShares
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="w-full max-w-lg relative z-10"
          >
            <GlassPanel className="p-0 border border-white/10 shadow-2xl bg-dark-bg/90 backdrop-blur-2xl max-h-[85vh] flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-white/5 flex justify-between items-center flex-shrink-0">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Send className="w-5 h-5 text-blue-400" />
                    Share Calendar
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Manage access to <span className="text-blue-400 font-medium">"{calendarName}"</span>
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 custom-scrollbar">
                {/* Existing Shares Section */}
                {(allShares.length > 0 || loadingShares) && (
                  <div className="p-6 border-b border-white/5">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-400" />
                      Shared With ({allShares.length})
                    </h4>

                    {loadingShares ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                      </div>
                    ) : allShares.length > 0 ? (
                      <div className="space-y-2">
                        {existingShares.map(share => (
                          <div
                            key={share._id}
                            className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 group hover:bg-white/10 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-bold text-white">
                                  {share.user?.name?.charAt(0) || '?'}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-200 truncate">
                                  {share.user?.name || 'Unknown'}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {share.user?.email}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] px-2 py-1 rounded-full ${share.status === 'accepted'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-amber-500/20 text-amber-400'
                                }`}>
                                {share.status === 'accepted' ? 'Active' : 'Pending'}
                              </span>
                              <span className={`text-[10px] px-2 py-1 rounded-full ${share.role === 'editor'
                                ? 'bg-purple-500/20 text-purple-400'
                                : 'bg-blue-500/20 text-blue-400'
                                }`}>
                                {share.role === 'editor' ? 'Editor' : 'Viewer'}
                              </span>
                              <button
                                onClick={() => handleRemoveShare(share._id)}
                                disabled={removingShareId === share._id}
                                className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                              >
                                {removingShareId === share._id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        ))}

                        {/* Pending signups (external emails) */}
                        {pendingShares.map(share => (
                          <div
                            key={share._id}
                            className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-amber-500/20 group hover:bg-white/10 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                                <Clock className="w-4 h-4 text-white" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-200 truncate">
                                  {share.email}
                                </p>
                                <p className="text-xs text-amber-400">
                                  Awaiting signup
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] px-2 py-1 rounded-full bg-amber-500/20 text-amber-400">
                                Invite Sent
                              </span>
                              <span className={`text-[10px] px-2 py-1 rounded-full ${share.role === 'editor'
                                ? 'bg-purple-500/20 text-purple-400'
                                : 'bg-blue-500/20 text-blue-400'
                                }`}>
                                {share.role === 'editor' ? 'Editor' : 'Viewer'}
                              </span>
                              <button
                                onClick={() => handleRemoveShare(share._id)}
                                disabled={removingShareId === share._id}
                                className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                              >
                                {removingShareId === share._id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Invite Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-400" />
                    Invite Someone New
                  </h4>

                  {/* Email Input */}
                  <div className="space-y-2">
                    <input
                      type="email"
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                      placeholder="colleague@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <span className="inline-block w-1 h-1 rounded-full bg-gray-500"></span>
                      We'll send an invite link if they aren't registered
                    </p>
                  </div>

                  {/* Permission Select */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-amber-400" />
                      Permission Level
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRole('viewer')}
                        className={`p-3 rounded-xl border transition-all text-left ${role === 'viewer'
                          ? 'bg-blue-600/20 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                          }`}
                      >
                        <div className={`text-sm font-medium ${role === 'viewer' ? 'text-blue-300' : 'text-gray-300'}`}>
                          View Only
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          Can see events
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('editor')}
                        className={`p-3 rounded-xl border transition-all text-left ${role === 'editor'
                          ? 'bg-purple-600/20 border-purple-500/50 shadow-[0_0_15px_rgba(147,51,234,0.15)]'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                          }`}
                      >
                        <div className={`text-sm font-medium ${role === 'editor' ? 'text-purple-300' : 'text-gray-300'}`}>
                          Can Edit
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          Create & modify events
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Status Message */}
                  <AnimatePresence>
                    {message && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`p-3 rounded-xl text-sm flex items-center gap-2 ${status === 'success'
                          ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                          : 'bg-red-500/10 border border-red-500/20 text-red-400'
                          }`}
                      >
                        {status === 'success' ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                        {message}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Footer Buttons */}
                  <div className="flex justify-end gap-3 pt-2 border-t border-white/5">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-5 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      disabled={status === 'loading' || status === 'success'}
                      className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
                    >
                      {status === 'loading' ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending...
                        </>
                      ) : status === 'success' ? (
                        <>
                          <Check className="w-4 h-4" />
                          Sent!
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Invite
                        </>
                      )}
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

export default ShareCalendarModal;
