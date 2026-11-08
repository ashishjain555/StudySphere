import React, { useEffect } from 'react';
import { X, ExternalLink, Code2, ShieldCheck, Sparkles, Heart } from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPrivacy?: () => void;
  onOpenFeedback?: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  onClose,
  onOpenPrivacy,
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

        {/* Brand & Header */}
        <div className="flex items-center gap-4">
          <BrandLogo size="lg" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-white tracking-tight">StudySphere AI</h2>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                v1.0 Live
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Next-Generation Intelligent Student Learning & Curriculum Intelligence Platform
            </p>
          </div>
        </div>

        {/* Mission Statement */}
        <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-xs sm:text-sm text-indigo-200 leading-relaxed">
          <p>
            <strong>StudySphere</strong> was created with a clear academic mission: to bridge the gap between heavy university syllabi and student retention. By combining deep multi-topic PDF parsing, dual-language comprehension (English & conversational Hinglish), adaptive weak-topic detection, and personalized AI tutoring, StudySphere helps students master their curriculum with supreme clarity.
          </p>
        </div>

        {/* Core Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold">
              <Sparkles className="w-4 h-4" />
              <span>Multi-Model AI Tutor</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Powered by Google Gemini Flash models with automated multi-model fallback to guarantee uninterrupted 24/7 study assistance.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Diagnostic Weak-Topic Tracking</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Algorithmic scoring tracks quiz performance and automatically flags concepts below 60% accuracy with tailored remediation drills.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-blue-400 font-semibold">
              <Code2 className="w-4 h-4" />
              <span>Client-Side PDF Extraction</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              PDF.js web workers parse lecture notes in-browser, preventing memory quota errors and safeguarding student study documents.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-400 font-semibold">
              <Heart className="w-4 h-4" />
              <span>100% Free & Student Centric</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Built to support offline local storage as well as cloud-synced Google OAuth and PostgreSQL databases without subscription barriers.
            </p>
          </div>
        </div>

        {/* Author / Creator Info */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-semibold">
              Designed & Developed By
            </span>
            <span className="text-sm font-bold text-white">Ashish Jain</span>
            <span className="text-slate-400 block text-[11px]">
              Ratnam College of Arts, Science and Commerce
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="https://github.com/ashishjain555"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium inline-flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              <span>GitHub</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
            <a
              href="https://github.com/ashishjain555/StudySphere"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium inline-flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <span>Repository</span>
              <ExternalLink className="w-3.5 h-3.5 text-white/80" />
            </a>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
          <div className="flex items-center gap-4">
            {onOpenPrivacy && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPrivacy();
                }}
                className="hover:text-indigo-300 underline underline-offset-4 transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
            )}
            {onOpenFeedback && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenFeedback();
                }}
                className="hover:text-indigo-300 underline underline-offset-4 transition-colors cursor-pointer"
              >
                Give Feedback
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
