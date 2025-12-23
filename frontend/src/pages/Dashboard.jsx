import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCalendar } from '../context/CalendarContext';
import {
  format,
  isSameDay,
  compareAsc,
  startOfToday,
  isAfter,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth as isSameMonthFns,
  isToday as isTodayFns,
  isBefore,
  startOfDay,
  endOfDay
} from 'date-fns';
import { Video, MapPin, Clock, ChevronLeft, ChevronRight, FileText, Check, Loader2, ArrowRight, Trash2, Square, CheckSquare, Coffee, Sun, Sunset, Moon, Calendar as CalendarIcon, Plus, Pencil } from 'lucide-react';
import { formatTimestamp } from '../utils/formatTimestamp';
import GlassPanel from '../components/UI/GlassPanel';
import HeroWidget from '../components/3D/HeroWidget';
import EventModal from '../components/Modals/EventModal';
import { motion, AnimatePresence } from 'framer-motion';

const MiniCalendarGrid = ({ currentDate, selectedDate, events = [], onDateSelect }) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const rows = [];
  let days = [];
  let day = startDate;

  const today = new Date();

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      const dayCopy = new Date(day); // Capture for closure
      const isSelected = isSameDay(dayCopy, selectedDate);
      const isCurrentMonth = isSameMonthFns(dayCopy, monthStart);
      const isToday = isSameDay(dayCopy, today);
      const dateObj = new Date(dayCopy);

      const hasEvents = events.some(ev => {
        const evStart = startOfDay(new Date(ev.start));
        const evEnd = endOfDay(new Date(ev.end));
        const currentDayStart = startOfDay(dayCopy);
        return currentDayStart >= evStart && currentDayStart <= evEnd;
      });

      days.push(
        <button
          key={day.toString()}
          onClick={() => onDateSelect(dayCopy)}
          type="button"
          className={`aspect-square flex items-center justify-center text-xs cursor-pointer rounded-full transition-all relative
            ${!isCurrentMonth ? 'text-gray-600' : 'text-gray-300 hover:bg-white/10 hover:text-white'} 
            ${isSelected ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/30' : ''}
            ${isToday && !isSelected ? 'ring-1 ring-white/30 bg-white/5' : ''}
          `}
        >
          {format(dateObj, 'd')}
          {hasEvents && !isSelected && <div className="absolute bottom-1 w-1 h-1 bg-blue-500 rounded-full" />}
        </button>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div className="grid grid-cols-7 gap-1" key={day.toString()}>
        {days}
      </div>
    );
    days = [];
  }
  return <div className="space-y-1">{rows}</div>;
};

// Helper function to get greeting based on time
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { text: 'Good Morning', Icon: Coffee, color: 'text-amber-400' };
  if (hour >= 12 && hour < 17) return { text: 'Good Afternoon', Icon: Sun, color: 'text-yellow-400' };
  if (hour >= 17 && hour < 21) return { text: 'Good Evening', Icon: Sunset, color: 'text-orange-400' };
  return { text: 'Good Night', Icon: Moon, color: 'text-indigo-400' };
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { calendars, sharedCalendars, fetchCalendarEvents, visibleCalendarIds, dashboardEvents, setDashboardEvents, selectedDate, setSelectedDate, searchQuery, deleteEvent } = useCalendar();

  // Initialize from cache if available
  const [allEventsRaw, setAllEventsRaw] = useState(dashboardEvents || []);
  const [loadingEvents, setLoadingEvents] = useState(!dashboardEvents);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [invites, setInvites] = useState([]);
  const [activities, setActivities] = useState([]);

  // Edit State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState(null);

  // Todo-style checked events (local UI state, resets on date change)
  const [checkedEventIds, setCheckedEventIds] = useState(new Set());

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      try {
        const invitesRes = await fetch('http://localhost:5000/api/shares/invites', { headers: { Authorization: `Bearer ${token}` } });
        if (invitesRes.ok) setInvites(await invitesRes.json());
        const activityRes = await fetch('http://localhost:5000/api/activity', { headers: { Authorization: `Bearer ${token}` } });
        if (activityRes.ok) setActivities(await activityRes.json());
      } catch (error) { console.error(error); }
    };
    fetchData();
  }, [token]);

  useEffect(() => {
    // If we have cache, don't show loader. Just fetch in bg.
    if (dashboardEvents) {
      setAllEventsRaw(dashboardEvents);
      setLoadingEvents(false);
    }

    const loadEvents = async () => {
      const allCals = [...calendars, ...(sharedCalendars || [])];
      if (allCals.length === 0) {
        if (!dashboardEvents) setLoadingEvents(false);
        return;
      }

      if (!dashboardEvents) setLoadingEvents(true);

      let allEvents = [];
      const today = startOfToday();

      // Optimize: Fetch events for processing
      for (const cal of allCals) {
        const events = await fetchCalendarEvents(cal._id);
        const calEvents = events.map(ev => ({
          ...ev,
          color: cal.color,
          calendarName: cal.name,
          calendarId: cal._id,
          creatorName: ev.createdBy?.name,
        }));
        allEvents = [...allEvents, ...calEvents];
      }

      allEvents.sort((a, b) => compareAsc(new Date(a.start), new Date(b.start)));
      setAllEventsRaw(allEvents);
      // Update Cache
      setDashboardEvents(allEvents);
      setLoadingEvents(false);
    };

    if (token) loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    if (token) loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendars, sharedCalendars]);

  // Listen for dashboardEvents updates (creation/deletion/updates)
  useEffect(() => {
    if (dashboardEvents) {
      setAllEventsRaw(dashboardEvents);
    }
  }, [dashboardEvents]);

  const todaysEvents = useMemo(() => {
    const filtered = allEventsRaw.filter(ev =>
      visibleCalendarIds.has(ev.calendarId) &&
      isSameDay(new Date(ev.start), selectedDate)
    );

    // Apply search filter if searchQuery exists
    if (searchQuery && searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase();
      return filtered.filter(ev =>
        ev.title?.toLowerCase().includes(query) ||
        ev.description?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [allEventsRaw, visibleCalendarIds, selectedDate, searchQuery]);

  const now = new Date();
  // If selectedDate is NOT today, show all events for that day as if it's the start of the day
  // If selectedDate IS today, we can separate past/future if desired, but "Up Next" usually implies future.
  // For simplicity: If not today, treat "Up Next" as first event of day.
  const isTodayDate = isSameDay(selectedDate, new Date());

  const isPastDate = isBefore(selectedDate, startOfToday());

  const timedEvents = todaysEvents.filter(ev => !ev.allDay);
  const allDayEvents = todaysEvents.filter(ev => ev.allDay);

  const upNextIndex = timedEvents.findIndex(ev => {
    if (isPastDate) return false;
    if (isTodayDate) return isAfter(new Date(ev.end), now);
    return true; // If not today and not past, show first event as "next"
  });

  const upNext = upNextIndex !== -1 ? timedEvents[upNextIndex] : null;

  // Show ALL events for the day, sorted: unchecked first, checked at bottom
  const daysEventsUnsorted = [...allDayEvents, ...timedEvents];
  const daysEvents = useMemo(() => {
    const unchecked = daysEventsUnsorted.filter(ev => !checkedEventIds.has(ev._id));
    const checked = daysEventsUnsorted.filter(ev => checkedEventIds.has(ev._id));
    return [...unchecked, ...checked];
  }, [daysEventsUnsorted, checkedEventIds]);

  let pastEvents = [];
  if (isPastDate) {
    pastEvents = [...allDayEvents, ...timedEvents];
  } else if (isTodayDate) {
    // For "Earlier Today" section (optional, maybe user doesn't want it separate if using daysEvents?)
    // The user asked for "Events for specific dates" to show all events.
    // I will keep "Earlier Today" logic separate if needed, but for the main list:
    // User wants "in the specific dates how many events will be there it will appear there".
    // I will use `daysEvents` for the main list.
  }

  const handleReschedule = (event) => {
    setEventToEdit(event);
    setIsModalOpen(true);
  };

  const toggleEventChecked = (eventId) => {
    setCheckedEventIds(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  const handleDeleteEvent = async (event) => {
    if (window.confirm(`Delete "${event.title}"?`)) {
      await deleteEvent(event.calendarId, event._id);
    }
  };

  const handleJoinMeeting = (link) => {
    if (link) window.open(link, '_blank');
  };

  const respondToInvite = async (id, status) => {
    try {
      await fetch(`http://localhost:5000/api/shares/invites/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      setInvites(invites.filter(i => i._id !== id));
    } catch (error) { console.error(error); }
  };

  if (loadingEvents && calendars.length > 0 && !dashboardEvents) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column */}
      <div className="lg:col-span-2 space-y-8">
        {/* Welcome & Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassPanel className="p-8 flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/30 transition-all duration-700" />
            <div className="relative z-10 flex items-start gap-4">
              <div className={`p-3 rounded-2xl bg-white/5 border border-white/10`}>
                {(() => { const g = getGreeting(); return <g.Icon className={`w-6 h-6 ${g.color}`} />; })()}
              </div>
              <div>
                <h2 className="text-sm font-medium text-gray-400 tracking-wider uppercase">
                  {getGreeting().text}
                </h2>
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 tracking-tight uppercase">
                  {user?.name?.split(' ')[0]}
                </h2>
              </div>
            </div>
            <p className="text-gray-400 relative z-10 mt-4">
              You have <span className="text-white font-semibold">{todaysEvents.length}</span> {todaysEvents.length === 1 ? 'event' : 'events'} scheduled for {isSameDay(selectedDate, new Date()) ? 'today' : format(selectedDate, 'MMM do')}.
            </p>
            <div className="mt-6 flex items-center gap-3 relative z-10">
              <button
                onClick={() => navigate('/calendar')}
                className="pl-4 pr-5 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-sm font-semibold transition-all border border-white/10 hover:border-white/20 inline-flex items-center justify-center relative overflow-hidden group/cal"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover/cal:translate-x-[100%] transition-transform duration-500" />
                <CalendarIcon className="w-4 h-4 mr-1.5 relative z-10" />
                <span className="relative z-10">View Calendar</span>
              </button>
              <button
                onClick={() => { setEventToEdit(null); setIsModalOpen(true); }}
                className="pl-4 pr-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/50 transition-all inline-flex items-center justify-center border border-blue-400/20 relative overflow-hidden group/add"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover/add:translate-x-[100%] transition-transform duration-500" />
                <Plus className="w-4 h-4 mr-1.5 relative z-10" />
                <span className="relative z-10">Add Event</span>
              </button>
            </div>
          </GlassPanel>

          <GlassPanel className="relative overflow-hidden bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border-indigo-500/20">
            <div className="absolute inset-y-0 right-0 w-1/2 z-0">
              <HeroWidget />
            </div>
            {/* Decorative circles */}
            <div className="absolute top-4 right-4 w-20 h-20 bg-indigo-500/10 rounded-full blur-2xl" />
            <div className="absolute bottom-4 left-4 w-16 h-16 bg-purple-500/10 rounded-full blur-xl" />

            <div className="relative z-10 pointer-events-none p-8 flex flex-col items-start justify-center h-full">
              <div className="flex items-center gap-1.5 mb-3">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-medium text-indigo-300 uppercase tracking-widest">Current Time</span>
              </div>
              <div className="text-5xl font-semibold text-white tracking-tight mb-1">
                {format(new Date(), 'h:mm')}
                <span className="text-2xl text-indigo-300/80 ml-1 font-medium">{format(new Date(), 'a')}</span>
              </div>
              <div className="text-sm text-gray-500">
                {format(new Date(), 'EEEE, MMM d')}
              </div>
            </div>
          </GlassPanel>
        </div>

        {/* Up Next */}
        {!isPastDate && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-widest pl-1">Up Next</h3>
            <GlassPanel className="overflow-hidden border-l-4 border-l-blue-500">
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                <span className="text-xs font-medium text-blue-300 uppercase tracking-wider">
                  {isTodayDate ? 'HAPPENING SOON' : 'UPCOMING'}
                </span>
                {upNext && upNext.isMeeting && <Video className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />}
              </div>

              <div className="p-6">
                {upNext ? (
                  <>
                    <h3 className="text-xl font-bold text-white mb-3">{upNext.title}</h3>
                    <div className="flex flex-wrap gap-4 text-sm mb-6">
                      <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg">
                        <Clock className="w-4 h-4 text-indigo-400" />
                        <span className="text-gray-300">
                          {format(new Date(upNext.start), 'h:mm a')} - {format(new Date(upNext.end), 'h:mm a')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg">
                        <CalendarIcon className="w-4 h-4 text-indigo-400" />
                        <span className="text-gray-300">{format(new Date(upNext.start), 'MMM d, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg">
                        <MapPin className="w-4 h-4 text-indigo-400" />
                        <span className="text-gray-300">{upNext.location || (upNext.isMeeting ? upNext.meetingPlatform || 'Online' : 'No Location')}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full border-2 border-indigo-500/30 bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                          {user?.name?.[0]}
                        </div>
                        <span className="text-sm text-gray-400">You</span>
                      </div>
                      <button
                        onClick={() => handleReschedule(upNext)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                      >
                        <Pencil className="w-4 h-4" />
                        <span className="text-sm font-medium">Edit</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {searchQuery && searchQuery.trim().length > 0
                      ? "No upcoming events match your search."
                      : (isTodayDate ? (
                        <div className="flex flex-col items-center gap-2">
                          <Coffee className="w-8 h-8 text-amber-400/50" />
                          <span>No upcoming events for today. Relax and recharge!</span>
                        </div>
                      ) : "No events scheduled for this day.")}
                  </div>
                )}
              </div>
            </GlassPanel>
          </div>
        )}

        {/* Rest of Today / Day's List */}
        {!isPastDate && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-widest pl-1">
                {isTodayDate ? 'Today\'s Schedule' : `Events for ${format(selectedDate, 'MMM d')}`}
              </h3>
              {daysEvents.length > 0 && (
                <span className="text-xs text-gray-500">{daysEvents.length} {daysEvents.length === 1 ? 'event' : 'events'}</span>
              )}
            </div>
            <AnimatePresence mode="popLayout">
              <div className="space-y-3">
                {daysEvents.length > 0 ? (
                  daysEvents.map(event => {
                    const isChecked = checkedEventIds.has(event._id);
                    return (
                      <GlassPanel
                        key={event._id}
                        layout
                        as={motion.div}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className={`p-4 flex items-center group border-l-4 ${event.allDay ? 'border-l-amber-500' : 'border-l-blue-500'} ${isChecked ? 'opacity-50' : ''} hover:bg-white/5 transition-colors`}
                      >
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleEventChecked(event._id)}
                          className="mr-3 text-gray-400 hover:text-green-400 transition-colors"
                        >
                          {isChecked ? <CheckSquare className="w-5 h-5 text-green-500" /> : <Square className="w-5 h-5" />}
                        </button>

                        {/* Time */}
                        <div className="w-20 flex-shrink-0 mr-4">
                          {event.allDay ? (
                            <p className="text-xs font-semibold text-amber-400 uppercase">All Day</p>
                          ) : (
                            <>
                              <p className={`text-sm font-semibold ${isChecked ? 'text-gray-500' : 'text-white'}`}>{format(new Date(event.start), 'h:mm a')}</p>
                              <p className="text-xs text-gray-500">{format(new Date(event.end), 'h:mm a')}</p>
                            </>
                          )}
                        </div>

                        {/* Title */}
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-sm font-medium truncate transition-colors ${isChecked ? 'line-through text-gray-500' : 'text-gray-200'}`}>{event.title}</h4>
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteEvent(event); }}
                          className="ml-2 p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </GlassPanel>
                    );
                  })
                ) : (
                  <div className="py-12 px-8 text-center rounded-2xl bg-gradient-to-br from-white/[0.02] to-transparent border border-white/5">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                      <CalendarIcon className="w-6 h-6 text-indigo-400/50" />
                    </div>
                    <p className="text-gray-400 text-sm font-medium mb-1">
                      {searchQuery && searchQuery.trim().length > 0 ? 'No events match your search' : 'No events scheduled'}
                    </p>
                    <p className="text-gray-600 text-xs">
                      {searchQuery && searchQuery.trim().length > 0 ? 'Try a different search term' : 'Your schedule is clear for today'}
                    </p>
                  </div>
                )}
              </div>
            </AnimatePresence>
          </div>

        )}

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <div className="opacity-60 grayscale-[50%] hover:opacity-100 hover:grayscale-0 transition-all duration-300">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 pl-1">
              {isTodayDate ? 'Earlier Today' : 'Past Events'}
            </h3>
            <div className="space-y-4">
              {pastEvents.map(event => (
                <GlassPanel key={event._id} className={`p-5 flex items-center group cursor-pointer ${event.allDay ? 'border-l-4 border-l-gray-600' : ''}`} onClick={() => handleReschedule(event)}>
                  {event.allDay ? (
                    <>
                      <div className="w-24 flex-shrink-0 text-right pr-6 border-r border-white/10 mr-6">
                        <p className="text-xs font-bold text-gray-500 uppercase">All Day</p>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-gray-400">{event.title}</h4>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-24 flex-shrink-0 text-right pr-6 border-r border-white/10 mr-6">
                        <p className="text-sm font-bold text-gray-400">{formatTimestamp(event.start)}</p>
                        <p className="text-xs text-gray-600">{formatTimestamp(event.end)}</p>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-gray-400">{event.title}</h4>
                      </div>
                    </>
                  )}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white">
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </GlassPanel>
              ))}
            </div>
          </div>
        )}

        {/* Empty State for Past Dates with No Events */}
        {isPastDate && todaysEvents.length === 0 && (
          <div>
            <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-4 pl-1">
              {format(selectedDate, 'MMM d, yyyy')}
            </h3>
            <div className="p-8 text-center border border-white/5 rounded-xl border-dashed">
              <p className="text-gray-500 text-sm">
                {searchQuery && searchQuery.trim().length > 0 ? 'No events match your search.' : 'No events scheduled for this day.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Right Column */}
      <div className="space-y-8">
        <GlassPanel className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-white">{format(currentDate, 'MMMM yyyy')}</h3>
            <div className="flex space-x-1">
              <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 text-center text-[10px] uppercase font-bold tracking-wider mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d} className="text-indigo-300/50 py-1">{d}</div>)}
          </div>
          <MiniCalendarGrid
            currentDate={currentDate}
            selectedDate={selectedDate}
            events={allEventsRaw}
            onDateSelect={(date) => {
              setSelectedDate(date);
              // Auto-switch mini calendar view if picking date from prev/next month (handled by grid loop but nice to have)
            }}
          />
        </GlassPanel>

        <GlassPanel className="p-6">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex justify-between items-center">
            Pending Invites
            {invites.length > 0 && <span className="bg-blue-500 text-white py-0.5 px-2 rounded-full text-[10px]">{invites.length}</span>}
          </h3>
          <div className="space-y-4">
            {invites.length > 0 ? invites.map(invite => (
              <div key={invite._id} className="pb-4 border-b border-white/5 last:border-0 last:pb-0">
                <p className="font-semibold text-sm text-gray-200">{invite.calendar?.name}</p>
                <p className="text-xs text-gray-500 mt-1">Invited by <span className="text-indigo-300">{invite.calendar?.user?.name}</span></p>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => respondToInvite(invite._id, 'accepted')} className="flex-1 py-1.5 bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs font-medium rounded hover:bg-blue-600/30">Accept</button>
                  <button onClick={() => respondToInvite(invite._id, 'declined')} className="flex-1 py-1.5 bg-white/5 border border-white/10 text-gray-400 text-xs font-medium rounded hover:bg-white/10">Decline</button>
                </div>
              </div>
            )) : <p className="text-sm text-gray-500 italic">No pending invitations.</p>}
          </div>
        </GlassPanel>

        <GlassPanel className="p-6">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {activities.length > 0 ? activities.map(activity => (
              <div key={activity._id} className="flex items-start space-x-3 group">
                <div className={`mt-0.5 p-1.5 rounded-lg bg-white/5 text-gray-400`}>
                  <FileText className="w-3 h-3" />
                </div>
                <div>
                  <p className="text-sm text-gray-300 group-hover:text-white transition-colors">{activity.details}</p>
                  <p className="text-[10px] text-gray-600 mt-1">{formatTimestamp(activity.createdAt)}</p>
                </div>
              </div>
            )) : <p className="text-sm text-gray-500 italic">No recent activity.</p>}
          </div>
        </GlassPanel>
      </div>

      <EventModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEventToEdit(null); }}
        eventToEdit={eventToEdit}
        selectedDate={selectedDate} // Pass selected date to create event with correct date
      />
    </div>
  );
};

export default Dashboard;
