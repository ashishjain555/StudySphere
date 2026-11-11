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
  const [activeTab, setActiveTab] = useState<'analogy' | 'deep' | 'exam'>('analogy');
  const mainRef = useRef<HTMLDivElement>(null);

  // Fast GPU Entrance Animation
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.landing-header', {
        y: -12,
        opacity: 0,
        duration: 0.45,
        ease: 'power2.out',
      });

      gsap.from('.hero-badge, .hero-title, .hero-desc, .hero-cta-btn, .hero-metrics-item, .hero-preview-card', {
        y: 14,
        opacity: 0,
        duration: 0.5,
        stagger: 0.05,
        ease: 'power2.out',
      });
    }, mainRef);

    return () => ctx.revert();
  }, []);

  const featureCards = [
    {
      icon: MessageSquare,
      title: 'AI Concept Tutor',
      description: 'Ask any doubt in plain words. Get step-by-step explanations with easy real-world examples until it clicks.',
      tag: 'Tutor',
    },
    {
      icon: FileText,
      title: 'Smart PDF Notes',
      description: 'Upload your textbooks or lecture slides. Get concise summaries, bullet points, and key formulas instantly.',
      tag: 'Notes',
    },
    {
      icon: HelpCircle,
      title: 'Practice Quizzes',
      description: 'Test your memory before exams with custom multiple-choice questions and instant answer explanations.',
      tag: 'Practice',
    },
    {
      icon: Calendar,
      title: 'Study Planner',
      description: 'Schedule daily study hours, set exam target dates, and keep track of your daily learning streak.',
      tag: 'Planner',
    },
    {
      icon: TrendingUp,
      title: 'Progress Analytics',
      description: 'Simple charts showing your study hours, syllabus completion, and quiz accuracy across all subjects.',
      tag: 'Analytics',
    },
    {
      icon: AlertTriangle,
      title: 'Weak Topic Alerts',
      description: 'Automatically finds topics where your quiz scores dropped so you can revise them before test day.',
      tag: 'Diagnostics',
    },
    {
      icon: FolderOpen,
      title: 'Subject Library',
      description: 'Keep all your notes, chapter references, and practice materials organized neatly by subject.',
      tag: 'Library',
    },
    {
      icon: Search,
      title: 'Instant Search',
      description: 'Search and find any formula, concept, or past question across all your notes in seconds.',
      tag: 'Search',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Select a Subject or Upload Notes',
      description: 'Pick any subject from your course or drop in lecture slides and PDF notes.',
      icon: FolderOpen,
    },
    {
      number: '02',
      title: 'Clear Hard Doubts Step-by-Step',
      description: 'Ask questions freely and get simple explanations tailored to how you understand best.',
      icon: MessageSquare,
    },
    {
      number: '03',
      title: 'Test Yourself with Quick Quizzes',
      description: 'Practice exam-style questions to make sure concepts are firmly locked in memory.',
      icon: HelpCircle,
    },
    {
      number: '04',
      title: 'Fix Weak Areas Before Exams',
      description: 'Review the exact questions you got wrong to walk into your exam 100% prepared.',
      icon: TrendingUp,
    },
  ];

  return (
    <main id="main-content" ref={mainRef} className="min-h-screen bg-[#0A0C10] text-[#FFFFFF] selection:bg-blue-600 selection:text-white relative">
      {/* Keyboard Accessibility Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold shadow-lg focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Subtle 3D Starfield Background */}
      <InteractiveBackground3D intensity="subtle" />

      {/* Navigation Header */}
      <header className="landing-header sticky top-0 z-40 w-full bg-[#0A0C10]/95 border-b border-white/[0.08] backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
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
              <span className="text-base font-bold text-white tracking-tight group-hover:text-blue-400 transition-colors">StudySphere</span>
              <span className="hidden sm:block text-[10px] uppercase font-mono tracking-wider text-slate-400 font-medium">
                Study Workspace
              </span>
            </div>
          </a>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-slate-300">
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
              className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white transition-colors cursor-pointer border border-white/10 font-medium"
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
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs border border-blue-500/30 flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
            >
              Get Started Free
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Soft Single-Color Ambient Light */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Simple & Clear Copy */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Top Pill Badge */}
            <div className="hero-badge inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-slate-300 text-xs font-medium backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span>StudySphere • Smart Study Platform</span>
            </div>

            {/* Main Headline */}
            <h1 className="hero-title text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.14]">
              Study smarter. Ace your exams.{' '}
              <span className="block mt-2 text-blue-400">
                Without the last-minute stress.
              </span>
            </h1>

            {/* Supporting Copy */}
            <p className="hero-desc text-sm sm:text-base text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Clear your toughest doubts with step-by-step guidance, turn lecture PDFs into quick summaries, and practice exam questions with topic quizzes.
            </p>

            {/* CTAs - Solid, Simple, Identical Colors */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
              <button
                onClick={() => onNavigate('/register')}
                className="hero-cta-btn w-full sm:w-auto px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs sm:text-sm border border-blue-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
              >
                Start Studying Free
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <a
                href="#features"
                className="hero-cta-btn w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
              >
                <Play className="w-3.5 h-3.5 text-blue-400" />
                Explore Features
              </a>
            </div>

            {/* Simple Metrics Strip */}
            <div className="pt-6 border-t border-white/[0.08] grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0">
              <div className="hero-metrics-item p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08]">
                <div className="text-xl font-bold text-white font-mono">24/7</div>
                <div className="text-xs text-slate-400 font-normal">Instant Doubt Solver</div>
              </div>
              <div className="hero-metrics-item p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08]">
                <div className="text-xl font-bold text-blue-400 font-mono">1-Click</div>
                <div className="text-xs text-slate-400 font-normal">PDF Chapter Notes</div>
              </div>
              <div className="hero-metrics-item p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08]">
                <div className="text-xl font-bold text-white font-mono">100% Free</div>
                <div className="text-xs text-slate-400 font-normal">For All Students</div>
              </div>
            </div>
          </div>

          {/* Right Column: Clean & Grounded Study Preview Card */}
          <div className="lg:col-span-5 flex items-center justify-center">
            <TiltCard3D maxTilt={6} className="w-full max-w-[440px]">
              <div className="hero-preview-card relative p-6 rounded-2xl bg-[#12151F] border border-white/10 shadow-xl space-y-4">
                {/* Header: Window Dots & Status */}
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                    <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                    <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="font-mono text-[11px] text-slate-400">Physics 101 • Quantum</span>
                  </div>
                </div>

                {/* Student Question Box */}
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-[10px] uppercase font-mono text-blue-400 font-semibold tracking-wider">Student Doubt</span>
                  <p className="text-xs text-white font-medium mt-1">
                    "Can you explain Heisenberg's Uncertainty Principle with an everyday analogy?"
                  </p>
                </div>

                {/* Explanation Box */}
                <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-blue-300">
                      Step-by-Step Explanation
                    </span>
                    <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                      Key Concept
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {activeTab === 'analogy' && (
                      <>
                        <strong className="text-white">Camera Analogy:</strong> If you take a picture of a fast-moving car with a high shutter speed, you know its exact position, but not its speed. If you use a slow shutter, you see speed blur, but lose its exact position. In physics, measuring position always blurs momentum.
                      </>
                    )}
                    {activeTab === 'deep' && (
                      <>
                        <strong className="text-white">Formula:</strong> <code className="text-blue-300 font-mono">Δx · Δp ≥ ℏ / 2</code>. Position and momentum are conjugate variables. Localizing a particle in space inevitably widens its momentum distribution.
                      </>
                    )}
                    {activeTab === 'exam' && (
                      <>
                        <strong className="text-white">Exam Tip:</strong> Never attribute uncertainty to "poor measurement equipment." Uncertainty is an intrinsic fundamental wave property of nature itself.
                      </>
                    )}
                  </p>
                </div>

                {/* Clean Simple Depth Buttons (All Uniform) */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setActiveTab('analogy')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      activeTab === 'analogy'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/[0.06]'
                    }`}
                  >
                    Analogy
                  </button>
                  <button
                    onClick={() => setActiveTab('deep')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      activeTab === 'deep'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/[0.06]'
                    }`}
                  >
                    Detailed Math
                  </button>
                  <button
                    onClick={() => setActiveTab('exam')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      activeTab === 'exam'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/[0.06]'
                    }`}
                  >
                    Exam Tips
                  </button>
                </div>

                {/* Bottom Status */}
                <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Practice Recall: <strong className="text-white">96% Accuracy</strong></span>
                  </div>
                  <button
                    onClick={() => onNavigate('/register')}
                    className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                  >
                    Try Free <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </TiltCard3D>
          </div>
        </div>

        {/* Feature Trust Strip - Clean Single Accent */}
        <div className="hero-trust-strip mt-16 py-4 px-6 rounded-xl bg-[#12151F] border border-white/[0.08] flex flex-wrap items-center justify-around gap-6 text-xs text-slate-300">
          <span className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-400" /> Instant Doubt Solving
          </span>
          <span className="text-white/20">•</span>
          <span className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-400" /> PDF Chapter Notes
          </span>
          <span className="text-white/20">•</span>
          <span className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" /> Topic-Wise Quizzes
          </span>
          <span className="text-white/20">•</span>
          <span className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-400" /> Weak Topic Tracking
          </span>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/[0.08]">
        <div className="features-header text-center max-w-3xl mx-auto mb-16 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
            Features
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            All-in-one workspace for your studies
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto font-normal">
            Everything organized cleanly by subject so you can study without distraction.
          </p>
        </div>

        <div className="feature-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {featureCards.map((card, idx) => {
            const IconComponent = card.icon;
            return (
              <div key={idx} className="feature-card-item h-full">
                <TiltCard3D maxTilt={5} className="h-full">
                  <div
                    className="h-full p-6 rounded-2xl bg-[#12151F] border border-white/[0.08] hover:border-blue-500/40 flex flex-col justify-between transition-colors group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-white/[0.04] text-slate-300 border border-white/10">
                          {card.tag}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                        {card.title}
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed font-normal">{card.description}</p>
                    </div>
                    <button
                      onClick={() => onNavigate('/register')}
                      className="mt-5 text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
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
        <div className="workflow-header text-center max-w-2xl mx-auto mb-16 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
            How It Works
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Simple 4-Step Process</h2>
        </div>

        <div className="workflow-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            return (
              <div key={index} className="step-card-item h-full">
                <TiltCard3D maxTilt={5} className="h-full">
                  <div className="h-full p-6 rounded-2xl bg-[#12151F] border border-white/[0.08] hover:border-blue-500/40 space-y-4 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-mono text-blue-400 font-bold">
                        {step.number}
                      </span>
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                        <StepIcon className="w-5 h-5" />
                      </div>
                    </div>
                    <h3 className="text-base font-semibold text-white">{step.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed font-normal">{step.description}</p>
                  </div>
                </TiltCard3D>
              </div>
            );
          })}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer py-10 border-t border-white/[0.08] bg-[#07090D] text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" />
            <span className="font-semibold text-white text-xs">StudySphere</span>
          </div>
          <div className="flex flex-wrap items-center gap-5 sm:gap-6 text-slate-400 text-xs">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#workflow" className="hover:text-white transition-colors">How It Works</a>
            <button onClick={() => setIsAboutOpen(true)} className="hover:text-white transition-colors cursor-pointer">About Us</button>
            <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Terms</a>
            <button onClick={() => setIsFeedbackOpen(true)} className="hover:text-blue-400 text-slate-300 transition-colors cursor-pointer">Give Feedback</button>
            <button onClick={() => onNavigate('/login')} className="hover:text-white transition-colors cursor-pointer">Sign In</button>
          </div>
          <div className="text-slate-500 text-[11px]">
            © {new Date().getFullYear()} StudySphere. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
        onOpenFeedback={() => setIsFeedbackOpen(true)}
      />

      <PrivacyPolicyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
        onOpenAbout={() => setIsAboutOpen(true)}
        onOpenFeedback={() => setIsFeedbackOpen(true)}
      />

      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />
    </main>
  );
};
