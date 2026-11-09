import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  MessageSquareHeart,
  Mail,
  Calendar,
  Sparkles,
  Inbox,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { DataStore } from '../../lib/dataStore';
import { UserFeedback } from '../../types';

interface FeedbackInboxModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackInboxModal: React.FC<FeedbackInboxModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [feedbacks, setFeedbacks] = useState<UserFeedback[]>(() => DataStore.getFeedbackList());
  const [isLoading, setIsLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');

  const loadFeedbacks = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch from server backend API
      const res = await fetch('/api/feedback');
      if (res.ok) {
        const data = await res.json();
        if (data.feedbacks && data.feedbacks.length > 0) {
          const serverList: UserFeedback[] = data.feedbacks.map((f: any) => ({
            id: f.id,
            rating: f.rating,
            category: f.category,
            message: f.message,
            email: f.email,
            createdAt: f.receivedAt || f.createdAt,
          }));
          setFeedbacks(serverList);
          setIsLoading(false);
          return;
        }
      }

      // 2. Fallback to Supabase sync
      const remote = await DataStore.syncFeedbacksFromSupabase();
      if (remote && remote.length > 0) {
        setFeedbacks(remote);
      }
    } catch (err) {
      console.warn('Feedback inbox fetch note:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadFeedbacks();
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const safeFeedbacks = Array.isArray(feedbacks) ? feedbacks : [];
  const totalCount = safeFeedbacks.length;
  const avgRating =
    totalCount > 0
      ? (safeFeedbacks.reduce((sum, f) => sum + (Number(f.rating) || 5), 0) / totalCount).toFixed(1)
      : '5.0';

  const filtered = safeFeedbacks.filter((f) => {
    if (!f) return false;
    if (filterCategory !== 'all' && f.category !== filterCategory) return false;
    if (filterRating !== 'all' && f.rating !== filterRating) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl glass-panel bg-slate-950/95 border border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 relative text-slate-100 animate-modalPop"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header with Title and Prominent High-Contrast Close Button */}
        <div className="sticky top-0 z-30 -mt-6 sm:-mt-8 -mx-6 sm:-mx-8 px-6 sm:px-8 py-4 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo size="md" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Student Feedback Inbox</h2>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {totalCount} Total
                </span>
              </div>
              <p className="text-[11px] text-slate-400">All student reviews, suggestions & ratings</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadFeedbacks}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 cursor-pointer transition-all active:scale-95 shrink-0"
              title="Refresh Feedback"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 shadow-lg cursor-pointer hover:scale-105 active:scale-95 transition-all shrink-0"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Average Rating</div>
            <div className="text-2xl font-black text-amber-400 flex items-center gap-1.5">
              <span>{avgRating}</span>
              <Star className="w-5 h-5 fill-amber-400 text-amber-400 inline" />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Total Received</div>
            <div className="text-2xl font-black text-white">{totalCount}</div>
          </div>

          <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Live Sync</div>
            <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 pt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Supabase & Server Active
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs py-1">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                filterCategory === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All Categories
            </button>
            <button
              onClick={() => setFilterCategory('ui')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                filterCategory === 'ui'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              🎨 UI
            </button>
            <button
              onClick={() => setFilterCategory('feature')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                filterCategory === 'feature'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              💡 Features
            </button>
            <button
              onClick={() => setFilterCategory('bug')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                filterCategory === 'bug'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              🐛 Bugs
            </button>
          </div>

          <div className="flex items-center gap-1 text-xs">
            <span className="text-[11px] text-slate-400">Rating:</span>
            {[5, 4, 3].map((r) => (
              <button
                key={r}
                onClick={() => setFilterRating(filterRating === r ? 'all' : r)}
                className={`px-2 py-1 rounded-lg border font-mono text-[11px] transition-all cursor-pointer ${
                  filterRating === r
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {r}★
              </button>
            ))}
          </div>
        </div>

        {/* Feedback List */}
        <div className="space-y-3 pt-1">
          {filtered.length > 0 ? (
            filtered.map((item) => {
              const dtStr = item.createdAt
                ? new Date(item.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Recently';

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all space-y-3 shadow-md"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < (item.rating || 5)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-300">
                        {item.rating || 5}/5 Stars
                      </span>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                        {item.category || 'general'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{dtStr}</span>
                    </div>
                  </div>

                  <p className="text-sm text-slate-200 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                    "{item.message}"
                  </p>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/60">
                    <span className="flex items-center gap-1.5 text-[11px] text-slate-400 truncate">
                      <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      Student: <strong className="text-slate-300 font-mono">{item.email || 'anonymous'}</strong>
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-slate-400 space-y-2 rounded-2xl bg-slate-900/40 border border-slate-800">
              <Inbox className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-sm font-semibold text-slate-300">No feedback matching this filter</p>
              <p className="text-xs text-slate-500">Student reviews and feedback will show up here in real time.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
