import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  MessageSquare,
  Upload,
  HelpCircle,
  Calendar,
  Flame,
  Clock,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  FileText,
  ChevronRight,
  Plus,
  Sparkles,
  Zap,
  Target,
  Trophy,
  Brain,
  Lightbulb,
  ArrowUpRight,
  BarChart3,
  Award,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { DataStore } from '../lib/dataStore';
import { StudyPlanTask, WeakTopic, Subject, StudyMaterial } from '../types';
import { TiltCard3D } from '../components/3d/TiltCard3D';

interface DashboardPageProps {
  onNavigate: (path: string) => void;
  onAskAI: (query: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate, onAskAI }) => {
  const { user } = useAuth();

  const [subjects] = useState<Subject[]>(() => DataStore.getSubjects().slice(0, 4));
  const [tasks, setTasks] = useState<StudyPlanTask[]>(() => DataStore.getTasks());
  const [weakTopics] = useState<WeakTopic[]>(() => DataStore.getWeakTopics().slice(0, 2));
  const [materials, setMaterials] = useState<StudyMaterial[]>(() => DataStore.getMaterials().slice(0, 3));
  const [quizAttempts] = useState(() => DataStore.getQuizAttempts());
  const [quickPrompt, setQuickPrompt] = useState('');

  useEffect(() => {
    const handleUpdate = () => {
      setMaterials(DataStore.getMaterials().slice(0, 3));
      setTasks(DataStore.getTasks());
    };
    window.addEventListener('studysphere:materials_update', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('studysphere:materials_update', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Compute Weekly Study Hours dynamically from real activity
  const weeklyHoursData = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0: Sun, 1: Mon...
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);

    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return weekDays.map((dayName, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      const dateStr = d.toISOString().split('T')[0];

      // Sum task duration for completed tasks
      const taskHours = tasks
        .filter((t) => t.isCompleted && t.dueDate && t.dueDate.startsWith(dateStr))
        .reduce((sum, t) => sum + (t.duration ? t.duration / 60 : 0.75), 0);

      // Add 0.5 hours per quiz attempt
      const quizHours = quizAttempts
        .filter((q: any) => {
          const qDate = q.completedAt || q.date;
          return qDate && qDate.startsWith(dateStr);
        })
        .length * 0.5;

      const total = parseFloat((taskHours + quizHours).toFixed(1));
      return {
        day: dayName,
        hours: total,
        date: dateStr,
        isToday: dateStr === today.toISOString().split('T')[0],
      };
    });
  }, [tasks, quizAttempts]);

  // Academic Progress Metrics
  const stats = useMemo(() => DataStore.getStatsSummary(), [tasks, quizAttempts, subjects]);
  const completedTasks = tasks.filter((t) => t.isCompleted);
  const calculatedWeeklyHours = weeklyHoursData.reduce((acc, curr) => acc + curr.hours, 0);
  const displayHours = (calculatedWeeklyHours > 0 ? calculatedWeeklyHours.toFixed(1) : stats.weeklyStudyHours.toFixed(1));
  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 100;

  const handleToggleTask = (taskId: string) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        const nextState = !t.isCompleted;
        if (nextState) {
          confetti({
            particleCount: 40,
            spread: 55,
            origin: { y: 0.65 },
          });
        }
        return { ...t, isCompleted: nextState };
      }
      return t;
    });
    setTasks(updated);
    const target = updated.find((t) => t.id === taskId);
    if (target) DataStore.saveTask(target);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const handleQuickAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPrompt.trim()) return;
    onAskAI(quickPrompt.trim());
  };

  // Daily Rotating Academic Motivation
  const motivationalQuotes = [
    { quote: 'Small daily disciplines compounded over time lead to extraordinary academic excellence.', author: 'StudySphere Insight' },
    { quote: 'The expert in any field was once a beginner who refused to quit.', author: 'Helen Hayes' },
    { quote: 'Active recall and spaced repetition form the cornerstone of lifelong mastery.', author: 'Cognitive Science' },
    { quote: 'Consistency beats intensity. 45 focused minutes every day outweighs cramming.', author: 'Deep Work' },
  ];
  const todayQuote = motivationalQuotes[new Date().getDate() % motivationalQuotes.length];

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Top Banner Greeting with 3D Tilt */}
      <TiltCard3D maxTilt={3} className="w-full">
        <div className="p-7 sm:p-8 rounded-3xl glass-panel border border-slate-800/80 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/80 relative overflow-hidden shadow-2xl">
          {/* Subtle Ambient Glow Spheres in Backdrop */}
          <div className="absolute -top-16 -left-16 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            {/* Greeting & Identity */}
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-300 text-xs font-semibold border border-blue-500/25">
                  <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                  Study Workspace Active
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 text-xs font-semibold border border-emerald-500/25">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  {tasks.length > 0 ? `${completedTasks.length}/${tasks.length} Tasks Done` : 'Semester Active'}
                </div>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                {getGreeting()},{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
                  {user?.fullName || 'Scholar'}
                </span>{' '}
                👋
              </h1>

              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Your AI-powered study cockpit is ready. Track your weekly momentum, master weak topics, and prepare for exams with confidence.
              </p>

              {/* Integrated AI Tutor Quick Ask Prompt */}
              <form onSubmit={handleQuickAsk} className="pt-2 w-full max-w-lg">
                <div className="relative flex items-center group">
                  <div className="absolute left-3.5 flex items-center pointer-events-none text-blue-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={quickPrompt}
                    onChange={(e) => setQuickPrompt(e.target.value)}
                    placeholder="Ask AI Tutor anything (e.g. 'Explain Recursion', 'Newton's laws')..."
                    className="w-full pl-10 pr-24 py-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 focus:border-blue-500/60 text-slate-100 placeholder-slate-500 text-xs sm:text-sm transition-all focus:outline-none focus:ring-1 focus:ring-blue-500/30 shadow-inner"
                  />
                  <button
                    type="submit"
                    disabled={!quickPrompt.trim()}
                    className="absolute right-1.5 px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white font-medium text-xs transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                  >
                    <span>Ask</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>

            {/* Quick Metrics & Streak Badge Counters */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full lg:w-auto shrink-0">
              {/* Study Streak */}
              <div className="flex-1 sm:flex-initial px-5 py-3.5 rounded-2xl glass-card border border-slate-800 bg-slate-900/70 text-center min-w-[105px]">
                <div className="flex items-center justify-center gap-1.5 text-amber-400 font-bold text-lg">
                  <Flame className="w-5 h-5 fill-amber-400 animate-pulse" />
                  {stats.activeStreak || (quizAttempts.length > 0 ? `${quizAttempts.length} Days` : '1 Day')}
                </div>
                <div className="text-[11px] text-slate-400 font-medium">Study Streak</div>
              </div>

              {/* Weekly Time */}
              <div className="flex-1 sm:flex-initial px-5 py-3.5 rounded-2xl glass-card border border-slate-800 bg-slate-900/70 text-center min-w-[105px]">
                <div className="flex items-center justify-center gap-1.5 text-blue-400 font-bold text-lg">
                  <Clock className="w-5 h-5" />
                  {displayHours}h
                </div>
                <div className="text-[11px] text-slate-400 font-medium">This Week</div>
              </div>

              {/* Quizzes Taken */}
              <div className="flex-1 sm:flex-initial px-5 py-3.5 rounded-2xl glass-card border border-slate-800 bg-slate-900/70 text-center min-w-[105px]">
                <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-bold text-lg">
                  <Target className="w-5 h-5 text-emerald-400" />
                  {quizAttempts.length}
                </div>
                <div className="text-[11px] text-slate-400 font-medium">Quizzes Taken</div>
              </div>
            </div>
          </div>
        </div>
      </TiltCard3D>

      {/* Quick Action Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Study Tutor */}
        <TiltCard3D maxTilt={6} className="h-full">
          <button
            onClick={() => onNavigate('/app/ai-tutor')}
            className="w-full h-full p-5 rounded-2xl glass-card border-slate-800 hover:border-blue-500/40 text-left transition-all group flex flex-col justify-between cursor-pointer relative overflow-hidden bg-slate-900/50"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/25 group-hover:scale-105 transition-transform shadow-sm">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  24/7 AI
                </span>
              </div>
              <div>
                <div className="font-bold text-sm text-slate-100 group-hover:text-blue-300 transition-colors">
                  AI Study Tutor
                </div>
                <div className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                  Concept breakdowns, code explanations & exam tips.
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-blue-400 font-semibold group-hover:text-blue-300">
              <span>Start Session</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </TiltCard3D>

        {/* Upload PDF */}
        <TiltCard3D maxTilt={6} className="h-full">
          <button
            onClick={() => onNavigate('/app/pdf-analyzer')}
            className="w-full h-full p-5 rounded-2xl glass-card border-slate-800 hover:border-cyan-500/40 text-left transition-all group flex flex-col justify-between cursor-pointer relative overflow-hidden bg-slate-900/50"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/25 group-hover:scale-105 transition-transform shadow-sm">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/25">
                  OCR + Q&A
                </span>
              </div>
              <div>
                <div className="font-bold text-sm text-slate-100 group-hover:text-cyan-300 transition-colors">
                  PDF Analyzer
                </div>
                <div className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                  Instant chapter notes, formulas & textbook summaries.
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-cyan-400 font-semibold group-hover:text-cyan-300">
              <span>Analyze Doc</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </TiltCard3D>

        {/* Start Quiz */}
        <TiltCard3D maxTilt={6} className="h-full">
          <button
            onClick={() => onNavigate('/app/quiz')}
            className="w-full h-full p-5 rounded-2xl glass-card border-slate-800 hover:border-indigo-500/40 text-left transition-all group flex flex-col justify-between cursor-pointer relative overflow-hidden bg-slate-900/50"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/25 group-hover:scale-105 transition-transform shadow-sm">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/25">
                  +XP Streak
                </span>
              </div>
              <div>
                <div className="font-bold text-sm text-slate-100 group-hover:text-indigo-300 transition-colors">
                  Adaptive Quiz
                </div>
                <div className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                  Diagnostic MCQs, instant rationale & exam simulations.
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-indigo-400 font-semibold group-hover:text-indigo-300">
              <span>Practice Now</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </TiltCard3D>

        {/* Plan Study */}
        <TiltCard3D maxTilt={6} className="h-full">
          <button
            onClick={() => onNavigate('/app/planner')}
            className="w-full h-full p-5 rounded-2xl glass-card border-slate-800 hover:border-amber-500/40 text-left transition-all group flex flex-col justify-between cursor-pointer relative overflow-hidden bg-slate-900/50"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/25 group-hover:scale-105 transition-transform shadow-sm">
                  <Calendar className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/25">
                  Schedule
                </span>
              </div>
              <div>
                <div className="font-bold text-sm text-slate-100 group-hover:text-amber-300 transition-colors">
                  Study Planner
                </div>
                <div className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                  Pomodoro targets, calendar scheduling & deadlines.
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-amber-400 font-semibold group-hover:text-amber-300">
              <span>View Tasks</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </TiltCard3D>
      </div>

      {/* Weak Topics Diagnostics Widget */}
      <div className="p-6 rounded-2xl glass-panel border border-slate-800 bg-slate-900/60 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
                Weak Topics Diagnostics
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                  AI Analyzed
                </span>
              </h2>
              <p className="text-xs text-slate-400">Targeted areas where quick revision yields high score improvements</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('/app/weak-topics')}
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {weakTopics.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {weakTopics.map((wt) => (
              <div
                key={wt.id}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 hover:border-slate-700/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
                      {wt.subjectName}
                    </span>
                    <span className="text-xs font-mono text-rose-400 font-semibold">
                      {wt.accuracyPercentage}% Accuracy
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-slate-200">{wt.topicName}</div>
                  <div className="w-36 h-1.5 rounded-full bg-slate-800 overflow-hidden mt-1">
                    <div
                      className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full"
                      style={{ width: `${Math.max(10, wt.accuracyPercentage)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onAskAI(`Explain ${wt.topicName} in detail with step-by-step examples and key exam tips.`)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 text-xs font-semibold border border-blue-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Brain className="w-3.5 h-3.5 text-blue-400" />
                    Ask Tutor
                  </button>
                  <button
                    onClick={() => onNavigate('/app/quiz')}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Target className="w-3.5 h-3.5 text-amber-400" />
                    Quiz
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-slate-300">
              <Trophy className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>No weak topics detected yet! Complete quizzes to benchmark your concept strengths.</span>
            </div>
            <button
              onClick={() => onNavigate('/app/quiz')}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shrink-0 self-start sm:self-auto cursor-pointer transition-all shadow-sm"
            >
              Take First Quiz
            </button>
          </div>
        )}
      </div>

      {/* Middle Grid: Weekly Study Momentum & Today's Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Study Momentum Chart (8 cols) */}
        <div className="lg:col-span-8 p-6 rounded-3xl glass-panel border border-slate-800 bg-slate-900/60 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                Weekly Study Time & Focus
              </h2>
              <p className="text-xs text-slate-400">
                Logged automatically through completed study tasks & adaptive quiz sessions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                This Week: <strong className="text-blue-400">{totalWeeklyHours} hrs</strong>
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyHoursData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="studyBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.85} />
                    <stop offset="100%" stopColor="#1D4ED8" stopOpacity={0.35} />
                  </linearGradient>
                  <linearGradient id="activeBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60A5FA" stopOpacity={1} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  stroke="#64748B"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#1E293B' }}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#1E293B' }}
                  unit="h"
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3 rounded-xl bg-slate-900/95 border border-slate-700/80 shadow-xl backdrop-blur-md text-xs space-y-1">
                          <p className="font-bold text-slate-200">{label} ({data.date || 'Study Day'})</p>
                          <p className="text-blue-400 font-semibold flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {payload[0].value} hours logged
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {Number(payload[0].value) > 0 ? 'Solid momentum logged!' : 'No sessions recorded yet.'}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="hours" radius={[6, 6, 2, 2]}>
                  {weeklyHoursData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isToday ? 'url(#activeBarGrad)' : 'url(#studyBarGrad)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Motivation & Consistency Insight */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div className="text-xs text-slate-300">
              <span className="font-semibold text-white">Daily Principle: </span>
              {todayQuote.quote}{' '}
              <span className="text-slate-500 font-mono italic">— {todayQuote.author}</span>
            </div>
          </div>
        </div>

        {/* Right: Today's Tasks Widget (4 cols) */}
        <div className="lg:col-span-4 p-6 rounded-3xl glass-panel border border-slate-800 bg-slate-900/60 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                Today's Focus Tasks
              </h2>
              <button
                onClick={() => onNavigate('/app/planner')}
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-0.5 transition-colors cursor-pointer"
              >
                <span>Planner</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {tasks.length > 0 ? (
                tasks.slice(0, 4).map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleToggleTask(task.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                      task.isCompleted
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-slate-400'
                        : 'bg-slate-950/70 border-slate-800 text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        task.isCompleted
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-slate-700 bg-slate-900'
                      }`}
                    >
                      {task.isCompleted && <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-xs font-semibold truncate ${
                          task.isCompleted ? 'line-through text-slate-500' : 'text-slate-200'
                        }`}
                      >
                        {task.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono text-slate-400">{task.subjectName}</span>
                        {task.duration && (
                          <span className="text-[10px] text-slate-500 font-mono flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {task.duration}m
                          </span>
                        )}
                        {task.priority === 'high' && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/15 text-rose-300 font-semibold border border-rose-500/30">
                            High
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400 space-y-2.5 bg-slate-950/40 rounded-2xl border border-slate-800/80 p-6">
                  <p className="text-xs text-slate-300">No study tasks scheduled for today.</p>
                  <button
                    onClick={() => onNavigate('/app/planner')}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Study Task
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Task Summary Footer */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>
              Done: <strong className="text-white">{completedTasks.length}</strong> of {tasks.length}
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-20 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
              <span className="font-mono text-slate-300 text-[11px]">{completionRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Curriculum Subjects & Course Materials */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Curriculum Subjects (8 cols) */}
        <div className="lg:col-span-8 p-6 rounded-3xl glass-panel border border-slate-800 bg-slate-900/60 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                Curriculum Subjects
              </h2>
              <p className="text-xs text-slate-400">Core courses and academic syllabus progress</p>
            </div>
            <button
              onClick={() => onNavigate('/app/subjects')}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>All Subjects</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {subjects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {subjects.map((subj) => (
                <TiltCard3D key={subj.id} maxTilt={5}>
                  <div
                    onClick={() => onNavigate(`/app/subjects/${subj.id}`)}
                    className="p-5 rounded-2xl glass-card border-slate-800 hover:border-blue-500/40 cursor-pointer transition-all space-y-3 group bg-slate-950/60 h-full flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/25">
                          {subj.code}
                        </span>
                        <span className="text-xs font-bold text-slate-300 font-mono">
                          {subj.progressPercentage}%
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-100 group-hover:text-blue-300 transition-colors line-clamp-1">
                        {subj.name}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {subj.description}
                      </p>
                    </div>

                    <div className="space-y-1 pt-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>{subj.topicCount || 12} topics</span>
                        <span className="text-blue-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                          Study <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all"
                          style={{ width: `${Math.max(5, subj.progressPercentage)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </TiltCard3D>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 space-y-3 bg-slate-950/40 rounded-2xl border border-slate-800/80 p-6">
              <BookOpen className="w-7 h-7 text-cyan-400/60 mx-auto" />
              <p className="text-xs text-slate-300">No curriculum subjects enrolled yet.</p>
              <button
                onClick={() => onNavigate('/app/subjects')}
                className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Your First Subject
              </button>
            </div>
          )}
        </div>

        {/* Right: Course Materials (4 cols) */}
        <div className="lg:col-span-4 p-6 rounded-3xl glass-panel border border-slate-800 bg-slate-900/60 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  Course Materials
                </h2>
                <p className="text-xs text-slate-400">Recent notes & files</p>
              </div>
              <button
                onClick={() => onNavigate('/app/materials')}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-0.5 transition-colors cursor-pointer"
              >
                <span>Library</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {materials.length > 0 ? (
                materials.map((mat) => (
                  <div
                    key={mat.id}
                    onClick={() => {
                      try {
                        sessionStorage.setItem('studysphere_highlight_material', mat.id);
                      } catch {}
                      onNavigate('/app/materials');
                    }}
                    className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 shrink-0 group-hover:scale-105 transition-transform">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-semibold text-slate-200 group-hover:text-blue-300 transition-colors truncate">
                          {mat.title}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {mat.fileSize || 'PDF Document'}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-slate-400 space-y-2.5 bg-slate-950/40 rounded-2xl border border-slate-800/80 p-5">
                  <p className="text-xs text-slate-300">No course materials uploaded yet.</p>
                  <button
                    onClick={() => onNavigate('/app/materials')}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Upload Notes / PDF
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80">
            <button
              onClick={() => onNavigate('/app/pdf-analyzer')}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-700/60 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-blue-400" />
              <span>Upload New PDF Document</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
