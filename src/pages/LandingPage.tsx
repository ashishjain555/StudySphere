import React, { useState, useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
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
} from 'lucide-react';
import { LearningNetwork3D } from '../components/3d/LearningNetwork3D';
import { InteractiveBackground3D } from '../components/3d/InteractiveBackground3D';
import { TiltCard3D } from '../components/3d/TiltCard3D';

// Register GSAP ScrollTrigger plugin once
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface LandingPageProps {
  onNavigate: (path: string) => void;
  onOpenAuth: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  // GSAP Smooth UI & ScrollTrigger Animations
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Navigation Header entrance
      gsap.from('.landing-header', {
        y: -25,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
      });

      // 2. Hero Left content staggered entrance
      const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      heroTl
        .from('.hero-badge', { y: 20, opacity: 0, duration: 0.6, delay: 0.1 })
        .from('.hero-title', { y: 30, opacity: 0, duration: 0.8 }, '-=0.35')
        .from('.hero-desc', { y: 20, opacity: 0, duration: 0.65 }, '-=0.45')
        .from('.hero-cta-btn', { y: 20, opacity: 0, duration: 0.5, stagger: 0.1 }, '-=0.4')
        .from('.hero-metrics-item', { y: 20, opacity: 0, duration: 0.6, stagger: 0.1 }, '-=0.35')
        .from('.hero-trust-strip', { y: 25, opacity: 0, duration: 0.75 }, '-=0.3');

      // 3. Hero 3D Graphic Canvas entrance
      gsap.from('.hero-3d-wrapper', {
        scale: 0.92,
        opacity: 0,
        duration: 1.1,
        ease: 'power2.out',
        delay: 0.25,
      });

      // 4. Features Section Header ScrollTrigger
      gsap.from('.features-header', {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '#features',
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      });

      // 5. Feature Cards Staggered Reveal
      gsap.from('.feature-card-item', {
        y: 45,
        opacity: 0,
        duration: 0.7,
        stagger: 0.08,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.feature-grid',
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      });

      // 6. Workflow / How-It-Works Section
      gsap.from('.workflow-header', {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '#how-it-works',
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      });

      gsap.from('.step-card-item', {
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.workflow-grid',
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
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
      <header className="landing-header sticky top-0 z-40 w-full bg-slate-950/80 border-b border-slate-800/80 backdrop-blur-xl">
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
              <span className="text-base font-semibold text-white tracking-tight">StudySphere</span>
              <span className="hidden sm:block text-[10px] uppercase font-mono tracking-wider text-slate-400 font-medium">
                Workspace
              </span>
            </div>
          </a>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#tutor" className="hover:text-white transition-colors">
              Study Tutor
            </a>
            <a href="#how-it-works" className="hover:text-white transition-colors">
              Workflow
            </a>
            <button
              onClick={() => setIsAboutOpen(true)}
              className="hover:text-white transition-colors cursor-pointer"
            >
              About
            </button>
            <button
              onClick={() => setIsFeedbackOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 hover:text-white transition-colors cursor-pointer border border-indigo-500/20 font-medium"
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
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs border border-blue-400/30 flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              Get Started
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            {/* Top Badge */}
            <div className="hero-badge inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-normal">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>Academic Workspace & Structured Study Platform</span>
            </div>

            {/* Main Headline */}
            <h1 className="hero-title text-4xl sm:text-5xl lg:text-6xl font-semibold text-slate-100 tracking-tight leading-[1.15]">
              Study with clarity.{' '}
              <span className="text-slate-300 font-normal">Master your syllabus.</span>
            </h1>

            {/* Supporting Text */}
            <p className="hero-desc text-sm sm:text-base text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
              A focused workspace designed for students and educators. Organize course notes, clarify complex topics, practice chapter quizzes, and track study consistency.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-3">
              <button
                onClick={() => onNavigate('/register')}
                className="hero-cta-btn w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs border border-blue-400/30 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
              >
                Create Free Account
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <a
                href="#features"
                className="hero-cta-btn w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-medium text-xs flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Play className="w-3.5 h-3.5 text-slate-400" />
                Explore Platform
              </a>
            </div>

            {/* Quick Metrics */}
            <div className="pt-8 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="hero-metrics-item">
                <div className="text-xl font-medium text-slate-100">100%</div>
                <div className="text-xs text-slate-400 font-normal">Modular Workspace</div>
              </div>
              <div className="hero-metrics-item">
                <div className="text-xl font-medium text-blue-400">3 Modes</div>
                <div className="text-xs text-slate-400 font-normal">Tutor Explanation Depths</div>
              </div>
              <div className="hero-metrics-item">
                <div className="text-xl font-medium text-slate-200">Interactive</div>
                <div className="text-xs text-slate-400 font-normal">Diagnostic Quizzes</div>
              </div>
            </div>
          </div>

          {/* Right 3D Visual Canvas */}
          <div className="hero-3d-wrapper lg:col-span-6 h-[460px] sm:h-[500px] w-full">
            <LearningNetwork3D />
          </div>
        </div>

        {/* Feature Trust Strip */}
        <div className="hero-trust-strip mt-14 py-4 px-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-wrap items-center justify-around gap-6 text-xs text-slate-400">
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
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="features-header text-center max-w-3xl mx-auto mb-16 space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-widest text-blue-400">
            Platform Capabilities
          </h2>
          <p className="text-2xl sm:text-3xl font-medium text-slate-100">
            Engineered for Deep Academic Comprehension
          </p>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto font-normal">
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
                    className="h-full p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 backdrop-blur-md flex flex-col justify-between transition-all group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-9 h-9 rounded-xl bg-slate-800/90 border border-slate-700/60 flex items-center justify-center text-slate-300 group-hover:text-blue-400 group-hover:border-blue-500/30 transition-colors">
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700/80">
                          {card.tag}
                        </span>
                      </div>
                      <h3 className="text-sm font-medium text-slate-200 mb-2 group-hover:text-blue-300 transition-colors">
                        {card.title}
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed font-normal">{card.description}</p>
                    </div>
                    <button
                      onClick={() => onNavigate('/register')}
                      className="mt-5 text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 group-hover:translate-x-1 transition-all"
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
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="workflow-header text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-widest text-blue-400">
            Structured Workflow
          </h2>
          <p className="text-2xl sm:text-3xl font-medium text-slate-100">How You Progress Through Your Courses</p>
        </div>

        <div className="workflow-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            return (
              <div key={index} className="step-card-item h-full">
                <TiltCard3D className="h-full">
                  <div className="h-full p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-mono text-slate-500 font-medium">
                        {step.number}
                      </span>
                      <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                        <StepIcon className="w-4 h-4" />
                      </div>
                    </div>
                    <h3 className="text-sm font-medium text-slate-200">{step.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed font-normal">{step.description}</p>
                  </div>
                </TiltCard3D>
              </div>
            );
          })}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer py-10 border-t border-slate-800/80 bg-slate-950 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" />
            <span className="font-medium text-slate-200 text-xs">StudySphere</span>
          </div>
          <div className="flex flex-wrap items-center gap-5 sm:gap-6 text-slate-400 text-xs">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">Workflow</a>
            <button onClick={() => setIsAboutOpen(true)} className="hover:text-white transition-colors cursor-pointer">About Us</button>
            <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Terms</a>
            <button onClick={() => setIsFeedbackOpen(true)} className="hover:text-indigo-400 text-indigo-300 font-medium transition-colors cursor-pointer">Give Feedback</button>
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
