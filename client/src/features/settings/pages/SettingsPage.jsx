import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import * as authApi from '@/services/authApi';
import PageHeader from '@/components/shared/PageHeader';
import { User, ShieldAlert, Sun, Moon, Monitor, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const SettingsPage = () => {
  const { user, setUser } = useAuth();
  const { theme, setTheme } = useTheme();

  // Profile Form State
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');
    setProfileLoading(true);

    try {
      const response = await authApi.updateProfile({ name: profileName, email: profileEmail });
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        setProfileSuccess('Profile details updated successfully');
      }
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to update profile details');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await authApi.updatePassword({ currentPassword, newPassword });
      if (response.success) {
        setPasswordSuccess('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-8 max-w-4xl mx-auto">
      <PageHeader
        title="Settings"
        description="Manage your account preferences, update login security, and choose theme styles."
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left sidebar nav links placeholder or summary card */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border/40 bg-card/45 p-5 shadow-sm backdrop-blur-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <div className="border-t border-border/20 pt-3 text-[11px] text-muted-foreground leading-relaxed">
              Workspace account managed on local developer desk database.
            </div>
          </div>

          {/* Theme card */}
          <div className="rounded-xl border border-border/40 bg-card/45 p-5 shadow-sm backdrop-blur-sm space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Visual Theme
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setTheme('light')}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border/30 hover:bg-muted/30 text-muted-foreground'
                }`}
              >
                <Sun className="h-4 w-4" />
                <span>Light</span>
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border/30 hover:bg-muted/30 text-muted-foreground'
                }`}
              >
                <Moon className="h-4 w-4" />
                <span>Dark</span>
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                  theme === 'system'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border/30 hover:bg-muted/30 text-muted-foreground'
                }`}
              >
                <Monitor className="h-4 w-4" />
                <span>System</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Settings Forms */}
        <div className="md:col-span-2 space-y-6">
          {/* Profile Form */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border/40 bg-card/45 p-6 shadow-sm backdrop-blur-sm space-y-4"
          >
            <div className="flex items-center gap-2 border-b border-border/20 pb-3">
              <User className="h-4.5 w-4.5 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Profile Details</h3>
            </div>

            {profileSuccess && (
              <div className="flex items-center gap-2 text-xs text-emerald-500 bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}
            {profileError && (
              <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/5 border border-destructive/10 rounded-lg p-3">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Full Name</label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-background/30 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus:border-primary/50 transition-all duration-150"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Email Address</label>
                <input
                  type="email"
                  required
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-background/30 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus:border-primary/50 transition-all duration-150"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/95 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {profileLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </motion.div>

          {/* Change Password Form */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-xl border border-border/40 bg-card/45 p-6 shadow-sm backdrop-blur-sm space-y-4"
          >
            <div className="flex items-center gap-2 border-b border-border/20 pb-3">
              <ShieldAlert className="h-4.5 w-4.5 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Change Password</h3>
            </div>

            {passwordSuccess && (
              <div className="flex items-center gap-2 text-xs text-emerald-500 bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}
            {passwordError && (
              <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/5 border border-destructive/10 rounded-lg p-3">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-background/30 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus:border-primary/50 transition-all duration-150"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-background/30 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus:border-primary/50 transition-all duration-150"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-background/30 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus:border-primary/50 transition-all duration-150"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/95 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {passwordLoading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
