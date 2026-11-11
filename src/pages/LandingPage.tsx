import React, { useState, useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { BrandLogo } from '../components/common/BrandLogo';
import { AboutModal } from '../components/modals/AboutModal';
import { PrivacyPolicyModal } from '../components/modals/PrivacyPolicyModal';
import { FeedbackModal } from '../components/modals/FeedbackModal';
import {
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
  ChevronRight,
  Play,
  Sparkles,
  CheckCircle2,
  Zap,
  Flame,
  Lightbulb,
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
  const [activeTab, setActiveTab] = useState<'analogy' | 'deep' | 'exam'>('analogy');
  const mainRef = useRef<HTMLDivElement>(null);

  // Smooth GPU Entrance Animations
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Navigation Header
      gsap.from('.landing-header', {
        y: -15,
        opacity: 0,
        duration: 0.5,
        ease: 'power2.out',
      });

      // 2. Hero content
      gsap.from('.hero-badge, .hero-title, .hero-desc, .hero-cta-btn, .hero-metrics-item, .hero-preview-card', {
        y: 16,
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
      title: 'AI Concept Tutor',
      description: 'Ask any doubt in plain English. Get clear step-by-step explanations with intuitive real-world analogies until it clicks.',
      tag: 'Tutor',
    },
    {
      icon: FileText,
      title: 'Smart PDF Summaries',
      description: 'Drop in your lecture slides or heavy textbook chapters. Get concise summaries, bullet notes, and formulas in seconds.',
      tag: 'Notes',
    },
    {
      icon: HelpCircle,
      title: 'Practice Quizzes',
      description: 'Test your memory before exams with custom multiple-choice drills and instant answer explanations.',
      tag: 'Practice',
    },
    {
      icon: Calendar,
      title: 'Study Planner',
      description: 'Map out your study schedule before midterms and finals. Track your daily streaks and stay on target effortlessly.',
      tag: 'Planner',
    },
    {
      icon: TrendingUp,
      title: 'Progress Analytics',
      description: 'Visual charts showing your weekly study hours, syllabus completion, and quiz accuracy across all courses.',
      tag: 'Analytics',
    },
    {
      icon: AlertTriangle,
      title: 'Weak Topic Radar',
      description: 'Automatically detects concepts where your quiz accuracy dips and creates targeted revision sessions.',
      tag: 'Diagnostics',
    },
    {
      icon: FolderOpen,
      title: 'Organized Library',
      description: 'Keep all your notes, chapter references, and question banks neatly categorized by subject in one place.',
      tag: 'Library',
    },
    {
      icon: Search,
      title: 'Instant Search',
      description: 'Find any formula, concept, or past test question in a split second with lightning-fast search.',
      tag: 'Search',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Pick a Subject or Upload Notes',
      description: 'Choose any subject from your syllabus or drop in lecture slides and textbooks to begin.',
      icon: FolderOpen,
    },
    {
      number: '02',
      title: 'Clear Any Confusing Doubt',
      description: 'Ask your questions freely and get crystal-clear breakdowns tailored to how you learn best.',
      icon: MessageSquare,
    },
    {
      number: '03',
      title: 'Practice with Instant Quizzes',
      description: 'Test your recall with custom exam-style questions and see clear explanations for every option.',
      icon: HelpCircle,
    },
    {
      number: '04',
      title: 'Conquer Weak Spots Before Exams',
      description: 'Review automatically flagged tricky topics so you walk into test day feeling 100% prepared.',
      icon: TrendingUp,
    },
  ];

  return (
    <main id="main-content" ref={mainRef} className="min-h-screen bg-[#07090E] text-[#FFFFFF] selection:bg-indigo-600 selection:text-white relative">
      {/* Keyboard Accessibility Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
      >
        Skip to main content
      </a>

      {/* Ambient 3D Starfield & Constellation Background with Cursor Light */}
      <InteractiveBackground3D intensity="subtle" />

      {/* Navigation Header */}
      <header className="landing-header sticky top-0 z-40 w-full bg-[#07090E]/90 border-b border-white/[0.08] backdrop-blur-xl">
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
              <span className="text-base font-bold text-white tracking-tight group-hover:text-indigo-400 transition-colors">StudySphere</span>
              <span className="hidden sm:block text-[10px] uppercase font-mono tracking-wider text-slate-400 font-semibold">
                AI Workspace
              </span>
            </div>
          </a>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#workflow" className="hover:text-white transition-colors">
              How It Works
            </a>
            <button
              onClick={() => setIsAboutOpen(true)}
              className="hover:text-white transition-colors cursor-pointer"
            >
              About
            </button>
            <button
              onClick={() => setIsFeedbackOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 hover:text-white transition-colors cursor-pointer border border-indigo-500/25 font-semibold"
            >
              Feedback
            </button>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('/login')}
              className="text-xs font-semibold text-slate-300 hover:text-white transition-colors px-3 py-2 cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => onNavigate('/register')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-bold text-xs border border-white/10 flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-600/30 hover:scale-[1.02]"
            >
              Get Started Free
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Soft Ambient Spotlight Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[500px] bg-gradient-to-b from-violet-600/15 via-indigo-600/10 to-transparent blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-1/3 right-10 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Punchy Student Value Proposition */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Top Pill Badge */}
            <div className="hero-badge inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/25 text-violet-300 text-xs font-semibold shadow-sm backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span>Built for students who want to score higher</span>
            </div>

            {/* Main Headline */}
            <h1 className="hero-title text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.12]">
              Ace your syllabus.{' '}
              <span className="block mt-1 text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-sky-300 to-indigo-300 font-extrabold">
                Without the late-night panic.
              </span>
            </h1>

            {/* Supporting Copy */}
            <p className="hero-desc text-sm sm:text-base text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Stuck on a tricky concept at 2 AM? Clear doubts instantly with step-by-step guidance, turn heavy lecture PDFs into sharp summaries, and practice real exam questions until you feel 100% confident.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
              <button
                onClick={() => onNavigate('/register')}
                className="hero-cta-btn w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-bold text-xs sm:text-sm border border-white/10 flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-xl shadow-indigo-600/35 hover:scale-[1.02] active:scale-[0.98]"
              >
                Start Studying Free
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <a
                href="#features"
                className="hero-cta-btn w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Play className="w-3.5 h-3.5 text-indigo-400" />
                Explore Features
              </a>
            </div>

            {/* Quick Metrics */}
            <div className="pt-6 border-t border-white/[0.08] grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0">
              <div className="hero-metrics-item p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm">
                <div className="text-xl font-bold text-white font-mono">24/7</div>
                <div className="text-xs text-slate-400 font-medium">Instant Doubt Solver</div>
              </div>
              <div className="hero-metrics-item p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm">
                <div className="text-xl font-bold text-violet-400 font-mono">1-Click</div>
                <div className="text-xs text-slate-400 font-medium">PDF Chapter Notes</div>
              </div>
              <div className="hero-metrics-item p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm">
                <div className="text-xl font-bold text-sky-400 font-mono">100% Free</div>
                <div className="text-xs text-slate-400 font-medium">For All Students</div>
              </div>
            </div>
          </div>

          {/* Right Column: Sassy 3D Tilt Interactive Study Card */}
          <div className="lg:col-span-5 flex items-center justify-center">
            <TiltCard3D maxTilt={10} className="w-full max-w-[440px]">
              <div className="hero-preview-card relative p-6 rounded-3xl bg-[#0D1224]/90 border border-white/[0.12] backdrop-blur-2xl shadow-2xl space-y-4">
                {/* Floating 3D Badge (Top Right) */}
                <div className="absolute -top-3 -right-3 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-950/90 border border-indigo-500/40 shadow-lg shadow-indigo-950/60 text-[11px] font-bold text-indigo-200">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>5-Day Streak 🔥</span>
                </div>

                {/* Card Header with macOS Dots & Session Status */}
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-slate-300 font-mono text-[10px]">Physics 101 • Quantum</span>
                  </div>
                </div>

                {/* Student Question Box */}
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 text-xs font-bold">
                    Q
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-indigo-300 font-bold tracking-wider">Student Doubt</span>
                    <p className="text-xs text-white font-medium mt-0.5">
                      "Can you explain Heisenberg's Uncertainty Principle with an everyday analogy?"
                    </p>
                  </div>
                </div>

                {/* AI Tutor Response Box */}
                <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-violet-300">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                      Step-by-Step Breakdown
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Exam High-Yield
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {activeTab === 'analogy' && (
                      <>
                        <strong className="text-white">Camera Analogy:</strong> Imagine snapping a fast sports car in low light. A ultra-fast shutter reveals its exact position, but not speed. A slow shutter captures speed blur, but smears location. In nature, measuring one always blurs the other.
                      </>
                    )}
                    {activeTab === 'deep' && (
                      <>
                        <strong className="text-white">Formula:</strong> <code className="text-violet-300 font-mono">Δx · Δp ≥ ℏ / 2</code>. Position and momentum are Fourier-transform conjugate variables. A localized wave packet requires a wide spectrum of wavenumbers.
                      </>
                    )}
                    {activeTab === 'exam' && (
                      <>
                        <strong className="text-white">Key Exam Takeaway:</strong> Never say "the measuring instrument is imperfect." The uncertainty is an intrinsic wave property of matter itself, not an equipment flaw!
                      </>
                    )}
                  </p>
                </div>

                {/* Interactive Explanation Depth Toggle */}
                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    onClick={() => setActiveTab('analogy')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                      activeTab === 'analogy'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/[0.06]'
                    }`}
                  >
                    💡 Analogy
                  </button>
                  <button
                    onClick={() => setActiveTab('deep')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                      activeTab === 'deep'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/[0.06]'
                    }`}
                  >
                    📘 Deep Math
                  </button>
                  <button
                    onClick={() => setActiveTab('exam')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                      activeTab === 'exam'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/[0.06]'
                    }`}
                  >
                    🎯 Exam Tips
                  </button>
                </div>

                {/* Mini Quiz Practice Preview */}
                <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-slate-300 text-[11px] font-medium">Diagnostic Recall: <strong className="text-white">96% Accuracy</strong></span>
                  </div>
                  <button
                    onClick={() => onNavigate('/register')}
                    className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                  >
                    Try It Free <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </TiltCard3D>
          </div>
        </div>

        {/* Feature Trust Strip */}
        <div className="hero-trust-strip mt-16 py-4 px-6 rounded-2xl bg-[#0D1224]/80 border border-white/[0.08] shadow-xl flex flex-wrap items-center justify-around gap-6 text-xs text-slate-300 backdrop-blur-xl">
          <span className="flex items-center gap-2 font-semibold">
            <Zap className="w-4 h-4 text-violet-400" /> Instant Concept Answers
          </span>
          <span className="text-white/20">•</span>
          <span className="flex items-center gap-2 font-semibold">
            <BookOpen className="w-4 h-4 text-indigo-400" /> PDF Chapter Summaries
          </span>
          <span className="text-white/20">•</span>
          <span className="flex items-center gap-2 font-semibold">
            <TrendingUp className="w-4 h-4 text-sky-400" /> Topic-Wise Diagnostic Quizzes
          </span>
          <span className="text-white/20">•</span>
          <span className="flex items-center gap-2 font-semibold">
            <Shield className="w-4 h-4 text-emerald-400" /> Weak Topic Radar
          </span>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/[0.08]">
        <div className="features-header text-center max-w-3xl mx-auto mb-16 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-violet-400 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            Everything You Need
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Built to Help You Study Faster & Score Higher
          </p>
          <p className="text-slate-300 text-sm max-w-xl mx-auto font-normal">
            No cluttered tabs or random video tutorials. Everything is structured cleanly around your syllabus.
          </p>
        </div>

        <div className="feature-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {featureCards.map((card, idx) => {
            const IconComponent = card.icon;
            return (
              <div key={idx} className="feature-card-item h-full">
                <TiltCard3D className="h-full">
                  <div
                    className="h-full p-6 rounded-2xl bg-[#0D1224]/80 border border-white/[0.08] hover:border-violet-500/40 backdrop-blur-xl flex flex-col justify-between transition-all duration-300 group shadow-xl hover:shadow-violet-500/10"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 group-hover:text-sky-300 group-hover:border-sky-500/40 transition-colors">
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-white/[0.05] text-slate-300 border border-white/10">
                          {card.tag}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mb-2 group-hover:text-violet-300 transition-colors">
                        {card.title}
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed font-normal">{card.description}</p>
                    </div>
                    <button
                      onClick={() => onNavigate('/register')}
                      className="mt-5 text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 group-hover:translate-x-1 transition-all cursor-pointer"
                    >
                      Try Feature <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </TiltCard3D>
              </div>
            );
          })}
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="workflow" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/[0.08]">
        <div className="workflow-header text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-violet-400">
            Simple 4-Step Process
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">How You Master Any Subject</p>
        </div>

        <div className="workflow-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            return (
              <div key={index} className="step-card-item h-full">
                <TiltCard3D className="h-full">
                  <div className="h-full p-6 rounded-2xl bg-[#0D1224]/80 border border-white/[0.08] hover:border-violet-500/40 backdrop-blur-xl space-y-4 shadow-xl hover:shadow-violet-500/10 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-mono text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400 font-extrabold">
                        {step.number}
                      </span>
                      <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                        <StepIcon className="w-5 h-5" />
                      </div>
                    </div>
                    <h3 className="text-base font-bold text-white">{step.title}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed font-normal">{step.description}</p>
                  </div>
                </TiltCard3D>
              </div>
            );
          })}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer py-10 border-t border-white/[0.08] bg-[#05070B] text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" />
            <span className="font-bold text-white text-xs">StudySphere</span>
          </div>
          <div className="flex flex-wrap items-center gap-5 sm:gap-6 text-slate-300 text-xs font-medium">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#workflow" className="hover:text-white transition-colors">How It Works</a>
            <button onClick={() => setIsAboutOpen(true)} className="hover:text-white transition-colors cursor-pointer">About Us</button>
            <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Terms</a>
            <button onClick={() => setIsFeedbackOpen(true)} className="hover:text-indigo-300 text-indigo-400 font-semibold transition-colors cursor-pointer">Give Feedback</button>
            <button onClick={() => onNavigate('/login')} className="hover:text-white transition-colors cursor-pointer">Sign In</button>
          </div>
          <div className="text-slate-400 text-[11px]">
            © {new Date().getFullYear()} StudySphere. Built for curious minds.
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
