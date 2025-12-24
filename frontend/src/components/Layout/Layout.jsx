import { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCalendar } from '../../context/CalendarContext';
import {
  LogOut,
  Calendar as CalendarIcon,
  Settings,
  Plus,
  LayoutDashboard,
  CheckSquare,
  Search,
  Bell,
  Users,
  X,
  Trash2,
  Menu,
  Folder,
  ChevronDown,
  ChevronRight,
  Edit3,
  Play,
  Flag,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CalendarModal from '../Modals/CalendarModal';
import ShareCalendarModal from '../Modals/ShareCalendarModal';
import EventModal from '../Modals/EventModal';
import ThreeBackground from '../ThreeBackground';
import GlassPanel from '../UI/GlassPanel';

// Helper to get notification styling - subtle and modern
const getNotificationStyle = (type, isRead) => {
  switch (type) {
    case 'event_start':
      return {
        icon: Play,
        iconColor: 'text-green-400',
        borderColor: 'border-l-green-500/50'
      };
    case 'event_end':
      return {
        icon: Flag,
        iconColor: 'text-red-400',
        borderColor: 'border-l-red-500/50'
      };
    default:
      return {
        icon: Bell,
        iconColor: 'text-indigo-400',
        borderColor: 'border-l-indigo-500/50'
      };
  }
};

const Layout = () => {
  const { user, logout, token } = useAuth();
  const {
    calendars,
    sharedCalendars,
    groups,
    toggleCalendarVisibility,
    isCalendarVisible,
    addGroup,
    deleteGroup,
    toggleGroupVisibility,
    isGroupVisible,
    isGroupPartiallyVisible,
    tasks,
    toggleTask,
    fetchCalendarEvents,
    notifications,
    unreadCount,
    markAsRead,
    deleteNotification,
    clearNotifications,
    searchQuery,
    setSearchQuery,
    deleteCalendar
  } = useCalendar();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [calendarToEdit, setCalendarToEdit] = useState(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventSelectedDate, setEventSelectedDate] = useState(new Date());

  // Share Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [calendarToShare, setCalendarToShare] = useState(null);

  // Notifications state
  // Notifications state moved to Context
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationRef = useRef(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Mobile toggle

  // Group Modal State
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedCalendarsForGroup, setSelectedCalendarsForGroup] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  // Search State (for dropdown only, query is in context)
  const [searchResults, setSearchResults] = useState({ tasks: [], events: [] });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  // ... (Keep existing notification logic unchanged) ...


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);





  const NavItem = ({ to, icon: Icon, children }) => (
    <Link to={to}>
      <div
        className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 hover:translate-x-1 active:scale-[0.98] ${isActive(to)
          ? 'bg-blue-600/20 text-blue-400 shadow-lg shadow-blue-500/10 border border-blue-500/30'
          : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
      >
        <Icon className="w-5 h-5 mr-3" />
        {children}
      </div>
    </Link>
  );

  return (
    <div className="relative flex h-screen overflow-hidden bg-dark-bg text-white font-sans">
      {/* Global 3D Background */}
      <ThreeBackground />

      {/* Mobile Toggle */}
      <div className="lg:hidden absolute top-4 left-4 z-50">
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-glass-surface rounded-lg text-white">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="w-72 h-full p-4 flex-shrink-0 z-40 lg:relative absolute"
          >
            <GlassPanel className="h-full flex flex-col backdrop-blur-2xl bg-black/40 border-white/5">
              <div className="p-6 flex items-center space-x-3 border-b border-white/5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <CalendarIcon className="w-6 h-6 text-white" />
                </div>
                <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                  CalManage
                </span>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
                <div className="mb-8">
                  <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 px-2">Overview</h3>
                  <nav className="space-y-2">
                    <NavItem to="/" icon={LayoutDashboard}>Dashboard</NavItem>
                    <NavItem to="/calendar" icon={CalendarIcon}>Calendar</NavItem>
                    <NavItem to="/tasks" icon={CheckSquare}>Tasks</NavItem>
                  </nav>
                </div>

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2 px-2">
                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">My Calendars</h3>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      onClick={() => { setCalendarToEdit(null); setIsCalendarModalOpen(true); }}
                      className="text-gray-500 hover:text-white transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </motion.button>
                  </div>
                  <nav className="space-y-1">
                    {calendars.map((cal) => (
                      <motion.div
                        key={cal._id}
                        whileHover={{ x: 4 }}
                        className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg hover:bg-white/5 cursor-pointer group transition-all ${isCalendarVisible(cal._id) ? 'text-gray-300' : 'text-gray-600'
                          }`}
                      >
                        <div className="flex items-center" onClick={() => toggleCalendarVisibility(cal._id)}>
                          <div
                            className={`w-3 h-3 rounded-sm mr-3 border-2 flex items-center justify-center transition-all ${isCalendarVisible(cal._id) ? 'border-transparent' : 'border-gray-600'
                              }`}
                            style={{ backgroundColor: isCalendarVisible(cal._id) ? cal.color : 'transparent' }}
                          >
                            {isCalendarVisible(cal._id) && (
                              <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span className={`truncate transition-colors ${isCalendarVisible(cal._id) ? 'group-hover:text-white' : ''}`}>
                            {cal.name}
                          </span>
                        </div>
                        {!cal.isDefault && (
                          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCalendarToEdit(cal);
                                setIsCalendarModalOpen(true);
                              }}
                              className="text-gray-500 hover:text-blue-400 p-1 transition-all"
                              title="Edit"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            {/* Keep existing Share button logic if desired, or replace? Assuming user wants edit/delete BESIDE shared icon if it exists, or just here. */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Are you sure you want to delete "${cal.name}"?`)) {
                                  deleteCalendar(cal._id);
                                }
                              }}
                              className="text-gray-500 hover:text-red-400 p-1 transition-all"
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCalendarToShare(cal);
                                setIsShareModalOpen(true);
                              }}
                              className="text-gray-500 hover:text-purple-400 p-1 transition-all"
                              title="Share"
                            >
                              <Users className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </nav>
                </div>

                {/* SHARED CALENDARS Section */}
                {sharedCalendars && sharedCalendars.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2 px-2">
                      <h3 className="text-[10px] font-bold text-purple-400 uppercase tracking-widest flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Shared
                      </h3>
                    </div>
                    <nav className="space-y-1">
                      {sharedCalendars.map((cal) => (
                        <motion.div
                          key={cal._id}
                          whileHover={{ x: 4 }}
                          onClick={() => toggleCalendarVisibility(cal._id)}
                          className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg hover:bg-white/5 cursor-pointer group transition-all ${isCalendarVisible(cal._id) ? 'text-gray-300' : 'text-gray-600'
                            }`}
                        >
                          <div className="flex items-center flex-1 min-w-0">
                            <div
                              className={`w-3 h-3 rounded-sm mr-3 border-2 flex items-center justify-center transition-all flex-shrink-0 ${isCalendarVisible(cal._id) ? 'border-transparent' : 'border-gray-600'
                                }`}
                              style={{ backgroundColor: isCalendarVisible(cal._id) ? cal.color : 'transparent' }}
                            >
                              {isCalendarVisible(cal._id) && (
                                <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className={`truncate transition-colors ${isCalendarVisible(cal._id) ? 'group-hover:text-white' : ''}`}>
                                {cal.name}
                              </span>
                              <span className="text-[10px] text-gray-500 truncate">
                                by {cal.owner?.name || 'Unknown'}
                              </span>
                            </div>
                          </div>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full ml-2 flex-shrink-0 ${cal.role === 'editor'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-blue-500/20 text-blue-400'
                            }`}>
                            {cal.role === 'editor' ? 'Edit' : 'View'}
                          </span>
                        </motion.div>
                      ))}
                    </nav>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-white/5">
                <NavItem to="/settings" icon={Settings}>Settings</NavItem>
                <div className="flex items-center pt-4 mt-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5">
                    <div className="w-full h-full rounded-full bg-black/50 flex items-center justify-center overflow-hidden">
                      <span className="font-bold text-sm">{user?.name?.charAt(0)}</span>
                    </div>
                  </div>
                  <div className="ml-3 overflow-hidden">
                    <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <button onClick={handleLogout} className="ml-auto text-gray-500 hover:text-red-400 transition-colors">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </GlassPanel>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden relative z-10">
        <header className="px-8 py-6 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-indigo-400">
              {location.pathname === '/' ? 'Dashboard' :
                location.pathname === '/calendar' ? 'Calendar' :
                  location.pathname === '/tasks' ? 'Tasks' : 'Settings'}
            </h1>
            <p className="text-sm text-indigo-200/60 mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <div className="relative group hidden md:block" ref={searchRef}>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                <Search className="h-4 w-4 text-gray-400 group-focus-within:text-white transition-colors" />
              </div>
              <input
                type="text"
                className="block w-64 pl-10 pr-3 py-2.5 border border-indigo-500/20 rounded-xl bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:bg-white/10 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all text-sm backdrop-blur-sm"
                placeholder="Search tasks & events..."
                value={searchQuery}
                onChange={async (e) => {
                  const q = e.target.value;
                  setSearchQuery(q);
                  if (q.length < 2) {
                    setSearchResults({ tasks: [], events: [] });
                    setIsSearchOpen(false);
                    return;
                  }
                  // Filter tasks
                  const matchedTasks = tasks.filter(t => t.text?.toLowerCase().includes(q.toLowerCase()));
                  // Fetch and filter events from all calendars
                  let matchedEvents = [];
                  const allCals = [...calendars, ...(sharedCalendars || [])];
                  for (const cal of allCals) {
                    const evts = await fetchCalendarEvents(cal._id);
                    const filtered = evts.filter(ev => ev.title?.toLowerCase().includes(q.toLowerCase()));
                    matchedEvents = [...matchedEvents, ...filtered.map(ev => ({ ...ev, calendarName: cal.name, color: cal.color }))];
                  }
                  setSearchResults({ tasks: matchedTasks.slice(0, 5), events: matchedEvents.slice(0, 5) });
                  setIsSearchOpen(true);
                }}
                onFocus={() => { if (searchQuery.length >= 2) setIsSearchOpen(true); }}
              />

              {/* Search Results Dropdown */}
              <AnimatePresence>
                {isSearchOpen && (searchResults.tasks.length > 0 || searchResults.events.length > 0) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full left-0 right-0 mt-2 z-50"
                  >
                    <GlassPanel className="p-0 overflow-hidden bg-black/90 border-white/10 max-h-80 overflow-y-auto custom-scrollbar">
                      {searchResults.tasks.length > 0 && (
                        <div className="p-2 border-b border-white/5">
                          <p className="text-[10px] uppercase tracking-widest text-gray-500 px-2 mb-1">Tasks</p>
                          {searchResults.tasks.map(task => (
                            <div
                              key={task._id}
                              onClick={() => { toggleTask(task._id, task.completed); }}
                              className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg cursor-pointer group"
                            >
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-green-500 border-green-500' : 'border-gray-500'}`}>
                                {task.completed && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                              </div>
                              <span className={`text-sm ${task.completed ? 'text-gray-500 line-through' : 'text-gray-200'}`}>{task.text}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {searchResults.events.length > 0 && (
                        <div className="p-2">
                          <p className="text-[10px] uppercase tracking-widest text-gray-500 px-2 mb-1">Events</p>
                          {searchResults.events.map(ev => (
                            <div
                              key={ev._id}
                              onClick={() => {
                                const eventDate = new Date(ev.start);
                                navigate('/calendar', { state: { eventDate } });
                                setIsSearchOpen(false);
                                setSearchQuery('');
                              }}
                              className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg cursor-pointer"
                            >
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ev.color }} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-200 truncate">{ev.title}</p>
                                <p className="text-[10px] text-gray-500">{ev.calendarName}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </GlassPanel>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Create Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { setEventSelectedDate(new Date()); setIsEventModalOpen(true); }}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white pl-4 pr-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/50 transition-all inline-flex items-center justify-center border border-blue-400/20 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
              <Plus className="w-4 h-4 mr-1.5 relative z-10" />
              <span className="relative z-10">Create</span>
            </motion.button>

            {/* Notification Bell */}
            <div className="relative mr-1" ref={notificationRef}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group"
              >
                <Bell className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center text-[10px] font-bold text-white shadow-lg shadow-red-500/30">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </motion.button>

              {/* Notification Dropdown */}
              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-96 z-50"
                  >
                    <GlassPanel className="p-0 overflow-hidden bg-[#0f172a] backdrop-blur-none border-indigo-500/20 shadow-2xl shadow-black/50">
                      <div className="px-5 py-4 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-indigo-500/20">
                            <Bell className="w-4 h-4 text-indigo-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white text-sm">Notifications</h3>
                            <p className="text-[10px] text-gray-500">{notifications.length} total</p>
                          </div>
                        </div>
                        {notifications.length > 0 && (
                          <button onClick={clearNotifications} className="text-xs text-gray-400 hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-all">
                            Clear all
                          </button>
                        )}
                      </div>

                      {/* Subtle gradient divider to hand off to content */}
                      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mx-4 mb-2" />

                      <div className="max-h-80 overflow-y-auto custom-scrollbar px-3 pb-3 space-y-2">
                        {notifications.length > 0 ? (
                          notifications.map((n, idx) => {
                            const style = getNotificationStyle(n.type, n.isRead);
                            return (
                              <motion.div
                                key={n._id}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.02, duration: 0.15 }}
                                className={`relative p-4 rounded-lg cursor-pointer group transition-all duration-150 
                                  bg-white/[0.04] hover:bg-white/[0.07]
                                `}
                                onClick={() => !n.isRead && markAsRead(n._id)}
                              >
                                {/* Unread indicator dot */}
                                {!n.isRead && (
                                  <div className={`absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${n.type === 'event_start' ? 'bg-green-400' :
                                    n.type === 'event_end' ? 'bg-red-400' : 'bg-indigo-400'
                                    }`} />
                                )}

                                <div className="flex items-start gap-3 pl-1">
                                  {/* Icon */}
                                  <div className={`p-2 rounded-md transition-colors ${n.type === 'event_start' ? 'bg-green-500/15' :
                                    n.type === 'event_end' ? 'bg-red-500/15' :
                                      'bg-indigo-500/15'
                                    }`}>
                                    <style.icon className={`w-4 h-4 ${style.iconColor}`} />
                                  </div>

                                  {/* Content with stronger hierarchy */}
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-[13px] leading-snug font-medium ${!n.isRead ? 'text-gray-100' : 'text-gray-300'}`}>
                                      {n.message}
                                    </p>
                                    <p className="text-[10px] text-gray-500/70 mt-1.5 flex items-center gap-1">
                                      <Clock className="w-2.5 h-2.5 opacity-60" />
                                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  </div>

                                  {/* Delete button */}
                                  <button
                                    onClick={(e) => { e.stopPropagation(); deleteNotification(n._id); }}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 self-center"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </motion.div>
                            )
                          })
                        ) : (
                          <div className="py-10 px-6 text-center">
                            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-white/[0.04] flex items-center justify-center">
                              <Bell className="w-6 h-6 text-gray-500/50" />
                            </div>
                            <p className="text-gray-300 text-sm font-medium mb-1">All caught up!</p>
                            <p className="text-gray-500/70 text-xs">No new notifications</p>
                          </div>
                        )}
                      </div>
                    </GlassPanel>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 custom-scrollbar relative">
          {/* Add a subtle highlight at the top for depth */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent z-20" />
          <Outlet />
        </div>
      </main>

      <CalendarModal
        isOpen={isCalendarModalOpen}
        onClose={() => { setIsCalendarModalOpen(false); setCalendarToEdit(null); }}
        calendarToEdit={calendarToEdit}
      />
      <ShareCalendarModal
        key={`${calendarToShare?._id || 'none'}:${isShareModalOpen ? 'open' : 'closed'}`}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        calendarId={calendarToShare?._id}
        calendarName={calendarToShare?.name}
      />
      <EventModal isOpen={isEventModalOpen} onClose={() => setIsEventModalOpen(false)} selectedDate={eventSelectedDate} />

      {/* Group Modal */}
      <AnimatePresence>
        {isGroupModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsGroupModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-md relative z-10"
            >
              <GlassPanel className="p-0 border border-white/10 shadow-2xl bg-dark-bg/95 backdrop-blur-2xl">
                <div className="p-6 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl">
                      <Folder className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Create Group</h3>
                      <p className="text-sm text-gray-500">Group calendars for quick filtering</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div>
                    <label className="text-sm font-medium text-gray-400 block mb-2">Group Name</label>
                    <input
                      type="text"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="e.g., Work, Personal, Projects..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-400 block mb-2">Select Calendars</label>
                    <div className="max-h-48 overflow-y-auto space-y-1 bg-white/5 rounded-xl p-2 border border-white/10">
                      {[...calendars, ...sharedCalendars].map(cal => (
                        <div
                          key={cal._id}
                          onClick={() => {
                            setSelectedCalendarsForGroup(prev =>
                              prev.includes(cal._id)
                                ? prev.filter(id => id !== cal._id)
                                : [...prev, cal._id]
                            );
                          }}
                          className={`flex items-center px-3 py-2 rounded-lg cursor-pointer transition-all ${selectedCalendarsForGroup.includes(cal._id)
                            ? 'bg-amber-500/20 border border-amber-500/30'
                            : 'hover:bg-white/5'
                            }`}
                        >
                          <div
                            className="w-3 h-3 rounded-sm mr-3"
                            style={{ backgroundColor: cal.color }}
                          />
                          <span className="text-sm text-gray-300">{cal.name}</span>
                          {selectedCalendarsForGroup.includes(cal._id) && (
                            <svg className="w-4 h-4 text-amber-400 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2">{selectedCalendarsForGroup.length} calendar(s) selected</p>
                  </div>
                </div>

                <div className="p-6 border-t border-white/5 flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setIsGroupModalOpen(false);
                      setNewGroupName('');
                      setSelectedCalendarsForGroup([]);
                    }}
                    className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (newGroupName.trim() && selectedCalendarsForGroup.length > 0) {
                        addGroup({
                          name: newGroupName.trim(),
                          calendarIds: selectedCalendarsForGroup,
                          color: '#f59e0b'
                        });
                        setIsGroupModalOpen(false);
                        setNewGroupName('');
                        setSelectedCalendarsForGroup([]);
                      }
                    }}
                    disabled={!newGroupName.trim() || selectedCalendarsForGroup.length === 0}
                    className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create Group
                  </button>
                </div>
              </GlassPanel>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Layout;
