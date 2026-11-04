import React, { useState } from 'react';
import {
  User,
  Mail,
  GraduationCap,
  School,
  BookOpen,
  Calendar,
  CheckCircle2,
  Save,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  Camera,
  ShieldCheck,
  Award,
  HelpCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DataStore } from '../lib/dataStore';
import { UserRole } from '../types';

interface ProfilePageProps {
  onNavigate?: (path: string) => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
];

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const { user, updateUserProfile, updatePassword, logout } = useAuth();

  // Profile Form State
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || AVATAR_PRESETS[0]);
  const [institution, setInstitution] = useState(user?.institution || '');
  const [major, setMajor] = useState(user?.major || '');
  const [semester, setSemester] = useState(user?.semester || '');
  const [targetGoal, setTargetGoal] = useState(user?.targetGoal || '');
  const [role, setRole] = useState<UserRole>(user?.role || 'student');

  // UI States
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // Security: Password Change State
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState<{ message: string; isError?: boolean } | null>(null);

  // Logout Modal State
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Platform Metrics
  const subjectsCount = DataStore.getSubjects().length;
  const quizzesCount = DataStore.getQuizAttempts().length;
  const tasksCount = DataStore.getTasks().length;
  const weakTopicsCount = DataStore.getWeakTopics().length;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSaveSuccess(false);

    if (!fullName.trim()) {
      setErrorMessage('Full name cannot be empty.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await updateUserProfile({
        fullName: fullName.trim(),
        avatarUrl,
        institution: institution.trim(),
        major: major.trim(),
        semester: semester.trim(),
        targetGoal: targetGoal.trim(),
        role,
      });

      if (res.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setErrorMessage(res.error || 'Failed to update profile.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unexpected error while saving profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordNotice(null);

    if (newPassword.length < 6) {
      setPasswordNotice({ message: 'Password must be at least 6 characters long.', isError: true });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordNotice({ message: 'Passwords do not match.', isError: true });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await updatePassword(newPassword, user?.email);
      if (res.success) {
        setPasswordNotice({ message: 'Password updated successfully! Next login will require your new password.', isError: false });
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setShowPasswordSection(false), 2500);
      } else {
        setPasswordNotice({ message: res.error || 'Failed to update password.', isError: true });
      }
    } catch (err: any) {
      setPasswordNotice({ message: err?.message || 'Password update failed.', isError: true });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const formattedJoinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Recently';

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto pb-12">
      {/* Page Title & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <User className="w-8 h-8 text-blue-500" />
            My Profile & Academic Identity
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage your personal credentials, university information, and study preferences.
          </p>
        </div>

        {saveSuccess && (
          <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4" />
            Profile updated successfully!
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Grid: Left Identity Card + Right Edit Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Identity Overview Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-3xl glass-panel bg-gray-950/80 border border-gray-800 text-center space-y-5 shadow-xl">
            {/* Avatar with Change Overlay */}
            <div className="relative inline-block mx-auto group">
              <img
                src={avatarUrl}
                alt={fullName || 'User'}
                className="w-28 h-28 rounded-3xl object-cover border-2 border-blue-500/40 shadow-xl mx-auto"
              />
              <button
                type="button"
                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                className="absolute -bottom-2 -right-2 p-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg border border-blue-400/40 transition-transform active:scale-95 cursor-pointer"
                title="Change Avatar"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Avatar Preset Selector Tray */}
            {showAvatarPicker && (
              <div className="p-3 bg-gray-900/90 rounded-2xl border border-gray-800 space-y-2 animate-fadeIn">
                <span className="text-[11px] font-semibold text-gray-400 block text-left">Choose avatar preset:</span>
                <div className="grid grid-cols-6 gap-2">
                  {AVATAR_PRESETS.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`Preset ${i}`}
                      onClick={() => {
                        setAvatarUrl(url);
                        setShowAvatarPicker(false);
                      }}
                      className={`w-9 h-9 rounded-xl object-cover cursor-pointer border-2 transition-all hover:scale-110 ${
                        avatarUrl === url ? 'border-blue-500 scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-lg font-bold text-white">{fullName || 'Student'}</h2>
              <p className="text-xs text-gray-400 truncate mt-0.5">{user?.email}</p>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-blue-600/15 text-blue-300 border border-blue-500/30 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                {role === 'teacher' ? 'Faculty / Educator' : 'Student Account'}
              </span>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Verified
              </span>
            </div>

            {/* Metadata Stats */}
            <div className="pt-4 border-t border-gray-800/80 text-left space-y-2.5 text-xs text-gray-300">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" /> Member Since
                </span>
                <span className="font-semibold text-gray-200">{formattedJoinDate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <School className="w-3.5 h-3.5 text-gray-400" /> College
                </span>
                <span className="font-semibold text-gray-200 truncate max-w-[150px]">
                  {institution || 'Not specified'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Learning Stats */}
          <div className="p-5 rounded-3xl glass-panel bg-gray-950/80 border border-gray-800 space-y-3.5 shadow-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Workspace Activity
            </h3>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-gray-900/60 border border-gray-800/80">
                <div className="text-xl font-extrabold text-blue-400">{subjectsCount}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">Enrolled Subjects</div>
              </div>
              <div className="p-3 rounded-2xl bg-gray-900/60 border border-gray-800/80">
                <div className="text-xl font-extrabold text-emerald-400">{quizzesCount}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">Quizzes Solved</div>
              </div>
              <div className="p-3 rounded-2xl bg-gray-900/60 border border-gray-800/80">
                <div className="text-xl font-extrabold text-indigo-400">{tasksCount}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">Study Tasks</div>
              </div>
              <div className="p-3 rounded-2xl bg-gray-900/60 border border-gray-800/80">
                <div className="text-xl font-extrabold text-rose-400">{weakTopicsCount}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">Weak Topics</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Profile Details & Security Settings */}
        <div className="lg:col-span-8 space-y-6">
          <form onSubmit={handleSaveProfile} className="p-6 sm:p-8 rounded-3xl glass-panel bg-gray-950/80 border border-gray-800 space-y-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800/80">
              <div>
                <h2 className="text-base font-bold text-white">General Information</h2>
                <p className="text-xs text-gray-400 mt-0.5">Update your personal and college details</p>
              </div>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs border border-blue-400/30 flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-600/20 disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                Save Profile
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="e.g. Ashish Jain"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 focus:border-blue-500 text-gray-100 text-sm focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Email Address (Read-only) */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Registered Email (Verified)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-900/50 border border-gray-800/60 text-gray-400 text-sm cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Institution / College */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  College / University
                </label>
                <div className="relative">
                  <School className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="e.g. Mumbai University / DTU"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 focus:border-blue-500 text-gray-100 text-sm focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Major / Department */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Major / Branch
                </label>
                <div className="relative">
                  <BookOpen className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    placeholder="e.g. Computer Science & Engineering"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 focus:border-blue-500 text-gray-100 text-sm focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Current Semester / Year */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Semester / Academic Year
                </label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    placeholder="e.g. Semester 6 / 3rd Year"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 focus:border-blue-500 text-gray-100 text-sm focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Academic Target Goal */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Primary Study Goal
                </label>
                <div className="relative">
                  <Award className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={targetGoal}
                    onChange={(e) => setTargetGoal(e.target.value)}
                    placeholder="e.g. 9.0+ CGPA / GATE / Placements"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 focus:border-blue-500 text-gray-100 text-sm focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </form>

          {/* Account Security & Password Management */}
          <div className="p-6 sm:p-8 rounded-3xl glass-panel bg-gray-950/80 border border-gray-800 space-y-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800/80">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400" />
                  Account Security
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Manage your password and active session safety</p>
              </div>

              <button
                type="button"
                onClick={() => setShowPasswordSection(!showPasswordSection)}
                className="px-3.5 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 text-xs font-semibold border border-gray-800 transition-colors cursor-pointer"
              >
                {showPasswordSection ? 'Cancel' : 'Change Password'}
              </button>
            </div>

            {/* Password Update Form */}
            {showPasswordSection && (
              <form onSubmit={handleUpdatePassword} className="space-y-4 pt-2 animate-fadeIn">
                {passwordNotice && (
                  <div
                    className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                      passwordNotice.isError
                        ? 'bg-rose-500/10 border border-rose-500/25 text-rose-300'
                        : 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400'
                    }`}
                  >
                    {passwordNotice.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                    <span>{passwordNotice.message}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                      New Password (Min 6 chars)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-gray-100 text-sm focus:border-blue-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-gray-100 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isUpdatingPassword ? 'Updating Password...' : 'Save New Password'}
                  </button>
                </div>
              </form>
            )}

            {/* Session Management & Safe Logout */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-gray-200">Active Workspace Session</h4>
                <p className="text-[11px] text-gray-400">
                  Signed in as <span className="text-gray-300 font-mono">{user?.email}</span>. Click below to sign out securely.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="px-4 py-2.5 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer self-start sm:self-auto"
              >
                <LogOut className="w-4 h-4" />
                Sign Out of Workspace
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md p-6 rounded-3xl glass-panel bg-gray-950 border border-rose-500/30 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30 shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Log Out of StudySphere?</h3>
                <p className="text-xs text-gray-400">Are you sure you want to end your session?</p>
              </div>
            </div>

            <p className="text-sm text-gray-300 bg-gray-900/60 p-3.5 rounded-2xl border border-gray-800 leading-relaxed">
              Are you sure you want to log out? You will be signed out of your account (<span className="text-white font-medium">{user?.email || 'current user'}</span>) and will need to log in again to access your workspace.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowLogoutConfirm(false);
                  await logout();
                  if (onNavigate) onNavigate('/');
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold border border-rose-400/30 cursor-pointer transition-colors shadow-lg shadow-rose-950/40"
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
