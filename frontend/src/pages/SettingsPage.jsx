import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Bell, Shield, Loader2, Check, X } from 'lucide-react';
import GlassPanel from '../components/UI/GlassPanel';
import { motion, AnimatePresence } from 'framer-motion';

const SettingsPage = () => {
  const { user, token } = useAuth();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  // Fetch user preferences on load
  useEffect(() => {
    const fetchPreferences = async () => {
      if (!token) return;
      try {
        const res = await fetch('http://localhost:5000/api/users/preferences', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setEmailNotifications(data.emailNotifications ?? true);
        }
      } catch (error) {
        console.error('Failed to fetch preferences:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPreferences();
  }, [token]);

  const handleSave = async () => {
    setSaving(true);
    setStatus({ type: '', message: '' });

    try {
      const res = await fetch('http://localhost:5000/api/users/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ emailNotifications }),
      });

      if (res.ok) {
        setStatus({ type: 'success', message: 'Preferences saved successfully!' });
        setTimeout(() => setStatus({ type: '', message: '' }), 3000);
      } else {
        const data = await res.json();
        setStatus({ type: 'error', message: data.message || 'Failed to save preferences' });
      }
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', message: 'Failed to save preferences' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">Manage your account and preferences</p>
        </div>

        {/* Profile Section */}
        <GlassPanel className="p-0 border border-white/10 bg-dark-bg/60 backdrop-blur-xl overflow-hidden">
          <div className="p-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-xl">
                <User className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Profile</h3>
                <p className="text-sm text-gray-500">Your personal information</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <User className="w-4 h-4" /> Name
              </label>
              <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white">
                {user?.name || 'Not set'}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <Mail className="w-4 h-4" /> Email
              </label>
              <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white">
                {user?.email || 'Not set'}
              </div>
            </div>
          </div>
        </GlassPanel>

        {/* Preferences Section */}
        <GlassPanel className="p-0 border border-white/10 bg-dark-bg/60 backdrop-blur-xl overflow-hidden">
          <div className="p-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl">
                <Shield className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Preferences</h3>
                <p className="text-sm text-gray-500">Manage your app settings</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Email Notifications Toggle */}
                <div
                  className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-colors cursor-pointer"
                  onClick={() => setEmailNotifications(!emailNotifications)}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg transition-colors ${emailNotifications
                        ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20'
                        : 'bg-white/5'
                      }`}>
                      <Bell className={`w-5 h-5 transition-colors ${emailNotifications ? 'text-amber-400' : 'text-gray-500'
                        }`} />
                    </div>
                    <div>
                      <h4 className="text-white font-medium">Email Notifications</h4>
                      <p className="text-sm text-gray-500 mt-0.5">
                        Receive emails when events are created or deleted in your calendars
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${emailNotifications
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30'
                        : 'bg-white/10'
                      }`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 ${emailNotifications ? 'left-7' : 'left-1'
                      }`} />
                  </button>
                </div>

                {/* Status Message */}
                <AnimatePresence>
                  {status.message && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`p-3 rounded-xl text-sm flex items-center gap-2 ${status.type === 'success'
                          ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                          : 'bg-red-500/10 border border-red-500/20 text-red-400'
                        }`}
                    >
                      {status.type === 'success' ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                      {status.message}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="px-6 py-4 bg-white/5 border-t border-white/5 flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </GlassPanel>
      </motion.div>
    </div>
  );
};

export default SettingsPage;
