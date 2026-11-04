import React, { useState } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  FolderOpen,
  MessageSquare,
  FileText,
  HelpCircle,
  Calendar,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  LogOut,
  ChevronRight,
  GraduationCap,
  X,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { user, logout, switchRole } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  interface NavItem {
    label: string;
    path: string;
    icon: React.ComponentType<{ className?: string }>;
    color?: string;
    badge?: string;
  }

  const navItems: NavItem[] = [
    { label: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard },
    { label: 'My Subjects', path: '/app/subjects', icon: BookOpen },
    { label: 'Study Materials', path: '/app/materials', icon: FolderOpen },
    { label: 'Study Tutor', path: '/app/ai-tutor', icon: MessageSquare },
    { label: 'PDF Analyzer', path: '/app/pdf-analyzer', icon: FileText },
    { label: 'Quiz Generator', path: '/app/quiz', icon: HelpCircle },
    { label: 'Study Planner', path: '/app/planner', icon: Calendar },
    { label: 'Progress & Analytics', path: '/app/progress', icon: TrendingUp },
    { label: 'Weak Topics', path: '/app/weak-topics', icon: AlertTriangle, color: 'text-rose-400' },
    { label: 'My Profile', path: '/app/profile', icon: User },
  ];

  if (user?.role === 'teacher') {
    navItems.push({ label: 'Teacher Resource Hub', path: '/app/admin', icon: ShieldCheck, badge: 'Admin' });
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 glass-panel bg-gray-950/95 border-r border-gray-800 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="h-20 px-6 flex items-center justify-between border-b border-gray-800/80">
            <div
              onClick={() => {
                onNavigate('/app/dashboard');
                onCloseMobile();
              }}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-600 border border-blue-500/30 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-slate-100 text-base tracking-tight">StudySphere</span>
                <span className="block text-[9px] uppercase font-mono tracking-wider text-slate-400 font-semibold">
                  Workspace
                </span>
              </div>
            </div>

            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg hover:bg-gray-800 text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-220px)]">
            {navItems.map((item) => {
              const IconComp = item.icon;
              const isActive = currentPath === item.path || currentPath.startsWith(item.path + '/');
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    onNavigate(item.path);
                    onCloseMobile();
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all group ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-600/15 dark:border-blue-500/30 dark:text-blue-400 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <IconComp className={`w-4 h-4 ${item.color || (isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300')}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30 font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-gray-800/80 bg-gray-950/60">
          {/* Account Role Badge (No manual switch) */}
          <div className="mb-3 px-2.5 py-1.5 rounded-xl bg-gray-900/80 border border-gray-800 flex items-center justify-between text-xs">
            <span className="text-gray-400 font-medium text-[11px] flex items-center gap-1.5">
              {user?.role === 'teacher' ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Educator Account</span>
                </>
              ) : (
                <>
                  <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                  <span>Student Workspace</span>
                </>
              )}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-800 text-gray-400 uppercase font-semibold">
              {user?.role === 'teacher' ? 'Faculty' : 'Student'}
            </span>
          </div>

          {/* User Info & Logout */}
          <div className="flex items-center justify-between">
            <div
              onClick={() => {
                onNavigate('/app/profile');
                onCloseMobile();
              }}
              className="flex items-center gap-2.5 overflow-hidden cursor-pointer hover:opacity-85 transition-opacity group"
              title="View & Edit Profile"
            >
              <img
                src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={user?.fullName || 'User'}
                className="w-8 h-8 rounded-full border border-gray-700 group-hover:border-blue-500 object-cover shrink-0 transition-colors"
              />
              <div className="truncate">
                <div className="text-xs font-semibold text-gray-200 group-hover:text-blue-400 transition-colors truncate">{user?.fullName || 'User'}</div>
                <div className="text-[10px] text-gray-500 truncate">{user?.email || ''}</div>
              </div>
            </div>

            <button
              onClick={() => setShowLogoutConfirm(true)}
              title="Logout"
              className="p-1.5 rounded-lg hover:bg-rose-500/10 text-gray-400 hover:text-rose-400 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

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
                  onNavigate('/');
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold border border-rose-400/30 cursor-pointer transition-colors shadow-lg shadow-rose-950/40"
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
