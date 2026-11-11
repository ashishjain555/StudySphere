import React, { useState, useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { BrandLogo } from '../components/common/BrandLogo';
import { AboutModal } from '../components/modals/AboutModal';
import { PrivacyPolicyModal } from '../components/modals/PrivacyPolicyModal';
import { FeedbackModal } from '../components/modals/FeedbackModal';
import {
  GraduationCap,
  MessageSquare,
  FileText,
  HelpCircle,
  Calendar,
  TrendingUp,
  AlertTriangle,
  FolderOpen,
  Search,
  ArrowRight,
  BookOpen,
  Shield,
  Layers,
  ChevronRight,
  Play,
  Compass,
  Sparkles,
  Brain,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { InteractiveBackground3D } from '../components/3d/InteractiveBackground3D';
import { TiltCard3D } from '../components/3d/TiltCard3D';

interface LandingPageProps {
  onNavigate: (path: string) => void;
  onOpenAuth: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [activePreviewTab, setActivePreviewTab] = useState<'tutor' | 'quiz' | 'radar'>('tutor');
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  // Subtle & Fast UI Entrance Animations (GPU accelerated, zero scroll jank)
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Navigation Header entrance
      gsap.from('.landing-header', {
        y: -15,
        opacity: 0,
        duration: 0.5,
        ease: 'power2.out',
      });

      // 2. Hero content entrance
      gsap.from('.hero-badge, .hero-title, .hero-desc, .hero-cta-btn, .hero-metrics-item, .hero-trust-strip', {
        y: 15,
        opacity: 0,
        duration: 0.55,
        stagger: 0.06,
        ease: 'power2.out',
      });
    }, mainRef);

    return () => ctx.revert();
  }, []);

  const featureCards = [
    {
      icon: MessageSquare,
      title: 'Study Tutor',
      description: 'Structured, conceptual explanations tailored to your learning depth (Beginner, Intermediate, Exam Focused).',
      tag: 'Interactive',
    },
    {
      icon: FileText,
      title: 'Curriculum PDF Reader',
      description: 'Upload textbooks or syllabus notes for automatic chapter summaries, key takeaways, and document Q&A.',
      tag: 'Documents',
    },
    {
      icon: HelpCircle,
      title: 'Practice Quizzes',
      description: 'Generate focused multi-choice practice drills with instant answer explanations and timed score tracking.',
      tag: 'Practice',
    },
    {
      icon: Calendar,
      title: 'Study Planner',
      description: 'Organize study sessions, assign target subjects, and maintain daily learning streaks with calendar views.',
      tag: 'Planner',
    },
    {
      icon: TrendingUp,
      title: 'Progress Analytics',
      description: 'Review weekly study hours, subject syllabus completion, and quiz accuracy across all courses.',
      tag: 'Analytics',
    },
    {
      icon: AlertTriangle,
      title: 'Diagnostic Review',
      description: 'Identifies topics where quiz accuracy dips below benchmark and recommends focused revision modules.',
      tag: 'Diagnostics',
    },
    {
      icon: FolderOpen,
      title: 'Subject Resources',
      description: 'Curated repository of syllabus units, chapter notes, question banks, and reference documents.',
      tag: 'Library',
    },
    {
      icon: Search,
      title: 'Global Search',
      description: 'Quickly find definitions, topics, past questions, and notes across all subjects with ⌘K search.',
      tag: 'Index',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Upload or Select Subjects',
      description: 'Organize notes by chapter or browse pre-loaded engineering and science curricula.',
      icon: FolderOpen,
    },
    {
      number: '02',
      title: 'Learn with Study Tutor',
      description: 'Clarify difficult concepts at beginner, intermediate, or exam-oriented explanation depths.',
      icon: MessageSquare,
    },
    {
      number: '03',
      title: 'Test with Practice Quizzes',
      description: 'Complete diagnostic tests to measure retention and verify understanding.',
      icon: HelpCircle,
    },
    {
      number: '04',
      title: 'Master Weak Areas',
      description: 'Review automatically flagged weak topics with tailored follow-up explanations.',
      icon: TrendingUp,
    },
  ];

  return (
    <main id="main-content" ref={mainRef} className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] selection:bg-blue-600 selection:text-white relative">
      {/* Keyboard Accessibility Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        Skip to main content
      </a>

      {/* Dynamic 3D Neural Constellation Background with Cursor Tracking */}
      <InteractiveBackground3D intensity="vibrant" />

      {/* Navigation Header */}
      <header className="landing-header sticky top-0 z-40 w-full bg-[#070913]/85 border-b border-indigo-500/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/');
            }}
            className="flex items-center gap-3 cursor-pointer group"
            aria-label="StudySphere AI Home"
          >
            <BrandLogo size="md" />
            <div>
              <span className="text-base font-semibold text-white tracking-tight group-hover:text-indigo-300 transition-colors">StudySphere</span>
              <span className="hidden sm:block text-[10px] uppercase font-mono tracking-wider text-indigo-300/70 font-medium">
                Workspace
              </span>
            </div>
          </a>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-slate-300">
            <a href="#features" className="hover:text-indigo-300 transition-colors">
              Features
            </a>
            <a href="#tutor" className="hover:text-indigo-300 transition-colors">
              Study Tutor
            </a>
            <a href="#how-it-works" className="hover:text-indigo-300 transition-colors">
              Workflow
            </a>
            <button
              onClick={() => setIsAboutOpen(true)}
              className="hover:text-indigo-300 transition-colors cursor-pointer"
            >
              About
            </button>
            <button
              onClick={() => setIsFeedbackOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 hover:text-white transition-colors cursor-pointer border border-indigo-500/30 font-medium"
            >
              Feedback
            </button>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('/login')}
              className="text-xs font-medium text-slate-300 hover:text-white transition-colors px-3 py-2 cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => onNavigate('/register')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-xs border border-indigo-400/40 flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.02]"
            >
              Get Started
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Soft Ambient Aurora Gradient Glow (Zero GPU Cost) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[550px] bg-gradient-to-b from-indigo-600/20 via-purple-600/10 to-transparent blur-3xl pointer-events-none -z-10" />

        <div className="text-center space-y-6 max-w-3xl mx-auto">
          {/* Top Badge */}
          <div className="hero-badge inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-blue-500/15 border border-indigo-500/30 text-indigo-200 text-xs font-medium shadow-sm shadow-indigo-500/10">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Academic Intelligence & Structured Study Platform</span>
          </div>

          {/* Main Headline */}
          <h1 className="hero-title text-4xl sm:text-5xl lg:text-6xl font-semibold text-slate-100 tracking-tight leading-[1.12]">
            Study with clarity.{' '}
            <span className="block mt-1 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 font-semibold">
              Master your syllabus with AI.
            </span>
          </h1>

          {/* Supporting Text */}
          <p className="hero-desc text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            A focused workspace designed for students and educators. Organize course notes, clarify complex topics with multi-depth AI tutor, practice chapter quizzes, and track study consistency.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('/register')}
              className="hero-cta-btn w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-xs sm:text-sm border border-indigo-400/40 flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4 text-indigo-200" />
              Get Started for Free
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <a
              href="#features"
              className="hero-cta-btn w-full sm:w-auto px-7 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-indigo-500/50 text-slate-200 hover:text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Play className="w-3.5 h-3.5 text-indigo-400" />
              Explore Capabilities
            </a>
          </div>

          {/* Quick Metrics */}
          <div className="pt-6 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="hero-metrics-item p-3.5 rounded-2xl bg-gradient-to-br from-slate-900/80 to-slate-900/40 border border-indigo-500/20 backdrop-blur-sm shadow-md">
              <div className="text-xl font-semibold text-slate-100 font-mono">100%</div>
              <div className="text-xs text-indigo-300 font-normal">Modular Workspace</div>
            </div>
            <div className="hero-metrics-item p-3.5 rounded-2xl bg-gradient-to-br from-slate-900/80 to-slate-900/40 border border-indigo-500/20 backdrop-blur-sm shadow-md">
              <div className="text-xl font-semibold text-indigo-400 font-mono">3 Modes</div>
              <div className="text-xs text-indigo-300 font-normal">Tutor Explanation Depths</div>
            </div>
            <div className="hero-metrics-item p-3.5 rounded-2xl bg-gradient-to-br from-slate-900/80 to-slate-900/40 border border-indigo-500/20 backdrop-blur-sm shadow-md">
              <div className="text-xl font-semibold text-purple-400 font-mono">Interactive</div>
              <div className="text-xs text-indigo-300 font-normal">Diagnostic Quizzes</div>
            </div>
          </div>
        </div>

        {/* ========================================================
            INTERACTIVE WORKSPACE SHOWCASE PREVIEW (Zero WebGL Lag)
            100% Tactile & Engaging • Pure CSS & React
            ======================================================== */}
        <div className="mt-14 max-w-5xl mx-auto relative group">
          {/* Subtle Ambient Backlight Glow */}
          <div className="absolute -inset-1.5 bg-gradient-to-r from-indigo-500/25 via-purple-500/20 to-cyan-500/20 rounded-3xl blur-2xl opacity-75 group-hover:opacity-100 transition-opacity duration-500 -z-10" />

          {/* Floating Pill 1 (Top Left) */}
          <div className="hidden md:flex absolute -top-5 -left-4 z-20 items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-indigo-500/30 backdrop-blur-md shadow-xl text-xs font-medium text-indigo-200">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>7-Day Active Streak • +350 XP</span>
          </div>

          {/* Floating Pill 2 (Top Right) */}
          <div className="hidden md:flex absolute -top-5 -right-4 z-20 items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-emerald-500/30 backdrop-blur-md shadow-xl text-xs font-medium text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Gemini 2.5 Flash Connected</span>
          </div>

          {/* Mac / Browser Styled Showcase Window */}
          <div className="rounded-2xl border border-indigo-500/30 bg-slate-950/90 backdrop-blur-xl shadow-2xl overflow-hidden">
            {/* Window Title Bar */}
            <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800/90 flex flex-wrap items-center justify-between gap-3">
              {/* Traffic Light Dots */}
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block shadow-sm" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block shadow-sm" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block shadow-sm" />
                <span className="ml-2 text-xs font-mono text-slate-400 hidden sm:inline">
                  studysphere-ai://workspace/operating-systems
                </span>
              </div>

              {/* Interactive Tabs */}
              <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setActivePreviewTab('tutor')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer font-medium ${
                    activePreviewTab === 'tutor'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>AI Tutor</span>
                </button>
                <button
                  onClick={() => setActivePreviewTab('quiz')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer font-medium ${
                    activePreviewTab === 'quiz'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Interactive Quiz</span>
                </button>
                <button
                  onClick={() => setActivePreviewTab('radar')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer font-medium ${
                    activePreviewTab === 'radar'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Syllabus Radar</span>
                </button>
              </div>
            </div>

            {/* Window Content Pane */}
            <div className="p-5 sm:p-7 min-h-[340px] flex flex-col justify-center bg-gradient-to-b from-slate-950/40 via-slate-950/80 to-slate-950">
              {/* TAB 1: AI TUTOR VIEW */}
              {activePreviewTab === 'tutor' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Student Question Bubble */}
                  <div className="flex items-start gap-3 max-w-xl ml-auto justify-end">
                    <div className="p-3.5 rounded-2xl rounded-tr-sm bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-xs sm:text-sm shadow-md shadow-indigo-600/20">
                      Explain the difference between Paging and Segmentation in 2 lines with key university exam points.
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-xs font-bold text-indigo-300 shrink-0">
                      ME
                    </div>
                  </div>

                  {/* AI Response Bubble */}
                  <div className="flex items-start gap-3 max-w-2xl">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 shrink-0">
                      <Brain className="w-4 h-4" />
                    </div>
                    <div className="p-4 rounded-2xl rounded-tl-sm bg-slate-900/90 border border-indigo-500/25 text-xs sm:text-sm text-slate-200 space-y-2.5 shadow-lg">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                          StudySphere Tutor • Exam Focused
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          Verified Accurate
                        </span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        <strong className="text-white">1. Paging:</strong> Memory is split into <em>fixed-size physical frames</em> (eliminates external fragmentation; transparent to programmer).
                      </p>
                      <p className="text-slate-300 leading-relaxed">
                        <strong className="text-white">2. Segmentation:</strong> Memory is partitioned into <em>variable-size logical blocks</em> (functions, stack, arrays) reflecting the user's conceptual view.
                      </p>
                      <div className="p-2.5 rounded-xl bg-indigo-950/50 border border-indigo-500/20 flex flex-wrap items-center justify-between gap-2 text-xs text-indigo-300">
                        <span>🎯 Exam Tip: Formula = (Segment #, Offset). Traps if Offset &gt; Limit.</span>
                        <button
                          onClick={() => setActivePreviewTab('quiz')}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium transition-all cursor-pointer shadow-sm"
                        >
                          Practice Drill →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: INTERACTIVE QUIZ VIEW */}
              {activePreviewTab === 'quiz' && (
                <div className="space-y-4 max-w-2xl mx-auto w-full animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-semibold">
                      Chapter 4 Practice • Question 1 of 5
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Timer: 00:45</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-indigo-500/25 space-y-3 shadow-lg">
                    <h3 className="text-sm sm:text-base font-medium text-white">
                      Which page replacement algorithm is known to suffer from Belady's Anomaly?
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {[
                        { id: 0, text: 'A) Least Recently Used (LRU)', correct: false },
                        { id: 1, text: 'B) First-In, First-Out (FIFO)', correct: true },
                        { id: 2, text: 'C) Optimal Page Replacement (OPT)', correct: false },
                        { id: 3, text: 'D) Least Frequently Used (LFU)', correct: false },
                      ].map((opt) => {
                        const isSelected = selectedQuizOption === opt.id;
                        let btnStyle = 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-indigo-500/50 hover:bg-slate-800/80';
                        if (isSelected) {
                          btnStyle = opt.correct
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200 shadow-md shadow-emerald-500/20'
                            : 'bg-rose-500/20 border-rose-500 text-rose-200';
                        }
                        return (
                          <button
                            key={opt.id}
                            onClick={() => {
                              setSelectedQuizOption(opt.id);
                              setQuizSubmitted(true);
                            }}
                            className={`p-3 rounded-xl border text-left text-xs sm:text-sm font-medium transition-all cursor-pointer flex items-center justify-between ${btnStyle}`}
                          >
                            <span>{opt.text}</span>
                            {isSelected && opt.correct && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    {quizSubmitted && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between animate-fadeIn">
                        <span>✅ <strong>Correct!</strong> FIFO can cause more page faults even with more allocated frames.</span>
                        <span className="font-mono font-bold">+20 XP</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: SYLLABUS & WEAK TOPIC RADAR VIEW */}
              {activePreviewTab === 'radar' && (
                <div className="space-y-4 max-w-2xl mx-auto w-full animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-white">Syllabus Mastery Diagnostics</h3>
                      <p className="text-xs text-slate-400">Automated concept evaluation across enrolled curriculum</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold font-mono">
                      Overall: 84% Ready
                    </span>
                  </div>

                  <div className="space-y-3">
                    {[
                      { name: 'Operating Systems • CPU Scheduling', progress: 92, status: 'Mastered', color: 'bg-emerald-500' },
                      { name: 'Data Structures • Dynamic Programming', progress: 85, status: 'Strong', color: 'bg-indigo-500' },
                      { name: 'Computer Networks • TCP Congestion Control', progress: 62, status: 'Needs Practice', color: 'bg-amber-500' },
                    ].map((item, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-200">{item.name}</span>
                          <span className="font-mono text-slate-300 font-semibold">{item.progress}% ({item.status})</span>
                        </div>
                        <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                          <div className={`h-full ${item.color} rounded-full transition-all duration-700`} style={{ width: `${item.progress}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-300">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      Weak Topic Identified: TCP Congestion Control (3 mistakes in last quiz)
                    </span>
                    <button
                      onClick={() => onNavigate('/register')}
                      className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-[11px] transition-all cursor-pointer"
                    >
                      Generate Revision →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Feature Trust Strip */}
        <div className="hero-trust-strip mt-16 py-4 px-6 rounded-2xl bg-[#0c1024]/85 border border-indigo-500/25 shadow-lg flex flex-wrap items-center justify-around gap-6 text-xs text-indigo-200/90">
          <span className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-blue-400" /> Adaptive Learning Modules
          </span>
          <span className="text-slate-700">•</span>
          <span className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-slate-400" /> Chapter Notes & Reference Files
          </span>
          <span className="text-slate-700">•</span>
          <span className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-slate-400" /> Objective Performance Metrics
          </span>
          <span className="text-slate-700">•</span>
          <span className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-400" /> Student & Educator Roles
          </span>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-indigo-500/20">
        <div className="features-header text-center max-w-3xl mx-auto mb-16 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-indigo-400 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Platform Capabilities
          </h2>
          <p className="text-2xl sm:text-3xl font-semibold text-slate-100">
            Engineered for Deep Academic Comprehension
          </p>
          <p className="text-slate-300 text-xs sm:text-sm max-w-xl mx-auto font-normal">
            Everything structured logically around your syllabus so you spend less time searching and more time mastering concepts.
          </p>
        </div>

        <div className="feature-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {featureCards.map((card, idx) => {
            const IconComponent = card.icon;
            return (
              <div key={idx} className="feature-card-item h-full">
                <TiltCard3D className="h-full">
                  <div
                    className="h-full p-6 rounded-2xl bg-[#0c1024]/80 border border-indigo-500/20 hover:border-indigo-500/40 backdrop-blur-md flex flex-col justify-between transition-all duration-300 group shadow-lg hover:shadow-indigo-500/10"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-300 group-hover:text-cyan-300 group-hover:border-cyan-500/40 transition-colors">
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                          {card.tag}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-100 mb-2 group-hover:text-indigo-300 transition-colors">
                        {card.title}
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed font-normal">{card.description}</p>
                    </div>
                    <button
                      onClick={() => onNavigate('/register')}
                      className="mt-5 text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 group-hover:translate-x-1 transition-all"
                    >
                      View Feature <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </TiltCard3D>
              </div>
            );
          })}
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-indigo-500/20">
        <div className="workflow-header text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
            Structured Workflow
          </h2>
          <p className="text-2xl sm:text-3xl font-semibold text-slate-100">How You Progress Through Your Courses</p>
        </div>

        <div className="workflow-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            return (
              <div key={index} className="step-card-item h-full">
                <TiltCard3D className="h-full">
                  <div className="h-full p-6 rounded-2xl bg-[#0c1024]/80 border border-indigo-500/20 hover:border-indigo-500/40 backdrop-blur-md space-y-4 shadow-lg hover:shadow-indigo-500/10 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-mono text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 font-bold">
                        {step.number}
                      </span>
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-300">
                        <StepIcon className="w-4 h-4" />
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-100">{step.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed font-normal">{step.description}</p>
                  </div>
                </TiltCard3D>
              </div>
            );
          })}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer py-10 border-t border-indigo-500/20 bg-[#070913] text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" />
            <span className="font-semibold text-slate-200 text-xs">StudySphere</span>
          </div>
          <div className="flex flex-wrap items-center gap-5 sm:gap-6 text-slate-400 text-xs">
            <a href="#features" className="hover:text-indigo-300 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-indigo-300 transition-colors">Workflow</a>
            <button onClick={() => setIsAboutOpen(true)} className="hover:text-indigo-300 transition-colors cursor-pointer">About Us</button>
            <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-300 transition-colors">Privacy Policy</a>
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-300 transition-colors">Terms</a>
            <button onClick={() => setIsFeedbackOpen(true)} className="hover:text-indigo-300 text-indigo-400 font-medium transition-colors cursor-pointer">Give Feedback</button>
            <button onClick={() => onNavigate('/login')} className="hover:text-white transition-colors cursor-pointer">Sign In</button>
          </div>
          <div className="text-slate-400 text-[11px]">
            © {new Date().getFullYear()} StudySphere. Academic study platform.
          </div>
        </div>
      </footer>

      {/* About Modal */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
        onOpenFeedback={() => setIsFeedbackOpen(true)}
      />

      {/* Privacy Policy Modal */}
      <PrivacyPolicyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
        onOpenAbout={() => setIsAboutOpen(true)}
        onOpenFeedback={() => setIsFeedbackOpen(true)}
      />

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />
    </main>
  );
};
