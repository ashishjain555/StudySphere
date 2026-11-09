import React, { useState, useEffect, useRef } from 'react';
import { BrandLogo } from '../common/BrandLogo';
import {
  Search,
  MessageSquare,
  Upload,
  HelpCircle,
  Calendar,
  Menu,
  Bell,
  FileText,
  CheckCheck,
  Clock,
  ChevronRight,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DataStore } from '../../lib/dataStore';
import { TeacherNotification } from '../../types';

interface HeaderProps {
  onOpenSearch: () => void;
  onNavigate: (path: string) => void;
  onToggleMobileSidebar: () => void;
}

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Recently';
    const now = new Date();
    const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSecs < 60) return 'Just now';
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onNavigate,
  onToggleMobileSidebar,
}) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<TeacherNotification[]>(() => {
    const n = DataStore.getNotifications();
    return Array.isArray(n) ? n : [];
  });
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadNotifs = () => {
      const n = DataStore.getNotifications();
      setNotifications(Array.isArray(n) ? n : []);
    };
    loadNotifs();

    window.addEventListener('studysphere:notification', loadNotifs);
    window.addEventListener('studysphere:notification_update', loadNotifs);
    window.addEventListener('storage', loadNotifs);

    return () => {
      window.removeEventListener('studysphere:notification', loadNotifs);
      window.removeEventListener('studysphere:notification_update', loadNotifs);
      window.removeEventListener('storage', loadNotifs);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsNotifOpen(false);
      }
    };

    if (isNotifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isNotifOpen]);

  const safeNotifs = Array.isArray(notifications) ? notifications : [];
  const unreadCount = safeNotifs.filter((n) => n && !n.isRead).length;

  const handleMarkAllRead = () => {
    DataStore.markAllNotificationsAsRead();
  };

  const handleNotificationClick = (notif: TeacherNotification) => {
    DataStore.markNotificationAsRead(notif.id);
    if (notif.materialId) {
      try {
        sessionStorage.setItem('studysphere_highlight_material', notif.materialId);
      } catch {}
    }
    setIsNotifOpen(false);
    onNavigate('/app/materials');
  };

  return (
    <header className="sticky top-0 z-30 h-20 glass-panel bg-gray-950/80 border-b border-gray-800/80 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between gap-4">
      {/* Left: Mobile Toggle + Search Bar */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-300 hover:text-white shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div onClick={() => onNavigate('/app/dashboard')} className="lg:hidden flex items-center gap-2 cursor-pointer shrink-0">
          <BrandLogo size="sm" />
        </div>

        {/* Global Search Bar */}
        <div
          onClick={onOpenSearch}
          className="w-full py-2.5 px-4 rounded-xl bg-gray-900/80 border border-gray-800 hover:border-gray-700 cursor-pointer flex items-center justify-between text-xs text-gray-400 transition-all shadow-inner group"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-gray-400 group-hover:text-blue-400 transition-colors" />
            <span className="hidden sm:inline">Search notes, subjects, topics, PDFs...</span>
            <span className="sm:hidden">Search workspace...</span>
          </div>
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono bg-gray-800 border border-gray-700 rounded text-gray-400">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: Quick Action Buttons & Profile */}
      <div className="flex items-center gap-3">
        {/* Quick Actions (Desktop) */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => onNavigate('/app/ai-tutor')}
            className="px-3.5 py-2 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-400 font-medium text-xs flex items-center gap-1.5 transition-all"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Study Tutor
          </button>
          <button
            onClick={() => onNavigate('/app/pdf-analyzer')}
            className="px-3 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 font-medium text-xs flex items-center gap-1.5 transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload PDF
          </button>
          <button
            onClick={() => onNavigate('/app/quiz')}
            className="px-3 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 font-medium text-xs flex items-center gap-1.5 transition-all"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Start Quiz
          </button>
          <button
            onClick={() => onNavigate('/app/planner')}
            className="px-3 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 font-medium text-xs flex items-center gap-1.5 transition-all"
          >
            <Calendar className="w-3.5 h-3.5" />
            Plan Study
          </button>
        </div>

        {/* Notifications Icon & Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen((prev) => !prev)}
            aria-label="Teacher Notifications"
            title="Teacher Notifications & PDFs"
            className={`relative p-2.5 rounded-xl border transition-all cursor-pointer ${
              isNotifOpen
                ? 'bg-blue-600/20 border-blue-500/50 text-blue-400'
                : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200 hover:border-gray-700'
            }`}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <>
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-lg">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
                <span className="absolute -top-1 -right-1 h-4 w-4 animate-ping rounded-full bg-blue-400 opacity-40 pointer-events-none" />
              </>
            )}
          </button>

          {/* Notifications Dropdown Window */}
          {isNotifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl bg-gray-950/95 border border-gray-800 shadow-2xl backdrop-blur-2xl z-50 overflow-hidden animate-fadeIn">
              {/* Dropdown Header */}
              <div className="p-3.5 sm:p-4 border-b border-gray-800/80 flex items-center justify-between bg-gray-900/60">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-200">Teacher Announcements</h3>
                    <p className="text-[10px] text-gray-400">PDF uploads & study updates</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors px-2 py-1 rounded-md hover:bg-blue-500/10 cursor-pointer"
                      title="Mark all as read"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark read
                    </button>
                  )}
                  <button
                    onClick={() => setIsNotifOpen(false)}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800/60 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Notification List */}
              <div className="max-h-80 sm:max-h-96 overflow-y-auto divide-y divide-gray-800/60">
                {safeNotifs.length > 0 ? (
                  safeNotifs.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-3.5 transition-all cursor-pointer hover:bg-gray-900/80 flex items-start gap-3 relative group ${
                        !notif.isRead ? 'bg-blue-950/20' : 'bg-transparent'
                      }`}
                    >
                      {/* Unread indicator */}
                      {!notif.isRead && (
                        <div className="absolute left-1.5 top-5 w-1.5 h-1.5 rounded-full bg-blue-500" />
                      )}

                      {/* PDF / File Icon */}
                      <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0 mt-0.5 group-hover:bg-blue-500/20 transition-colors">
                        <FileText className="w-4 h-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 truncate max-w-[140px]">
                            {notif.subjectName}
                          </span>
                          <span className="text-[10px] text-gray-400 flex items-center gap-1 shrink-0">
                            <Clock className="w-3 h-3" />
                            {formatRelativeTime(notif.createdAt)}
                          </span>
                        </div>

                        <h4 className="text-xs font-semibold text-gray-200 line-clamp-1 group-hover:text-blue-300 transition-colors">
                          {notif.title}
                        </h4>

                        <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                          {notif.description}
                        </p>

                        <div className="pt-1 flex items-center justify-between text-[10px] text-gray-400">
                          <span className="text-emerald-400 font-medium">
                            By {notif.uploaderName || 'Faculty'}
                          </span>
                          <span className="text-gray-400 font-mono">
                            {notif.fileSize || 'PDF Document'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center space-y-2">
                    <div className="w-10 h-10 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-400 mx-auto">
                      <Bell className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-medium text-gray-300">No notifications yet</p>
                    <p className="text-[11px] text-gray-400 max-w-[220px] mx-auto">
                      Whenever your teachers upload new PDFs, notes or study guides, you'll see notices here.
                    </p>
                  </div>
                )}
              </div>

              {/* Dropdown Footer */}
              <div className="p-3 border-t border-gray-800/80 bg-gray-900/60 flex items-center justify-between text-xs">
                <span className="text-[11px] text-gray-400">
                  {safeNotifs.length} {safeNotifs.length === 1 ? 'notice' : 'notices'}
                </span>
                <button
                  onClick={() => {
                    setIsNotifOpen(false);
                    onNavigate('/app/materials');
                  }}
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 transition-colors cursor-pointer"
                >
                  View All Materials
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar Pill */}
        <button
          onClick={() => onNavigate('/app/profile')}
          className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-gray-900/80 hover:bg-gray-800 border border-gray-800 hover:border-blue-500/50 transition-all cursor-pointer group"
          title="My Profile & Settings"
        >
          <img
            src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
            alt={user?.fullName || 'User'}
            className="w-7 h-7 rounded-lg object-cover border border-gray-700 group-hover:border-blue-400 transition-colors"
          />
          <span className="hidden sm:inline text-xs font-semibold text-gray-200 group-hover:text-blue-400 transition-colors max-w-[100px] truncate">
            {user?.fullName?.split(' ')[0] || 'Profile'}
          </span>
        </button>

        {/* Mobile Quick Study Tutor Icon */}
        <button
          onClick={() => onNavigate('/app/ai-tutor')}
          className="md:hidden p-2.5 rounded-xl bg-blue-600 text-white border border-blue-500"
        >
          <MessageSquare className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
