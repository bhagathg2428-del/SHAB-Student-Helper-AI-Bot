import React, { useState } from 'react';
import {
  Settings,
  User,
  Lock,
  Globe,
  Sun,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogOut,
  GraduationCap,
  Sparkles,
  Zap,
  Sliders,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { SupportedLanguage } from '../types';

export const SettingsPage: React.FC = () => {
  const { user, refreshUser, language, setLanguage, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'security'>('profile');

  // Profile fields
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [college, setCollege] = useState(() => localStorage.getItem('shab_college') || 'JNTU Hyderabad / Osmania');
  const [branch, setBranch] = useState(() => localStorage.getItem('shab_branch') || 'Computer Science & Engineering');
  const [semester, setSemester] = useState(() => localStorage.getItem('shab_semester') || 'Semester 6 (Year 3)');

  const [aiSpeed, setAiSpeed] = useState<'fast' | 'balanced' | 'deep'>(() => {
    return (localStorage.getItem('shab_ai_speed') as any) || 'balanced';
  });

  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    if (!fullName.trim()) {
      setProfileMsg({ type: 'error', text: 'Full name cannot be blank.' });
      return;
    }

    setProfileLoading(true);
    try {
      await api.updateProfile({ full_name: fullName.trim() });
      await refreshUser();
      localStorage.setItem('shab_college', college);
      localStorage.setItem('shab_branch', branch);
      localStorage.setItem('shab_semester', semester);
      setProfileMsg({ type: 'success', text: 'Profile information saved successfully!' });
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSavePreferences = () => {
    localStorage.setItem('shab_ai_speed', aiSpeed);
    setProfileMsg({ type: 'success', text: 'Preferences updated!' });
    setTimeout(() => setProfileMsg(null), 2500);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (!currentPassword) {
      setPasswordMsg({ type: 'error', text: 'Please enter your current password.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setPasswordLoading(true);
    try {
      await api.updateProfile({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordMsg({ type: 'success', text: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Failed to change password.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const initials = (user?.full_name || 'Student')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-4xl mx-auto bg-[#F8FAFC]">
      {/* Title */}
      <div className="bg-white p-6 rounded-3xl border border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
              Settings & Student Profile
            </h1>
            <p className="text-sm text-[#64748B] mt-0.5 font-medium">
              Manage your academic preferences, profile details, and account security.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center p-1 rounded-full bg-slate-100 border border-slate-200 self-start sm:self-auto">
          {[
            { id: 'profile', label: 'Profile' },
            { id: 'preferences', label: 'Preferences' },
            { id: 'security', label: 'Security' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id as any);
                setProfileMsg(null);
                setPasswordMsg(null);
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white text-[#2563EB] shadow-sm'
                  : 'text-slate-600 hover:text-[#0F172A]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {profileMsg && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-2.5 text-xs font-medium ${
            profileMsg.type === 'success'
              ? 'bg-emerald-50 text-[#16A34A] border border-emerald-200'
              : 'bg-red-50 text-[#DC2626] border border-red-200'
          }`}
        >
          {profileMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
          )}
          <span>{profileMsg.text}</span>
        </div>
      )}

      {/* TAB 1: PROFILE SECTION */}
      {activeTab === 'profile' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm space-y-6">
          {/* Avatar with blue circle */}
          <div className="flex items-center gap-5 pb-6 border-b border-[#E2E8F0]">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 p-1 shadow-lg shadow-blue-500/25">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-xl font-black text-[#2563EB]">
                  {initials}
                </div>
              </div>
              <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#16A34A] border-2 border-white flex items-center justify-center shadow-sm" />
            </div>

            <div>
              <div className="text-lg font-bold text-[#0F172A]">{user?.full_name || 'Student User'}</div>
              <div className="text-xs font-mono text-[#64748B]">{user?.email}</div>
              <span className="inline-block mt-2 px-3 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[#2563EB] text-[11px] font-bold">
                Undergraduate Scholar
              </span>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-2 uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-[#E2E8F0] text-[#0F172A] text-sm focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 focus:outline-none shadow-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-2 uppercase tracking-wider">
                  Registered Email
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-4 py-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] text-sm cursor-not-allowed font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-2 uppercase tracking-wider">
                  College / University
                </label>
                <input
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="e.g. JNTU Hyderabad / Osmania University"
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-[#E2E8F0] text-[#0F172A] text-sm focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 focus:outline-none shadow-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-2 uppercase tracking-wider">
                  Branch / Major
                </label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="e.g. Computer Science & Engineering (CSE)"
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-[#E2E8F0] text-[#0F172A] text-sm focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 focus:outline-none shadow-sm transition-all"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#0F172A] mb-2 uppercase tracking-wider">
                  Semester / Academic Year
                </label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-[#E2E8F0] text-[#0F172A] text-sm focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 focus:outline-none shadow-sm transition-all"
                >
                  <option value="Semester 1 (Year 1)">Semester 1 (Year 1)</option>
                  <option value="Semester 2 (Year 1)">Semester 2 (Year 1)</option>
                  <option value="Semester 3 (Year 2)">Semester 3 (Year 2)</option>
                  <option value="Semester 4 (Year 2)">Semester 4 (Year 2)</option>
                  <option value="Semester 5 (Year 3)">Semester 5 (Year 3)</option>
                  <option value="Semester 6 (Year 3)">Semester 6 (Year 3)</option>
                  <option value="Semester 7 (Year 4)">Semester 7 (Year 4)</option>
                  <option value="Semester 8 (Year 4)">Semester 8 (Year 4)</option>
                  <option value="Postgraduate / Masters">Postgraduate / Masters</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={profileLoading}
                className="px-6 py-3 rounded-full text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md shadow-blue-500/25 transition-all cursor-pointer hover:-translate-y-0.5"
              >
                {profileLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: PREFERENCES */}
      {activeTab === 'preferences' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm space-y-6">
          {/* Language Selector */}
          <div>
            <label className="block text-xs font-bold text-[#1D4ED8] mb-3 uppercase tracking-wider">
              Default AI Study Language
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { code: 'en' as SupportedLanguage, label: 'English', desc: 'Standard academic curriculum' },
                { code: 'te' as SupportedLanguage, label: 'Telugu (తెలుగు)', desc: 'స్పష్టమైన వివరణలు' },
                { code: 'hi' as SupportedLanguage, label: 'Hindi (हिन्दी)', desc: 'सरल व्याख्या' },
              ].map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLanguage(l.code)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer shadow-sm ${
                    language === l.code
                      ? 'bg-[#EFF6FF] border-[#2563EB] text-[#2563EB] font-bold shadow-blue-500/10'
                      : 'bg-white border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFF]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#0F172A]">{l.label}</span>
                    {language === l.code && <CheckCircle2 className="w-4 h-4 text-[#2563EB]" />}
                  </div>
                  <div className="text-[11px] text-[#64748B] mt-1">{l.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Theme Display (Locked to Blue + White) */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-[#1D4ED8] mb-3 uppercase tracking-wider">
              Theme (Locked)
            </label>
            <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/50 to-white border border-blue-200 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-[#0F172A]">
                  <Sun className="w-4 h-4 text-[#2563EB]" />
                  <span>Premium Blue + White Theme</span>
                </div>
                <p className="text-xs text-[#64748B] mt-1">
                  Engineered for maximum readability, clean high-contrast study cards, and minimal eye strain.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-blue-100 text-[#2563EB] text-xs font-bold uppercase tracking-wider">
                Active
              </span>
            </div>
          </div>

          {/* AI Response Speed */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-[#1D4ED8] mb-3 uppercase tracking-wider">
              AI Response Speed
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'fast', label: 'Instant (Fastest)', desc: 'Concise exam points & formulas' },
                { id: 'balanced', label: 'Balanced (Recommended)', desc: 'Optimal depth with citations' },
                { id: 'deep', label: 'Detailed (Deep Thinking)', desc: 'Complete 10-mark breakdowns' },
              ].map((speed) => (
                <button
                  key={speed.id}
                  type="button"
                  onClick={() => setAiSpeed(speed.id as any)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer shadow-sm ${
                    aiSpeed === speed.id
                      ? 'bg-[#EFF6FF] border-[#2563EB] text-[#2563EB] font-bold shadow-blue-500/10'
                      : 'bg-white border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFF]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0F172A]">{speed.label}</span>
                    {aiSpeed === speed.id && <Zap className="w-3.5 h-3.5 text-[#2563EB]" />}
                  </div>
                  <div className="text-[11px] text-[#64748B] mt-1">{speed.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3">
            <button
              type="button"
              onClick={handleSavePreferences}
              className="px-6 py-3 rounded-full text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md shadow-blue-500/25 transition-all cursor-pointer hover:-translate-y-0.5"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: SECURITY */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#E2E8F0]">
              <Lock className="w-4 h-4 text-[#2563EB]" />
              <h2 className="text-xs font-bold text-[#1D4ED8] uppercase tracking-wider">
                Change Password
              </h2>
            </div>

            {passwordMsg && (
              <div
                className={`p-4 rounded-2xl flex items-center gap-2.5 text-xs font-medium ${
                  passwordMsg.type === 'success'
                    ? 'bg-emerald-50 text-[#16A34A] border border-emerald-200'
                    : 'bg-red-50 text-[#DC2626] border border-red-200'
                }`}
              >
                {passwordMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
                )}
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1.5 uppercase tracking-wider">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E2E8F0] text-[#0F172A] text-sm focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 focus:outline-none shadow-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1.5 uppercase tracking-wider">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E2E8F0] text-[#0F172A] text-sm focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 focus:outline-none shadow-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1.5 uppercase tracking-wider">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E2E8F0] text-[#0F172A] text-sm focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 focus:outline-none shadow-sm transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md shadow-blue-500/25 transition-all cursor-pointer"
              >
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>

          {/* Session / Sign out */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A]">Sign Out of Session</h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Securely end your session and clear stored tokens on this device.
              </p>
            </div>

            <button
              type="button"
              onClick={logout}
              className="px-5 py-2.5 rounded-full bg-red-50 hover:bg-red-100 text-[#DC2626] border border-red-200 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
