import { useState, useContext, useEffect, useRef, useMemo, memo } from 'react';
import { useLocation } from 'react-router-dom';
import { useCalendar } from '../context/CalendarContext';
import {
    format,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addDays,
    addMonths,
    subMonths,
    isToday,
    startOfYear,
    endOfYear,
    eachMonthOfInterval,
    getDay,
    getHours,
    addHours,
    setHours,
    setMinutes,
    differenceInMinutes,
    startOfDay,
    endOfDay
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, MoreHorizontal, Clock, Trash2, X, MapPin, Edit, Loader } from 'lucide-react';
import EventModal from '../components/Modals/EventModal';
import { formatTimestamp } from '../utils/formatTimestamp';
import GlassPanel from '../components/UI/GlassPanel';
import { motion, AnimatePresence } from 'framer-motion';

// --- Extracted Views ---

const MonthView = memo(({ currentDate, events, handleDayClick, handleEventClick }) => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="min-h-full flex flex-col blur-appear">
            <div className="w-full max-w-full grid grid-cols-7 mb-2">
                {weekDays.map(day => (
                    <div key={day} className="text-center text-xs font-bold text-indigo-300/70 uppercase tracking-widest py-2">
                        {day}
                    </div>
                ))}
            </div>
            <div className="flex-1 w-full max-w-full grid grid-cols-7 grid-rows-6 gap-2 min-h-[600px]">
                {days.map(day => {
                    const dayEvents = events
                        .filter(ev => {
                            try {
                                const evStart = startOfDay(new Date(ev.start));
                                const evEnd = endOfDay(new Date(ev.end));
                                return day >= evStart && day <= evEnd;
                            } catch (e) { return false; }
                        })
                        .sort((a, b) => new Date(a.start) - new Date(b.start));
                    return (
                        <motion.div
                            key={day.toString()}
                            onClick={() => handleDayClick(day)}
                            whileHover={{ scale: 1.02 }}
                            className={`
                                min-h-[80px] p-2 rounded-xl border transition-all cursor-pointer relative overflow-hidden group
                                ${!isSameMonth(day, monthStart)
                                    ? 'bg-white/5 border-white/5 text-gray-600'
                                    : 'bg-glass-surface border-glass-border hover:bg-white/10 text-white shadow-lg'
                                }
                                ${isToday(day) ? 'ring-2 ring-blue-500/50 bg-blue-500/10' : ''}
                            `}
                        >
                            <div className="flex justify-between items-start">
                                <span className={`text-sm font-semibold rounded-full w-6 h-6 flex items-center justify-center ${isToday(day) ? 'bg-blue-500 text-white shadow-glow' : ''}`}>
                                    {format(day, 'd')}
                                </span>
                            </div>
                            <div className="mt-1 space-y-1 overflow-y-auto max-h-[70px] custom-scrollbar">
                                {dayEvents.map(ev => (
                                    <div
                                        key={ev._id}
                                        onClick={(e) => handleEventClick(e, ev)}
                                        className="h-5 px-2 flex items-center rounded-md text-[10px] font-medium truncate shadow-md hover:brightness-110 cursor-pointer transition-all"
                                        style={{
                                            backgroundColor: `${ev.color}20`,
                                            color: ev.color,
                                            borderLeft: `2px solid ${ev.color}`,
                                        }}
                                    >
                                        {ev.title}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
});

const WeekView = memo(({ currentDate, events, handleDateClick, handleEventClick }) => {
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(weekStart);
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    const hours = Array.from({ length: 24 }, (_, i) => i);

    const weekEvents = events.filter(ev => {
        const evStart = new Date(ev.start);
        const evEnd = new Date(ev.end);
        return evStart <= weekEnd && evEnd >= weekStart;
    }).sort((a, b) => new Date(a.start) - new Date(b.start));

    const allDayEvents = weekEvents.filter(ev => ev.allDay);

    // Process timed events into renderable segments
    const timedEventSegments = useMemo(() => {
        const segments = [];
        const rawTimedEvents = weekEvents.filter(ev => !ev.allDay);

        rawTimedEvents.forEach(ev => {
            const evStart = new Date(ev.start);
            const evEnd = new Date(ev.end);

            // Iterate through each day of the week
            days.forEach(day => {
                const dayStart = startOfDay(day);
                const dayEnd = endOfDay(day);

                // Check if event overlaps with this day
                if (evStart <= dayEnd && evEnd >= dayStart) {
                    // Clamp start/end to the day boundaries
                    const displayStart = evStart < dayStart ? dayStart : evStart;
                    const displayEnd = evEnd > dayEnd ? dayEnd : evEnd;

                    segments.push({
                        ...ev, // Keep original event props
                        _segmentStart: displayStart,
                        _segmentEnd: displayEnd,
                        _dayIndex: getDay(day)
                    });
                }
            });
        });
        return segments;
    }, [weekEvents, days]);

    return (
        <div className="h-full flex flex-col overflow-hidden blur-appear">
            <div className="grid grid-cols-8 border-b border-white/10 pb-2">
                <div className="text-xs text-gray-500 text-center pt-2">GMT</div>
                {days.map(day => (
                    <div key={day.toString()} className={`text-center py-2 ${isToday(day) ? 'bg-blue-500/10 rounded-t-lg' : ''}`}>
                        <div className={`text-xs font-semibold uppercase ${isToday(day) ? 'text-blue-400' : 'text-gray-400'}`}>
                            {format(day, 'EEE')}
                        </div>
                        <div className={`text-lg font-bold ${isToday(day) ? 'text-blue-500' : 'text-white'}`}>
                            {format(day, 'd')}
                        </div>
                    </div>
                ))}
            </div>

            {allDayEvents.length > 0 && (
                <div className="grid grid-cols-8 border-b border-amber-500/20 bg-amber-500/5 min-h-[40px]">
                    <div className="flex items-center justify-end pr-2">
                        <span className="text-[10px] font-semibold text-amber-300 uppercase">All Day</span>
                    </div>
                    {days.map(day => {
                        const dayAllDayEvents = allDayEvents.filter(ev => isSameDay(new Date(ev.start), day));
                        return (
                            <div key={day.toString()} className="flex flex-wrap gap-1 p-1">
                                {dayAllDayEvents.map(ev => (
                                    <div
                                        key={ev._id}
                                        onClick={(e) => handleEventClick(e, ev)}
                                        className="h-5 px-1.5 flex items-center text-[10px] font-medium rounded truncate cursor-pointer hover:brightness-110 transition-all"
                                        style={{
                                            backgroundColor: `${ev.color}30`,
                                            borderLeft: `2px solid ${ev.color}`,
                                            color: 'white'
                                        }}
                                    >
                                        {ev.title}
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                <div className="absolute inset-0 grid grid-cols-8 pointer-events-none">
                    <div className="border-r border-white/5 bg-black/10"></div>
                    {days.map((_, i) => (
                        <div key={i} className="border-r border-white/5"></div>
                    ))}
                </div>

                {hours.map(hour => (
                    <div key={hour} className="grid grid-cols-8 h-16 min-h-[64px] border-b border-white/5 relative group hover:bg-white/5 transition-colors">
                        <div className="text-[10px] text-gray-500 text-right pr-2 pt-1 border-r border-white/5 -mt-2.5 bg-transparent">
                            {format(setHours(new Date(), hour), 'h a')}
                        </div>
                        {days.map(day => (
                            <div
                                key={day.toString() + hour}
                                onClick={() => handleDateClick(setHours(day, hour))}
                                className="h-full cursor-pointer hover:bg-white/5"
                            ></div>
                        ))}
                    </div>
                ))}

                {timedEventSegments.map((segment, idx) => {
                    const evStart = segment._segmentStart;
                    const evEnd = segment._segmentEnd;

                    const dayIndex = segment._dayIndex;
                    const startHour = getHours(evStart);
                    const durationMinutes = differenceInMinutes(evEnd, evStart);
                    const top = (startHour * 64) + ((evStart.getMinutes() / 60) * 64);
                    // Minimum height for visibility, but respected duration for valid range
                    const height = Math.max((durationMinutes / 60) * 64, 20);

                    return (
                        <motion.div
                            key={`${segment._id}-${dayIndex}-${idx}`}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ zIndex: 50, brightness: 1.1 }}
                            className="absolute rounded-md p-1.5 text-xs border-l-2 shadow-lg overflow-hidden cursor-pointer transition-all"
                            style={{
                                left: `${(dayIndex + 1) * (100 / 8)}%`,
                                width: `${100 / 8 - 0.5}%`,
                                top: `${top}px`,
                                height: `${height}px`,
                                backgroundColor: `${segment.color}40`,
                                borderColor: segment.color,
                                color: 'white',
                                backdropFilter: 'blur(4px)'
                            }}
                            onClick={(e) => handleEventClick(e, segment)}
                        >
                            <div className="font-bold truncate">{segment.title}</div>
                            <div className="text-[10px] opacity-80 truncate">{format(evStart, 'h:mm a')}</div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
});

const DayView = memo(({ currentDate, events, setSelectedDate, setIsEventModalOpen, handleDateClick, handleEventClick }) => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const dayEvents = events
        .filter(ev => {
            const evStart = startOfDay(new Date(ev.start));
            const evEnd = endOfDay(new Date(ev.end));
            return currentDate >= evStart && currentDate <= evEnd;
        })
        .sort((a, b) => new Date(a.start) - new Date(b.start));

    const allDayEvents = dayEvents.filter(ev => ev.allDay);
    const timedEvents = dayEvents.filter(ev => !ev.allDay);

    return (
        <div className="h-full flex flex-col overflow-hidden blur-appear">
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-400">{format(currentDate, 'EEEE')}</span>
                    <span className="text-3xl font-bold text-white">{format(currentDate, 'd')}</span>
                </div>
                <button onClick={() => { setSelectedDate(currentDate); setIsEventModalOpen(true); }} className="px-4 py-2 bg-blue-600 rounded-lg text-white font-medium hover:bg-blue-700 transition-colors">
                    + Add Event
                </button>
            </div>

            {allDayEvents.length > 0 && (
                <div className="px-4 py-2 bg-amber-500/5 border-b border-amber-500/20">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider">All Day</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {allDayEvents.map(ev => (
                            <motion.div
                                key={ev._id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                onClick={(e) => handleEventClick(e, ev)}
                                className="px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer hover:brightness-110 transition-all shadow-md"
                                style={{
                                    backgroundColor: `${ev.color}25`,
                                    borderLeft: `3px solid ${ev.color}`,
                                    color: 'white'
                                }}
                            >
                                {ev.title}
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                {hours.map(hour => (
                    <div key={hour} className="grid grid-cols-[60px_1fr] min-h-[80px] border-b border-white/5 hover:bg-white/5 transition-colors group">
                        <div className="text-xs text-gray-500 text-right pr-4 pt-2 border-r border-white/5">
                            {format(setHours(new Date(), hour), 'h a')}
                        </div>
                        <div
                            className="relative cursor-pointer"
                            onClick={() => handleDateClick(setHours(currentDate, hour))}
                        >
                            <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-white/5 pointer-events-none"></div>
                        </div>
                    </div>
                ))}

                {timedEvents.map(ev => {
                    // Clamp event to the current day for rendering
                    const realStart = new Date(ev.start);
                    const realEnd = new Date(ev.end);

                    const dayStart = startOfDay(currentDate);
                    const dayEnd = endOfDay(currentDate);

                    const displayStart = realStart < dayStart ? dayStart : realStart;
                    const displayEnd = realEnd > dayEnd ? dayEnd : realEnd;

                    const startHour = getHours(displayStart);
                    const durationMinutes = differenceInMinutes(displayEnd, displayStart);
                    const top = (startHour * 80) + ((displayStart.getMinutes() / 60) * 80);
                    const height = Math.max((durationMinutes / 60) * 80, 40);

                    return (
                        <motion.div
                            key={ev._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            onClick={(e) => handleEventClick(e, ev)}
                            whileHover={{ zIndex: 50, brightness: 1.05 }}
                            className="absolute left-[70px] right-4 rounded-xl p-3 border-l-4 shadow-lg cursor-pointer flex flex-col justify-center transition-all"
                            style={{
                                top: `${top}px`,
                                height: `${height}px`,
                                backgroundColor: `${ev.color}25`,
                                borderColor: ev.color,
                                backdropFilter: 'blur(8px)'
                            }}
                        >
                            <div className="font-bold text-white text-sm">{ev.title}</div>
                            <div className="flex items-center text-xs text-gray-300 gap-2 mt-1">
                                <Clock className="w-3 h-3" />
                                {format(displayStart, 'h:mm a')} - {format(displayEnd, 'h:mm a')}
                            </div>
                            {ev.description && <div className="text-xs text-gray-400 mt-1 truncate">{ev.description}</div>}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
});

const YearView = memo(({ currentDate, setCurrentDate, setView }) => {
    const yearStart = startOfYear(currentDate);
    const months = eachMonthOfInterval({ start: yearStart, end: endOfYear(currentDate) });

    return (
        <div className="h-full overflow-y-auto custom-scrollbar p-2 blur-appear">
            <div className="grid grid-cols-4 gap-4 h-full">
                {months.map(month => (
                    <motion.div
                        key={month.toString()}
                        whileHover={{ scale: 1.05 }}
                        onClick={() => {
                            setCurrentDate(month);
                            setView('month');
                        }}
                        className={`p-3 rounded-2xl border cursor-pointer flex flex-col items-center justify-between ${isSameMonth(month, new Date())
                            ? 'bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-blue-500/30'
                            : 'bg-white/5 border-white/5 hover:bg-white/10'
                            }`}
                    >
                        <h3 className="text-lg font-bold text-white mb-2">{format(month, 'MMMM')}</h3>

                        <div className="grid grid-cols-7 gap-1 w-full text-[8px] text-gray-400">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d} className="text-center">{d}</div>)}
                            {eachDayOfInterval({
                                start: startOfWeek(startOfMonth(month)),
                                end: endOfWeek(endOfMonth(month))
                            }).map((d, i) => (
                                <div
                                    key={i}
                                    className={`
                                        aspect-square rounded-full flex items-center justify-center
                                        ${!isSameMonth(d, month) ? 'opacity-20' : ''}
                                        ${isToday(d) ? 'bg-blue-500 text-white' : ''}
                                    `}
                                >
                                    {format(d, 'd')}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
});

const CalendarPage = () => {
    const location = useLocation();
    const { calendars, sharedCalendars, fetchCalendarEvents, deleteEvent, visibleCalendarIds } = useCalendar();

    // Initialize currentDate from navigation state if available (one-time)
    const initialDate = location.state?.eventDate ? new Date(location.state.eventDate) : new Date();
    const [currentDate, setCurrentDate] = useState(initialDate);
    const [view, setView] = useState('month');
    const [allEvents, setAllEvents] = useState([]);
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isEventDetailOpen, setIsEventDetailOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Edit support
    const [eventToEdit, setEventToEdit] = useState(null);

    useEffect(() => {
        const loadEvents = async () => {
            setIsLoading(true);
            try {
                let eventsArray = [];
                for (const cal of calendars) {
                    const calEvents = await fetchCalendarEvents(cal._id);
                    const enrichedEvents = calEvents.map(ev => ({
                        ...ev,
                        color: cal.color,
                        calendarName: cal.name,
                        calendarId: cal._id
                    }));
                    eventsArray = [...eventsArray, ...enrichedEvents];
                }
                for (const cal of (sharedCalendars || [])) {
                    const calEvents = await fetchCalendarEvents(cal._id);
                    const enrichedEvents = calEvents.map(ev => ({
                        ...ev,
                        color: cal.color,
                        calendarName: cal.name,
                        calendarId: cal._id,
                        isShared: true,
                        ownerName: cal.owner?.name
                    }));
                    eventsArray = [...eventsArray, ...enrichedEvents];
                }
                setAllEvents(eventsArray);
            } catch (error) {
                console.error("Failed to load events:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadEvents();
    }, [calendars, sharedCalendars, fetchCalendarEvents]);

    const events = useMemo(() => {
        return allEvents.filter(ev => visibleCalendarIds.has(ev.calendarId));
    }, [allEvents, visibleCalendarIds]);

    const nextPeriod = () => {
        if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
        else if (view === 'week') setCurrentDate(addDays(currentDate, 7));
        else if (view === 'day') setCurrentDate(addDays(currentDate, 1));
        else if (view === 'year') setCurrentDate(addMonths(currentDate, 12));
    };

    const prevPeriod = () => {
        if (view === 'month') setCurrentDate(subMonths(currentDate, 1));
        else if (view === 'week') setCurrentDate(addDays(currentDate, -7));
        else if (view === 'day') setCurrentDate(addDays(currentDate, -1));
        else if (view === 'year') setCurrentDate(subMonths(currentDate, 12));
    };

    const handleDayClick = (date) => {
        setCurrentDate(date);
        setView('day');
    };

    const handleDateClick = (date) => {
        setSelectedDate(date);
        setEventToEdit(null); // Clear edit mode
        setIsEventModalOpen(true);
    };

    const handleEventClick = (e, event) => {
        e.stopPropagation();
        setSelectedEvent(event);
        setIsEventDetailOpen(true);
    };

    const handleEditEvent = () => {
        setEventToEdit(selectedEvent);
        setIsEventDetailOpen(false);
        setIsEventModalOpen(true);
    };

    return (

        <div className="min-h-full w-full max-w-full flex flex-col space-y-4">
            <GlassPanel className="p-4 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0 z-20">
                <div className="flex items-center space-x-4">
                    <h2 className="text-2xl font-bold text-white min-w-[200px] tracking-tight">
                        {format(currentDate, view === 'year' ? 'yyyy' : 'MMMM yyyy')}
                    </h2>
                    <div className="flex bg-black/40 rounded-xl p-1 border border-white/10">
                        <button onClick={prevPeriod} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button onClick={() => setCurrentDate(new Date())} className="px-4 text-xs font-bold text-gray-300 hover:text-white transition-colors border-x border-white/5 mx-1">
                            Today
                        </button>
                        <button onClick={nextPeriod} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex items-center space-x-3 w-full sm:w-auto">
                    <div className="flex bg-black/40 rounded-xl p-1 border border-white/10 w-full sm:w-auto relative">
                        {['Day', 'Week', 'Month', 'Year'].map((v) => (
                            <button
                                key={v}
                                onClick={() => setView(v.toLowerCase())}
                                className={`flex-1 sm:flex-none px-5 py-1.5 rounded-lg text-sm font-medium transition-all relative z-10 ${view === v.toLowerCase()
                                    ? 'text-white shadow-lg'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {v}
                                {view === v.toLowerCase() && (
                                    <motion.div
                                        layoutId="viewTab"
                                        className="absolute inset-0 bg-blue-600 rounded-lg -z-10"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                            </button>
                        ))}
                    </div>

                </div>
            </GlassPanel>

            <GlassPanel className="flex-1 w-full max-w-full p-4 relative z-10">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={view + currentDate.toString()}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3, ease: "circOut" }}
                        className="min-h-full"
                    >
                        {view === 'month' && <MonthView currentDate={currentDate} events={events} handleDayClick={handleDayClick} handleEventClick={handleEventClick} />}
                        {view === 'week' && <WeekView currentDate={currentDate} events={events} handleDateClick={handleDateClick} handleEventClick={handleEventClick} />}
                        {view === 'day' && <DayView currentDate={currentDate} events={events} setSelectedDate={setSelectedDate} setIsEventModalOpen={setIsEventModalOpen} handleDateClick={handleDateClick} handleEventClick={handleEventClick} />}
                        {view === 'year' && <YearView currentDate={currentDate} setCurrentDate={setCurrentDate} setView={setView} />}
                    </motion.div>
                </AnimatePresence>

                <AnimatePresence>
                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[1px] rounded-xl"
                        >
                            <div className="bg-dark-bg/80 p-4 rounded-2xl border border-white/10 shadow-xl backdrop-blur-md flex flex-col items-center gap-3">
                                <Loader className="w-6 h-6 text-blue-400 animate-spin" />
                                <span className="text-sm font-medium text-gray-400">Loading events...</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </GlassPanel>

            <AnimatePresence>
                {isEventDetailOpen && selectedEvent && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setIsEventDetailOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="w-full max-w-md relative z-10"
                        >
                            <GlassPanel className="p-0 border border-white/10 shadow-2xl bg-dark-bg/90 backdrop-blur-2xl">
                                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                                    <h3 className="text-xl font-bold text-white">Event Details</h3>
                                    <button onClick={() => setIsEventDetailOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="p-6 space-y-4">
                                    <div>
                                        <h4 className="text-2xl font-bold text-white">{selectedEvent.title}</h4>
                                        <p className="text-sm text-gray-400 mt-1">{selectedEvent.calendarName}</p>
                                    </div>

                                    <div className="flex items-center gap-3 text-gray-300">
                                        <Clock className="w-4 h-4 text-blue-400" />
                                        <span>{format(new Date(selectedEvent.start), 'PPP p')} - {format(new Date(selectedEvent.end), 'p')}</span>
                                    </div>

                                    {selectedEvent.location && (
                                        <div className="flex items-center gap-3 text-gray-300">
                                            <MapPin className="w-4 h-4 text-purple-400" />
                                            <span>{selectedEvent.location}</span>
                                        </div>
                                    )}

                                    {selectedEvent.description && (
                                        <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10">
                                            <p className="text-sm text-gray-300">{selectedEvent.description}</p>
                                        </div>
                                    )}

                                    <div className="flex justify-end gap-3 pt-4 border-t border-white/5 mt-6">
                                        <button
                                            type="button"
                                            onClick={handleEditEvent}
                                            className="px-5 py-2 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-xl text-sm font-semibold hover:bg-blue-600/30 transition-all flex items-center gap-2"
                                        >
                                            <Edit className="w-4 h-4" />
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                const calendarId = selectedEvent.calendarId || selectedEvent.calendar;
                                                if (calendarId) {
                                                    try {
                                                        setIsDeleting(true);
                                                        const result = await deleteEvent(calendarId, selectedEvent._id);
                                                        if (result.success) {
                                                            setAllEvents(prev => prev.filter(e => e._id !== selectedEvent._id));
                                                            setIsEventDetailOpen(false);
                                                        }
                                                    } catch (error) {
                                                        console.error("Failed to delete event:", error);
                                                    } finally {
                                                        setIsDeleting(false);
                                                    }
                                                }
                                            }}
                                            disabled={isDeleting}
                                            className={`px-5 py-2 border rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${isDeleting
                                                ? 'bg-red-600/10 border-red-500/20 text-red-400/50 cursor-not-allowed'
                                                : 'bg-red-600/20 border-red-500/30 text-red-400 hover:bg-red-600/30'
                                                }`}
                                        >
                                            {isDeleting ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-red-400/50 border-t-red-400 rounded-full animate-spin" />
                                                    Deleting...
                                                </>
                                            ) : (
                                                <>
                                                    <Trash2 className="w-4 h-4" />
                                                    Delete
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </GlassPanel>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <EventModal
                isOpen={isEventModalOpen}
                onClose={() => { setIsEventModalOpen(false); setEventToEdit(null); }}
                selectedDate={selectedDate}
                eventToEdit={eventToEdit}
            />
        </div >
    );
};

export default CalendarPage;
