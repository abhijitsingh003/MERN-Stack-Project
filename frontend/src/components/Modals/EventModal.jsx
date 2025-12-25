import { useState, useMemo, useCallback, useEffect } from 'react';
import { useCalendar } from '../../context/CalendarContext';
import { useAuth } from '../../context/AuthContext';
import { X, Calendar, Clock, AlignLeft, Sun, Video, Link2, Users, Search, Loader2, UserCheck, UserX, Sparkles, ChevronRight, Trash2 } from 'lucide-react';
import GlassPanel from '../UI/GlassPanel';
import { motion, AnimatePresence } from 'framer-motion';

const EventModal = ({ isOpen, onClose, selectedDate, initialStartTime, initialEndTime, eventToEdit }) => {
  const [title, setTitle] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [description, setDescription] = useState('');
  const [calendarId, setCalendarId] = useState('');
  const [error, setError] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [eventDate, setEventDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Meeting state
  const [isMeeting, setIsMeeting] = useState(false);
  const [meetingLink, setMeetingLink] = useState('');
  const [meetingPlatform, setMeetingPlatform] = useState('zoom');

  // Attendees state
  const [attendees, setAttendees] = useState([]);
  const [attendeeSearch, setAttendeeSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [attendeeAvailability, setAttendeeAvailability] = useState({});
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // Scheduling assistant state
  const [showSchedulingAssistant, setShowSchedulingAssistant] = useState(false);
  const [freeSlots, setFreeSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [meetingDuration, setMeetingDuration] = useState(30);

  const { calendars, sharedCalendars, addEvent, updateEvent, deleteEvent } = useCalendar();
  const { token } = useAuth();

  const personalCalendar = useMemo(
    () => calendars.find(c => c.isDefault) || calendars[0],
    [calendars]
  );

  const editableCalendars = useMemo(() => {
    try {
      const own = calendars.map(c => ({ ...c, role: 'owner', isShared: false }));
      const sharedEditable = sharedCalendars.filter(c => c.role === 'editor');
      const all = [...own, ...sharedEditable];
      if (!personalCalendar) {
        return all;
      }
      const sorted = [...all].sort((a, b) => {
        if (a._id === personalCalendar._id) return -1;
        if (b._id === personalCalendar._id) return 1;
        return a.name.localeCompare(b.name);
      });
      return sorted;
    } catch {
      return personalCalendar ? [personalCalendar] : [];
    }
  }, [calendars, sharedCalendars, personalCalendar]);

  const resetForm = useCallback(() => {
    setTitle('');
    setStart('');
    setEnd('');
    setDescription('');
    setCalendarId('');
    setError('');
    setIsAllDay(false);
    setEventDate('');
    setIsMeeting(false);
    setMeetingLink('');
    setMeetingPlatform('zoom');
    setAttendees([]);
    setAttendeeSearch('');
    setSearchResults([]);
    setAttendeeAvailability({});
    setShowSchedulingAssistant(false);
    setFreeSlots([]);
  }, []);

  // Pre-populate form when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (eventToEdit) {
      // Edit Mode
      setTitle(eventToEdit.title || '');
      setDescription(eventToEdit.description || '');
      setCalendarId(eventToEdit.calendarId || '');
      setIsAllDay(eventToEdit.allDay || false);
      setIsMeeting(eventToEdit.isMeeting || false);
      setMeetingLink(eventToEdit.meetingLink || '');
      setMeetingPlatform(eventToEdit.meetingPlatform || 'zoom');
      setAttendees(eventToEdit.attendees || []);

      if (eventToEdit.allDay) {
        const d = new Date(eventToEdit.start);
        const pad = (n) => n.toString().padStart(2, '0');
        setEventDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
        setStart('');
        setEnd('');
      } else {
        // Format datetime-local string: YYYY-MM-DDTHH:mm
        const formatDateTime = (dateStr) => {
          const d = new Date(dateStr);
          const pad = (n) => n.toString().padStart(2, '0');
          return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        };
        setStart(formatDateTime(eventToEdit.start));
        setEnd(formatDateTime(eventToEdit.end));
        setEventDate('');
      }

    } else {
      // Create Mode
      resetForm();

      if (selectedDate) {
        const pad = (n) => n.toString().padStart(2, '0');
        const dateStr = `${selectedDate.getFullYear()}-${pad(selectedDate.getMonth() + 1)}-${pad(selectedDate.getDate())}`;
        setEventDate(dateStr);

        if (initialStartTime) {
          setStart(initialStartTime);
        } else {
          const hours = selectedDate.getHours().toString().padStart(2, '0');
          const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
          setStart(`${dateStr}T${hours}:${minutes}`);
        }
        if (initialEndTime) {
          setEnd(initialEndTime);
        } else {
          const endHour = (selectedDate.getHours() + 1) % 24;
          setEnd(`${dateStr}T${endHour.toString().padStart(2, '0')}:00`);
        }
      }
    }
  }, [isOpen, selectedDate, initialStartTime, initialEndTime, eventToEdit, resetForm]);

  // Separate effect for default calendar selection
  useEffect(() => {
    if (isOpen && !calendarId && !eventToEdit && editableCalendars.length > 0) {
      setCalendarId(editableCalendars[0]._id);
    }
  }, [isOpen, calendarId, eventToEdit, editableCalendars]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  // Handle Delete
  const handleDelete = async () => {
    if (!eventToEdit || isDeleting) return;
    setIsDeleting(true);
    setError('');
    try {
      const res = await deleteEvent(eventToEdit.calendarId, eventToEdit._id);
      if (res.success) {
        handleClose();
      } else {
        setError(res.error || 'Failed to delete event');
      }
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isSubmitting) return;

    // Validate calendar selection
    if (!calendarId) {
      setError('Please select a calendar.');
      return;
    }

    const dateStr = eventDate || start.split('T')[0];

    // Construct Date objects
    // Construct Date objects manually to prevent UTC shifts
    let eventStart, eventEnd;
    if (isAllDay) {
      // Construct local midnight for the selected day
      const [y, m, d] = dateStr.split('-').map(Number);
      eventStart = new Date(y, m - 1, d, 0, 0, 0);
      eventEnd = new Date(y, m - 1, d, 23, 59, 59);
    } else {
      eventStart = new Date(start);
      eventEnd = new Date(end);
    }

    if (eventEnd < eventStart) {
      setError('End date cannot be earlier than start date');
      return;
    }

    const eventData = {
      title,
      start: eventStart,
      end: eventEnd,
      description,
      allDay: isAllDay,
      calendarId, // Explicit ID required
      isMeeting,
      meetingLink: isMeeting ? meetingLink : undefined,
      meetingPlatform: isMeeting ? meetingPlatform : undefined,
      attendees: isMeeting ? attendees.map(a => ({
        user: a.userId,
        email: a.email,
        status: a.status || 'pending'
      })) : undefined,
    };

    setIsSubmitting(true);
    try {
      let result;
      if (eventToEdit) {
        result = await updateEvent(eventToEdit.calendarId, eventToEdit._id, eventData);
      } else {
        result = await addEvent(calendarId, eventData);
      }

      if (result && (result.success || result.event || result._id)) {
        handleClose();
      } else {
        setError(result?.error || 'Operation failed');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper for attendee search (reused from previous implementation)
  const handleAttendeeSearch = useCallback(async (query) => {
    setAttendeeSearch(query);
    if (query.length < 2) { setSearchResults([]); return; }
    setSearchLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/availability/users/search?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const filtered = data.filter(u => !attendees.find(a => a.email === u.email));
        setSearchResults(filtered);
      }
    } catch (err) { console.error(err); }
    finally { setSearchLoading(false); }
  }, [token, attendees]);

  const addAttendee = useCallback((user) => {
    setAttendees(prev => [...prev, { userId: user._id, email: user.email, name: user.name, status: 'pending' }]);
    setAttendeeSearch('');
    setSearchResults([]);
  }, []);

  const addAttendeeByEmail = useCallback(() => {
    const email = attendeeSearch.trim().toLowerCase();
    if (email && email.includes('@') && !attendees.find(a => a.email === email)) {
      setAttendees(prev => [...prev, { email, name: email.split('@')[0], status: 'pending' }]);
      setAttendeeSearch('');
      setSearchResults([]);
    }
  }, [attendeeSearch, attendees]);

  const removeAttendee = useCallback((email) => {
    setAttendees(prev => prev.filter(a => a.email !== email));
  }, []);

  const platformOptions = [
    { id: 'zoom', label: 'Zoom', color: 'from-blue-600 to-blue-700' },
    { id: 'teams', label: 'Teams', color: 'from-purple-600 to-indigo-600' },
    { id: 'meet', label: 'Google Meet', color: 'from-green-600 to-teal-600' },
    { id: 'other', label: 'Other', color: 'from-gray-600 to-gray-700' },
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
            className="w-full max-w-xl relative z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <GlassPanel className="p-0 border border-white/10 shadow-2xl bg-dark-bg/90 backdrop-blur-2xl max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-white/5 flex justify-between items-center flex-shrink-0">
                <h3 className="text-xl font-bold text-white">
                  {eventToEdit ? 'Edit Event' : (isMeeting ? 'Schedule Meeting' : 'Create Event')}
                </h3>
                <button onClick={handleClose} className="text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Title */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Event Title</label>
                    <input
                      type="text"
                      required
                      placeholder={isMeeting ? "e.g., Team Standup" : "e.g., Team Sync"}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  {/* Event Type Toggle */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setIsMeeting(false)}
                      className={`p-3 rounded-xl border transition-all text-left ${!isMeeting ? 'bg-blue-600/20 border-blue-500/50' : 'bg-white/5 border-white/10'}`}
                    >
                      <div className={`text-sm font-medium flex items-center gap-2 ${!isMeeting ? 'text-blue-300' : 'text-gray-300'}`}>
                        <Calendar className="w-4 h-4" /> Event
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsMeeting(true)}
                      className={`p-3 rounded-xl border transition-all text-left ${isMeeting ? 'bg-purple-600/20 border-purple-500/50' : 'bg-white/5 border-white/10'}`}
                    >
                      <div className={`text-sm font-medium flex items-center gap-2 ${isMeeting ? 'text-purple-300' : 'text-gray-300'}`}>
                        <Video className="w-4 h-4" /> Meeting
                      </div>
                    </button>
                  </div>

                  {/* All Day Toggle */}
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                    <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                      <Sun className="w-4 h-4 text-amber-400" /> All Day Event
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsAllDay(!isAllDay)}
                      className={`relative w-12 h-6 rounded-full transition-all duration-300 ${isAllDay ? 'bg-amber-500' : 'bg-white/10'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${isAllDay ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>

                  {/* Date & Time */}
                  {!isAllDay ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Start</label>
                        <input
                          type="datetime-local"
                          required={!isAllDay}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                          value={start}
                          onChange={(e) => setStart(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">End</label>
                        <input
                          type="datetime-local"
                          required={!isAllDay}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                          value={end}
                          onChange={(e) => setEnd(e.target.value)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Date</label>
                      <input
                        type="date"
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                      />
                    </div>
                  )}

                  {/* Meeting Details */}
                  {isMeeting && (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Platform</label>
                        <div className="grid grid-cols-4 gap-2">
                          {platformOptions.map(opt => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setMeetingPlatform(opt.id)}
                              className={`py-2 px-2 rounded-lg text-xs font-medium transition-all border ${meetingPlatform === opt.id ? `bg-gradient-to-r ${opt.color} text-white` : 'bg-white/5 border-white/10 text-gray-400'}`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Link</label>
                        <input
                          type="url"
                          placeholder="https://..."
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 text-sm"
                          value={meetingLink}
                          onChange={(e) => setMeetingLink(e.target.value)}
                        />
                      </div>

                      {/* Attendees */}
                      <div className="relative">
                        <label className="text-sm font-medium text-gray-300 block mb-2">Attendees</label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                              type="text"
                              placeholder="Search users..."
                              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm"
                              value={attendeeSearch}
                              onChange={(e) => handleAttendeeSearch(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAttendeeByEmail())}
                            />
                          </div>
                        </div>
                        {searchResults.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-dark-bg/95 border border-white/10 rounded-xl overflow-hidden z-20 shadow-xl">
                            {searchResults.map(user => (
                              <div key={user._id} onClick={() => addAttendee(user)} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 cursor-pointer">
                                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs text-white">{user.name[0]}</div>
                                <div><p className="text-sm text-white">{user.name}</p></div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {attendees.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {attendees.map(a => (
                            <div key={a.email} className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full border border-white/5">
                              <span className="text-xs text-white">{a.name}</span>
                              <button type="button" onClick={() => removeAttendee(a.email)} className="text-gray-400 hover:text-red-400"><X className="w-3 h-3" /></button>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {/* Calendar Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Calendar</label>
                    <select
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      value={calendarId}
                      onChange={(e) => setCalendarId(e.target.value)}
                    >
                      {editableCalendars.map(cal => (
                        <option key={cal._id} value={cal._id} className="bg-gray-900">{cal.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Description</label>
                    <textarea
                      rows={2}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none text-sm"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  {/* Footer */}
                  {error && <div className="text-xs text-red-400">{error}</div>}
                  <div className="flex justify-between gap-3 pt-4 border-t border-white/5">
                    <div>
                      {eventToEdit && (
                        <button
                          type="button"
                          onClick={handleDelete}
                          disabled={isDeleting || isSubmitting}
                          className="px-5 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-500 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                          {isDeleting ? 'Deleting...' : 'Delete'}
                        </button>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <button type="button" onClick={handleClose} disabled={isSubmitting || isDeleting} className="px-5 py-2 text-sm text-gray-400 hover:text-white disabled:opacity-50">Cancel</button>
                      <button
                        type="submit"
                        disabled={isSubmitting || isDeleting}
                        className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-500 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        {eventToEdit ? 'Save Changes' : 'Create Event'}
                      </button>
                    </div>
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

export default EventModal;
