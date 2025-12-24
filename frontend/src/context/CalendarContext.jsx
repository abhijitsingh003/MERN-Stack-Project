import { createContext, useState, useEffect, useContext, useCallback, useRef, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { compareAsc } from 'date-fns';

const CalendarContext = createContext();

export const CalendarProvider = ({ children }) => {
  const [calendars, setCalendars] = useState([]);
  const [sharedCalendars, setSharedCalendars] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [visibleCalendarIds, setVisibleCalendarIds] = useState(new Set());
  const { token, user } = useAuth();

  // Selected Date State (for Mini Calendar & Dashboard)
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Dashboard Cache
  const [dashboardEvents, setDashboardEvents] = useState(null);

  // Tasks State
  const [tasks, setTasks] = useState([]);

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Search State (shared with Dashboard)
  const [searchQuery, setSearchQuery] = useState('');

  const calendarsRef = useRef(calendars);
  const sharedCalendarsRef = useRef(sharedCalendars);

  useEffect(() => {
    calendarsRef.current = calendars;
  }, [calendars]);

  useEffect(() => {
    sharedCalendarsRef.current = sharedCalendars;
  }, [sharedCalendars]);

  // Reset state on logout
  useEffect(() => {
    if (!user) {
      setSelectedDate(new Date());
    }
  }, [user]);

  // Load visibility preferences from localStorage
  const loadVisibilityPreferences = useCallback(() => {
    if (!user || !user._id) return null;
    try {
      const raw = localStorage.getItem(`calendarVisibility:${user._id}`);
      return raw ? new Set(JSON.parse(raw)) : null;
    } catch {
      return null;
    }
  }, [user]);

  // Save visibility preferences to localStorage
  const saveVisibilityPreferences = useCallback((ids) => {
    if (!user || !user._id) return;
    try {
      localStorage.setItem(`calendarVisibility:${user._id}`, JSON.stringify([...ids]));
    } catch {
      // Ignore storage errors
    }
  }, [user]);

  // Load groups from localStorage (frontend-only for now, can be moved to backend later)
  const loadGroups = useCallback(() => {
    if (!user || !user._id) return [];
    try {
      const raw = localStorage.getItem(`calendarGroups:${user._id}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, [user]);

  // Save groups to localStorage
  const saveGroups = useCallback((groupsData) => {
    if (!user || !user._id) return;
    try {
      localStorage.setItem(`calendarGroups:${user._id}`, JSON.stringify(groupsData));
    } catch {
      // Ignore storage errors
    }
  }, [user]);

  // Initialize visibility when calendars are loaded
  useEffect(() => {
    if (calendars.length > 0 || sharedCalendars.length > 0) {
      const savedVisibility = loadVisibilityPreferences();
      if (savedVisibility && savedVisibility.size > 0) {
        setVisibleCalendarIds(savedVisibility);
      } else {
        // Default: all calendars visible
        const allIds = new Set([
          ...calendars.map(c => c._id),
          ...sharedCalendars.map(c => c._id)
        ]);
        setVisibleCalendarIds(allIds);
      }
    }
  }, [calendars, sharedCalendars, loadVisibilityPreferences]);

  // Load groups on mount
  useEffect(() => {
    if (user) {
      setGroups(loadGroups());
    }
  }, [user, loadGroups]);

  // Toggle calendar visibility
  const toggleCalendarVisibility = useCallback((calendarId) => {
    setVisibleCalendarIds(prev => {
      const next = new Set(prev);
      if (next.has(calendarId)) {
        next.delete(calendarId);
      } else {
        next.add(calendarId);
      }
      saveVisibilityPreferences(next);
      return next;
    });
  }, [saveVisibilityPreferences]);

  // Set multiple calendars visible/hidden (for groups)
  const setCalendarsVisible = useCallback((calendarIds, visible) => {
    setVisibleCalendarIds(prev => {
      const next = new Set(prev);
      for (const id of calendarIds) {
        if (visible) {
          next.add(id);
        } else {
          next.delete(id);
        }
      }
      saveVisibilityPreferences(next);
      return next;
    });
  }, [saveVisibilityPreferences]);

  // Check if calendar is visible
  const isCalendarVisible = useCallback((calendarId) => {
    return visibleCalendarIds.has(calendarId);
  }, [visibleCalendarIds]);

  // Group management functions
  const addGroup = useCallback((groupData) => {
    const newGroup = {
      id: Date.now().toString(),
      name: groupData.name,
      color: groupData.color || '#8b5cf6',
      calendarIds: groupData.calendarIds || [],
      createdAt: new Date().toISOString()
    };
    const updatedGroups = [...groups, newGroup];
    setGroups(updatedGroups);
    saveGroups(updatedGroups);
    return newGroup;
  }, [groups, saveGroups]);

  const updateGroup = useCallback((groupId, updates) => {
    const updatedGroups = groups.map(g =>
      g.id === groupId ? { ...g, ...updates } : g
    );
    setGroups(updatedGroups);
    saveGroups(updatedGroups);
  }, [groups, saveGroups]);

  const deleteGroup = useCallback((groupId) => {
    const updatedGroups = groups.filter(g => g.id !== groupId);
    setGroups(updatedGroups);
    saveGroups(updatedGroups);
  }, [groups, saveGroups]);

  // Toggle all calendars in a group
  const toggleGroupVisibility = useCallback((groupId) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    // Check if all calendars in group are currently visible
    const allVisible = group.calendarIds.every(id => visibleCalendarIds.has(id));

    // If all visible, hide all. Otherwise, show all.
    setCalendarsVisible(group.calendarIds, !allVisible);
  }, [groups, visibleCalendarIds, setCalendarsVisible]);

  // Check if all calendars in a group are visible
  const isGroupVisible = useCallback((groupId) => {
    const group = groups.find(g => g.id === groupId);
    if (!group || group.calendarIds.length === 0) return false;
    return group.calendarIds.every(id => visibleCalendarIds.has(id));
  }, [groups, visibleCalendarIds]);

  // Check if some (but not all) calendars in a group are visible
  const isGroupPartiallyVisible = useCallback((groupId) => {
    const group = groups.find(g => g.id === groupId);
    if (!group || group.calendarIds.length === 0) return false;
    const visibleCount = group.calendarIds.filter(id => visibleCalendarIds.has(id)).length;
    return visibleCount > 0 && visibleCount < group.calendarIds.length;
  }, [groups, visibleCalendarIds]);

  const loadColorPreferences = useCallback(() => {
    if (!user || !user._id) return {};
    try {
      const raw = localStorage.getItem(`calendarColors:${user._id}`);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }, [user]);

  const saveColorPreferences = useCallback((prefs) => {
    if (!user || !user._id) return;
    try {
      localStorage.setItem(`calendarColors:${user._id}`, JSON.stringify(prefs));
    } catch (e) {
      const _ = e;
      return;
    }
  }, [user]);

  const hslToHex = useCallback((h, s, l) => {
    const sNorm = s / 100;
    const lNorm = l / 100;
    const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = lNorm - c / 2;
    let r = 0;
    let g = 0;
    let b = 0;
    if (h >= 0 && h < 60) {
      r = c;
      g = x;
    } else if (h >= 60 && h < 120) {
      r = x;
      g = c;
    } else if (h >= 120 && h < 180) {
      g = c;
      b = x;
    } else if (h >= 180 && h < 240) {
      g = x;
      b = c;
    } else if (h >= 240 && h < 300) {
      r = x;
      b = c;
    } else {
      r = c;
      b = x;
    }
    const toHex = (v) => {
      const hex = Math.round((v + m) * 255).toString(16).padStart(2, '0');
      return hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }, []);

  const assignColors = useCallback((own, shared) => {
    if (!user || !user._id) {
      return { calendars: own, sharedCalendars: shared };
    }
    const prefs = loadColorPreferences();
    const all = [...own, ...shared];
    const used = new Set(Object.values(prefs));
    let index = all.length;
    for (const cal of all) {
      if (!prefs[cal._id]) {
        let color = '';
        let attempts = 0;
        while (attempts < 720) {
          const hue = (index * 137.508) % 360;
          const candidate = hslToHex(hue, 65, 55);
          index += 1;
          attempts += 1;
          if (!used.has(candidate)) {
            color = candidate;
            used.add(candidate);
            break;
          }
        }
        if (!color) {
          color = '#3b82f6';
        }
        prefs[cal._id] = color;
      }
    }
    saveColorPreferences(prefs);
    const mapWithColor = (cal) => ({
      ...cal,
      color: prefs[cal._id] || cal.color || '#3b82f6',
    });
    return {
      calendars: own.map(mapWithColor),
      sharedCalendars: shared.map(mapWithColor),
    };
  }, [hslToHex, loadColorPreferences, saveColorPreferences, user]);

  const fetchCalendars = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:5000/api/calendars', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        const sorted = [...data].sort((a, b) => {
          if (a.isDefault === b.isDefault) {
            return new Date(a.createdAt) - new Date(b.createdAt);
          }
          return a.isDefault ? -1 : 1;
        });
        // Use current shared calendars ref to assign colors to own calendars
        // This ensures own calendars get colors, but we DO NOT update shared calendars state here
        // to avoid race conditions overwriting fetchSharedCalendars results.
        const colored = assignColors(sorted, sharedCalendarsRef.current);
        setCalendars(colored.calendars);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [assignColors, token]);

  const addCalendar = async (calendarData) => {
    try {
      const res = await fetch('http://localhost:5000/api/calendars', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(calendarData),
      });
      const data = await res.json();
      if (res.ok) {
        const nextOwn = [...calendars, data];
        const colored = assignColors(nextOwn, sharedCalendarsRef.current);
        setCalendars(colored.calendars);
        setSharedCalendars(colored.sharedCalendars);
        // Auto-show new calendar
        setVisibleCalendarIds(prev => {
          const next = new Set(prev);
          next.add(data._id);
          saveVisibilityPreferences(next);
          return next;
        });
        return colored.calendars.find(c => c._id === data._id) || data;
      }
    } catch (error) {
      console.error(error);
    }
  };

  const updateCalendar = async (calendarId, updates) => {
    try {
      const res = await fetch(`http://localhost:5000/api/calendars/${calendarId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (res.ok) {
        setCalendars(prev => prev.map(c => c._id === calendarId ? { ...c, ...data } : c));
        return data;
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchEvents = async (calendarId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/calendars/${calendarId}/events`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setEvents(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCalendarEvents = useCallback(async (calendarId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/calendars/${calendarId}/events`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        return data;
      }
      return [];
    } catch (error) {
      console.error(error);
      return [];
    }
  }, [token]);

  const addEvent = async (calendarId, eventData) => {
    try {
      const res = await fetch(`http://localhost:5000/api/calendars/${calendarId}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(eventData),
      });
      const data = await res.json();
      if (res.ok) {
        setEvents(prev => [...prev, data]);
        if (dashboardEvents) {
          setDashboardEvents(prev => [...prev, data].sort((a, b) => compareAsc(new Date(a.start), new Date(b.start))));
        }
        return { success: true, event: data };
      }
      return { success: false, error: data.message || 'Failed to create event' };
    } catch (error) {
      console.error(error);
      return { success: false, error: 'Failed to create event' };
    }
    return { success: false, error: 'Failed to create event' };
  }


  const deleteCalendar = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/calendars/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setCalendars(prev => prev.filter(c => c._id !== id));
        setSharedCalendars(prev => prev.filter(c => c._id !== id));
      }
    } catch (error) { console.error(error); }
  };

  const updateEvent = async (calendarId, eventId, eventData) => {
    try {
      const res = await fetch(`http://localhost:5000/api/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(eventData),
      });
      const data = await res.json();
      if (res.ok) {
        setEvents(prev => prev.map(e => e._id === eventId ? data : e));
        // Also update cache if it exists
        if (dashboardEvents) {
          setDashboardEvents(prev => prev.map(e => e._id === eventId ? { ...e, ...data } : e));
        }
        return { success: true, event: data };
      }
      return { success: false, error: data.message };
    } catch (error) {
      console.error(error);
      return { success: false, error: 'Failed to update event' };
    }
  };

  const deleteEvent = async (calendarId, eventId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        setEvents(prev => prev.filter(e => e._id !== eventId));
        if (dashboardEvents) {
          setDashboardEvents(prev => prev.filter(e => e._id !== eventId));
        }
        return { success: true };
      }
      const data = await res.json();
      return { success: false, error: data.message || 'Failed to delete event' };
    } catch (error) {
      console.error(error);
      return { success: false, error: 'Failed to delete event' };
    }
  };

  const fetchSharedCalendars = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:5000/api/shares', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        const shared = data.map(share => ({
          ...share.calendar,
          _id: share.calendar._id,
          role: share.role,
          owner: share.calendar.user,
          isShared: true,
        }));
        // Use current own calendars ref to assign colors to shared calendars
        // but DO NOT update own calendars state here.
        const colored = assignColors(calendarsRef.current, shared);
        setSharedCalendars(colored.sharedCalendars);
        return colored.sharedCalendars;
      }
      setSharedCalendars([]);
      return [];
    } catch (error) {
      console.error(error);
      setSharedCalendars([]);
      return [];
    }
  }, [assignColors, token]);

  // Notification Logic moved to Context
  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:5000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.isRead).length);
      }
    } catch (error) {
      console.error(error);
    }
  }, [token]);

  const markAsRead = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) { console.error(error); }
  };

  const deleteNotification = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const removed = notifications.find(n => n._id === id);
        setNotifications(notifications.filter(n => n._id !== id));
        if (removed && !removed.isRead) setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) { console.error(error); }
  };

  const clearNotifications = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/notifications', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) { console.error(error); }
  };

  // Tasks Logic
  const fetchTasks = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:5000/api/tasks', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setTasks(data);
    } catch (error) {
      console.error(error);
    }
  }, [token]);

  const addTask = async (text) => {
    try {
      const res = await fetch('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (res.ok) {
        setTasks(prev => [data, ...prev]);
        fetchNotifications();
      }
    } catch (error) { console.error(error); }
  };

  const toggleTask = async (id, completed) => {
    // Optimistic
    setTasks(prev => prev.map(t => t._id === id ? { ...t, completed: !completed } : t));
    try {
      await fetch(`http://localhost:5000/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ completed: !completed }),
      });
    } catch (error) { console.error(error); }
  };

  const deleteTask = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/tasks/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(prev => prev.filter(t => t._id !== id));
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    if (token) {
      const loadAll = async () => {
        setLoading(true);
        await Promise.all([
          fetchCalendars(),
          fetchSharedCalendars(),
          fetchTasks(),
          fetchNotifications()
        ]);
        setLoading(false);
      };
      loadAll();

      // Poll for notifications every 30 seconds
      const notificationInterval = setInterval(() => {
        fetchNotifications();
      }, 30000);

      // Poll for tasks every 30 seconds (keep in sync or separate, might as well update both if "realtime")
      // User asked specifically for notifications, but tasks might be good too. 
      // Let's stick to notifications first as requested.

      return () => clearInterval(notificationInterval);
    }
  }, [token, fetchCalendars, fetchSharedCalendars, fetchTasks, fetchNotifications]);

  const shareCalendar = async (calendarId, email, role) => {
    try {
      const res = await fetch('http://localhost:5000/api/shares', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ calendarId, email, role })
      });
      return await res.json();
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const removeShare = async (shareId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/shares/${shareId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSharedCalendars(prev => prev.filter(s => s.shareId !== shareId));
      }
    } catch (error) { console.error(error); }
  };

  // Memoized context value for performance
  const contextValue = useMemo(() => ({
    calendars,
    sharedCalendars,
    events,
    loading,
    groups,
    visibleCalendarIds,
    selectedDate, setSelectedDate,
    // Calendar CRUD
    addCalendar,
    fetchCalendars,
    fetchEvents,
    fetchCalendarEvents,
    addEvent,
    deleteEvent,
    fetchSharedCalendars,
    shareCalendar,
    // Visibility
    toggleCalendarVisibility,
    setCalendarsVisible,
    isCalendarVisible,
    // Groups
    addGroup,
    updateGroup,
    deleteGroup,
    toggleGroupVisibility,
    isGroupVisible,
    isGroupPartiallyVisible,
    // Tasks
    tasks, addTask, toggleTask, deleteTask,
    // Cache
    dashboardEvents, setDashboardEvents,
    // Search
    searchQuery, setSearchQuery,
    // Extra
    deleteCalendar, removeShare, updateEvent, updateCalendar,
    // Notifications
    notifications, unreadCount, fetchNotifications, markAsRead, deleteNotification, clearNotifications
  }), [
    calendars, sharedCalendars, events, loading, groups, visibleCalendarIds,
    fetchCalendars, fetchCalendarEvents, fetchSharedCalendars,
    toggleCalendarVisibility, setCalendarsVisible, isCalendarVisible,
    addGroup, updateGroup, deleteGroup, toggleGroupVisibility, isGroupVisible, isGroupPartiallyVisible,
    tasks, dashboardEvents, notifications, unreadCount,
    selectedDate, // Add selectedDate to dependency array
    searchQuery
  ]);

  return (
    <CalendarContext.Provider value={contextValue}>
      {children}
    </CalendarContext.Provider>
  );
};

export const useCalendar = () => useContext(CalendarContext);
