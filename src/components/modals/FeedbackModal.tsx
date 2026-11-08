import React, { useState, useEffect } from 'react';
import { X, Star, MessageSquareHeart, CheckCircle2, Send, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import { DataStore } from '../../lib/dataStore';
import { UserFeedback } from '../../types';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  { id: 'feature', label: '💡 Feature Request' },
  { id: 'bug', label: '🐛 Bug Report' },
  { id: 'ui', label: '🎨 UI & Design' },
  { id: 'ai', label: '🤖 AI Tutor Quality' },
  { id: 'general', label: '💬 General Feedback' },
];

const RATING_LABELS: Record<number, string> = {
  1: 'Needs Improvement 😕',
  2: 'Fair Experience 🙂',
  3: 'Good Platform 👍',
  4: 'Great Product! 🚀',
  5: 'Exceptional & Loved It! 🌟',
};

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [category, setCategory] = useState<string>('feature');
  const [message, setMessage] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || message.trim().length < 5) {
      setError('Please provide at least a few words so we understand your thoughts (min 5 characters).');
      return;
    }

    setError('');
    setIsSubmitting(true);

    const feedbackItem: UserFeedback = {
      id: `fb_${Date.now()}`,
      rating,
      category,
      message: message.trim(),
      email: email.trim() || user?.email || 'anonymous@student',
      createdAt: new Date().toISOString(),
    };

    DataStore.saveFeedback(feedbackItem);

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {}

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 400);
  };

  const handleResetAndClose = () => {
    setMessage('');
    setIsSubmitted(false);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className="w-full max-w-lg rounded-3xl glass-panel bg-slate-950/95 border border-slate-800 shadow-2xl p-6 sm:p-8 relative text-slate-100 animate-modalPop"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleResetAndClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-800"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {isSubmitted ? (
          /* Success View */
          <div className="text-center py-6 space-y-4 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-2xl font-bold text-white tracking-tight">Thank You! 🎉</h3>
              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                Your feedback has been recorded. Your suggestions help shape future updates and build a better learning platform for every student.
              </p>
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors cursor-pointer shadow-lg shadow-indigo-600/30"
              >
                Back to Workspace
              </button>
            </div>
          </div>
        ) : (
          /* Feedback Form View */
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 shrink-0">
                <MessageSquareHeart className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">Share Your Feedback</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Have an idea, spotted a bug, or want to share your experience?
                </p>
              </div>
            </div>

            {/* Star Rating */}
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
              <span className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                How would you rate your experience?
              </span>
              <div className="flex items-center justify-center gap-2 py-1">
                {[1, 2, 3, 4, 5].map((starVal) => {
                  const active = (hoverRating !== null ? hoverRating : rating) >= starVal;
                  return (
                    <button
                      key={starVal}
                      type="button"
                      onMouseEnter={() => setHoverRating(starVal)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => setRating(starVal)}
                      className="p-1 cursor-pointer transition-transform hover:scale-125 focus:outline-none"
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          active
                            ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                            : 'text-slate-600 hover:text-slate-400'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <span className="block text-xs font-medium text-amber-300 min-h-[1.2rem]">
                {RATING_LABELS[hoverRating !== null ? hoverRating : rating]}
              </span>
            </div>

            {/* Category Select Pills */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Feedback Category
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                      category === cat.id
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm shadow-indigo-600/30'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Feedback Message */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Your Thoughts or Suggestions <span className="text-rose-400">*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="What feature would make studying easier? Did you find any issue or something you loved?"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-slate-100 text-xs sm:text-sm focus:outline-none transition-all placeholder:text-slate-500 resize-none"
              />
            </div>

            {/* Email (Optional / Authenticated) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Your Email <span className="text-slate-500 font-normal lowercase">(optional for replies)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@university.edu"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-slate-100 text-xs focus:outline-none transition-all placeholder:text-slate-500"
              />
            </div>

            {error && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl">
                {error}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-600/30"
              >
                {isSubmitting ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Feedback</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
