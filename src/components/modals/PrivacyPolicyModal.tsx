import React, { useEffect } from 'react';
import { X, ShieldCheck, Lock, Database, EyeOff, FileText, CheckCircle2 } from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAbout?: () => void;
  onOpenFeedback?: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  isOpen,
  onClose,
  onOpenAbout,
  onOpenFeedback,
}) => {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl glass-panel bg-slate-950/95 border border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 relative text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-800"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Privacy & Data Policy</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              StudySphere AI Data Protection, AI Usage & Student Privacy Commitments
            </p>
          </div>
        </div>

        {/* Commitment Banner */}
        <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 text-xs text-emerald-200 leading-relaxed flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <strong className="block text-emerald-300 font-semibold mb-0.5">Zero Data Selling Guarantee</strong>
            <span>
              StudySphere is strictly an educational workspace. We do not sell, rent, monetize, or share your study materials, quiz attempts, notes, or uploaded documents with any third-party advertisers.
            </span>
          </div>
        </div>

        {/* Key Policies List */}
        <div className="space-y-4 text-xs">
          {/* Policy 1 */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-indigo-300 font-semibold">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>1. Client-Side Document & PDF Processing</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              When you analyze textbook or lecture notes in the PDF Analyzer, text parsing is performed directly inside your browser using a sandboxed Web Worker. Parsed documents and extracted summaries are stored in your device’s private <strong>IndexedDB</strong> database, eliminating server-side file retention.
            </p>
          </div>

          {/* Policy 2 */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-blue-300 font-semibold">
              <EyeOff className="w-4 h-4 text-blue-400" />
              <span>2. Google Gemini AI Query Privacy</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Queries submitted to the AI Study Tutor and PDF Summarizer are transmitted over encrypted HTTPS to the backend and dispatched to Google Gemini via API. Under Google AI Studio API policies, customer inputs sent via paid or developer API endpoints are not used to train public foundational models.
            </p>
          </div>

          {/* Policy 3 */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-300 font-semibold">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>3. Authentication & Password Security</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              We leverage <strong>Supabase Auth</strong> with industry-standard PKCE (Proof Key for Code Exchange) flow and <strong>Google OAuth 2.0</strong>. Passwords are never stored in plain text and are cryptographic one-way hashed. Session tokens (JWTs) are handled with automatic silent refresh.
            </p>
          </div>

          {/* Policy 4 */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-rose-300 font-semibold">
              <Database className="w-4 h-4 text-rose-400" />
              <span>4. Data Control & Right to Deletion</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              You maintain 100% control over your academic workspace. All destructive operations (deleting chat logs, removing planned tasks, discarding analyzed PDFs) feature double-confirmation modals and permanently remove your records from both browser storage and cloud databases.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
          <div className="flex items-center gap-4">
            {onOpenAbout && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAbout();
                }}
                className="hover:text-emerald-300 underline underline-offset-4 transition-colors cursor-pointer"
              >
                About Platform
              </button>
            )}
            {onOpenFeedback && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenFeedback();
                }}
                className="hover:text-emerald-300 underline underline-offset-4 transition-colors cursor-pointer"
              >
                Share Feedback
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold cursor-pointer transition-colors"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
