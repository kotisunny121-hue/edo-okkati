import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { RoleBadge } from '../components/common/RoleBadge.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { User, Lock, Phone, Mail, Shield, CheckCircle, AlertCircle } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, refresh } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  if (!user) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    try {
      setSavingProfile(true);
      await api.put('/auth/profile', { name, phone });
      setProfileSuccess('Profile information updated.');
      refresh();
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);
    try {
      setSavingPassword(true);
      await api.put('/auth/change-password', { currentPassword, newPassword });
      setPasswordSuccess('Password successfully changed.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900">Account & Security</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your personal details and authentication credentials.
        </p>
      </div>

      <div className="space-y-6">
        {/* Role & Identification Card */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase text-slate-400">Assigned Platform Role</span>
            <div className="flex items-center gap-2">
              <RoleBadge role={user.role} />
              <StatusBadge status={user.status} />
            </div>
            <p className="text-xs text-slate-500 pt-1">
              Account ID: <span className="font-mono text-slate-700">{user.id}</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
            <User className="w-6 h-6" />
          </div>
        </div>

        {/* Update Profile Form */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs text-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-4">Contact Information</h2>

          {profileError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          {profileSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-orange-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Email Address (Read-only)</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-3 py-2 border border-slate-200 rounded bg-slate-100 text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Emergency Contact Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded"
            >
              {savingProfile ? 'Saving...' : 'Update Information'}
            </button>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs text-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-4">Security & Password</h2>

          {passwordError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          {passwordSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-orange-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">New Password (Min 6 chars)</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-orange-500 focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={savingPassword}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded"
            >
              {savingPassword ? 'Updating...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
