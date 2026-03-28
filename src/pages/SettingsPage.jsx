import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Shield, Clock, Bell, ChevronRight, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getProfile, updateSettings, updateProfile } from '@/lib/supabase';

export default function SettingsPage() {
  const { user, signOut, updatePassword } = useAuth();
  const [profile, setProfile] = useState(null);
  const [settings, setSettings] = useState({
    recording_duration: 30,
    auto_stop: true,
    notifications_enabled: false,
    theme: 'dark',
  });
  const [saving, setSaving] = useState(false);
  const [displayNameDraft, setDisplayNameDraft] = useState('');
  const [nameSaving, setNameSaving] = useState(false);

  // Password change states
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        const p = await getProfile(user.id);
        setProfile(p);
        if (p?.settings) setSettings(p.settings);
        setDisplayNameDraft(p?.display_name || '');
      } catch (err) {
        console.error('Failed to load profile:', err);
      }
    }
    load();
  }, [user]);

  async function handleSaveDisplayName() {
    if (!user) return;
    const name = displayNameDraft.trim();
    setNameSaving(true);
    try {
      await updateProfile(user.id, { display_name: name || null });
      setProfile((prev) => (prev ? { ...prev, display_name: name || null } : prev));
    } catch (err) {
      console.error('Failed to save display name:', err);
    } finally {
      setNameSaving(false);
    }
  }

  async function handleUpdatePassword(e) {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmNewPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    setPasswordSaving(true);
    try {
      await updatePassword(newPassword);
      setPasswordSuccess('Password updated successfully!');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => setShowPasswordForm(false), 2000);
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password');
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleToggle(key) {
    const prev = { ...settings };
    const updated = { ...prev, [key]: !prev[key] };
    setSettings(updated);
    setSaving(true);
    try {
      await updateSettings(user.id, updated);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setSettings(prev);
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  }

  return (
    <div className="pt-8 pb-4 space-y-6">
      <h1 className="font-pageTitle font-semibold text-3xl md:text-4xl text-echo-text text-left tracking-tight">
        Account
      </h1>

      {/* Profile */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 bg-echo-surface border border-echo-border rounded-xl space-y-3"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-echo-accent/10 border border-echo-accent/20 flex items-center justify-center shrink-0">
            <User size={20} className="text-echo-accent" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-echo-text-dim text-xs mb-1">Display name</p>
            <input
              type="text"
              value={displayNameDraft}
              onChange={(e) => setDisplayNameDraft(e.target.value)}
              placeholder={user?.email?.split('@')[0] || 'Your name'}
              className="w-full bg-echo-card border border-echo-border rounded-lg px-3 py-2 text-echo-text text-sm placeholder:text-echo-text-dim focus:outline-none focus:ring-1 focus:ring-echo-accent"
            />
            <p className="text-echo-text-dim text-xs mt-2 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSaveDisplayName}
          disabled={nameSaving || displayNameDraft.trim() === (profile?.display_name || '').trim()}
          className="w-full py-2.5 rounded-xl text-sm font-medium bg-echo-accent text-white disabled:opacity-40 disabled:pointer-events-none"
        >
          {nameSaving ? 'Saving…' : 'Save name'}
        </button>
      </motion.div>

      {/* Recording Settings */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="space-y-1"
      >
        <p className="text-echo-text-dim text-xs uppercase tracking-wider px-1 mb-2">
          Recording
        </p>
        <div className="bg-echo-surface border border-echo-border rounded-xl divide-y divide-echo-border">
          <SettingRow
            icon={Clock}
            label="Auto-stop at 30 seconds"
            toggle
            value={settings.auto_stop}
            onChange={() => handleToggle('auto_stop')}
          />
          <SettingRow
            icon={Bell}
            label="Daily reminder"
            toggle
            value={settings.notifications_enabled}
            onChange={() => handleToggle('notifications_enabled')}
          />
        </div>
      </motion.div>

      {/* Privacy */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-1"
      >
        <p className="text-echo-text-dim text-xs uppercase tracking-wider px-1 mb-2">
          Privacy
        </p>
        <div className="bg-echo-surface border border-echo-border rounded-xl">
          <div className="p-4 flex items-start gap-3">
            <Shield size={18} className="text-echo-accent mt-0.5" />
            <div>
              <p className="text-echo-text text-sm font-medium">Your data stays yours</p>
              <p className="text-echo-text-muted text-xs mt-1 leading-relaxed">
                Audio is streamed for transcription but never stored on our servers.
                Only transcripts and acoustic features are saved.
                You can delete all your data at any time.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Account actions */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="space-y-3"
      >
        <p className="text-echo-text-dim text-xs uppercase tracking-wider px-1">
          Account
        </p>

        <div className="bg-echo-surface border border-echo-border rounded-xl overflow-hidden">
          <button
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="w-full p-4 flex items-center justify-between text-echo-text hover:bg-echo-accent/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Shield size={18} className="text-echo-text-muted" />
              <span className="text-sm font-medium">Change Password</span>
            </div>
            <ChevronRight
              size={16}
              className={`text-echo-text-dim transition-transform duration-200 ${showPasswordForm ? 'rotate-90' : ''}`}
            />
          </button>

          <AnimatePresence>
            {showPasswordForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-4 pb-4 border-t border-echo-border"
              >
                <form onSubmit={handleUpdatePassword} className="pt-4 space-y-3">
                  <input
                    type="password"
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-echo-card border border-echo-border rounded-lg px-3 py-2 text-echo-text text-sm placeholder:text-echo-text-dim focus:outline-none focus:ring-1 focus:ring-echo-accent"
                    required
                    minLength={6}
                  />
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full bg-echo-card border border-echo-border rounded-lg px-3 py-2 text-echo-text text-sm placeholder:text-echo-text-dim focus:outline-none focus:ring-1 focus:ring-echo-accent"
                    required
                    minLength={6}
                  />

                  {passwordError && (
                    <p className="text-echo-red text-xs text-center">{passwordError}</p>
                  )}
                  {passwordSuccess && (
                    <p className="text-echo-accent text-xs text-center">{passwordSuccess}</p>
                  )}

                  <button
                    type="submit"
                    disabled={passwordSaving}
                    className="w-full py-2 rounded-lg text-sm font-medium bg-echo-accent text-white disabled:opacity-50"
                  >
                    {passwordSaving ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full p-4 bg-echo-surface border border-echo-border rounded-xl flex items-center gap-3 text-echo-red hover:bg-echo-red/5 transition-colors"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </motion.div>

      {/* Version */}
      <p className="text-center text-echo-text-dim text-[10px] pt-4">
        Echo Journal v1.0.0 · Build with Gemini 2026
      </p>
    </div>
  );
}

function SettingRow({ icon: Icon, label, toggle, value, onChange }) {
  return (
    <button
      onClick={onChange}
      className="w-full p-4 flex items-center justify-between hover:bg-echo-card/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <Icon size={18} className="text-echo-text-muted" />
        <span className="text-echo-text text-sm">{label}</span>
      </div>
      {toggle ? (
        <div
          className={`w-10 h-6 rounded-full transition-colors duration-200 flex items-center ${value ? 'bg-echo-accent justify-end' : 'bg-echo-border justify-start'
            }`}
        >
          <div className="w-5 h-5 rounded-full bg-white mx-0.5 shadow-sm transition-all" />
        </div>
      ) : (
        <ChevronRight size={16} className="text-echo-text-dim" />
      )}
    </button>
  );
}
