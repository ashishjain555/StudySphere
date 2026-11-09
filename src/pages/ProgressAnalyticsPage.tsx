import React, { useMemo } from 'react';
import {
  TrendingUp,
  Flame,
  Clock,
  Award,
  CheckCircle2,
  BookOpen,
  BarChart3,
  AlertCircle,
  Target,
  Sparkles,
  Layers,
  Lightbulb,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  CartesianGrid,
  Cell,
} from 'recharts';
import { DataStore } from '../lib/dataStore';
import { TiltCard3D } from '../components/3d/TiltCard3D';

export const ProgressAnalyticsPage: React.FC = () => {
  const subjects = DataStore.getSubjects();
  const quizAttempts = DataStore.getQuizAttempts();
  const tasks = DataStore.getTasks();
  const stats = DataStore.getStatsSummary();

  // Dynamically compute weekly hours from completed tasks & quiz attempts
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayMap: Record<string, number> = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };

  tasks
    .filter((t) => t.isCompleted)
    .forEach((t) => {
      const d = new Date(t.dueDate || t.createdAt);
      if (!isNaN(d.getTime())) {
        const name = dayNames[d.getDay()];
        dayMap[name] = (dayMap[name] || 0) + (t.duration || t.durationMins || 30) / 60;
      }
    });

  quizAttempts.forEach((qa) => {
    const d = new Date(qa.completedAt || qa.date || '');
    if (!isNaN(d.getTime())) {
      const name = dayNames[d.getDay()];
      const hrs = qa.timeTakenSeconds > 0 ? qa.timeTakenSeconds / 3600 : 0.25;
      dayMap[name] = (dayMap[name] || 0) + hrs;
    }
  });

  const today = new Date();
  const todayDayName = dayNames[today.getDay()];

  const weeklyHours = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => ({
    day,
    hours: Math.round((dayMap[day] || 0) * 10) / 10,
    isToday: day === todayDayName,
  }));

  const radarData = useMemo(() => {
    return subjects.map((s) => ({
      subject: s.code || s.name.slice(0, 10),
      score: s.progressPercentage || 0,
      fullMark: 100,
    }));
  }, [subjects]);

  const quizTrendData = useMemo(() => {
    if (quizAttempts.length === 0) {
      return [
        { attempt: 'Start', score: 0 },
      ];
    }
    return quizAttempts.slice(-10).map((qa, idx) => ({
      attempt: `Q${idx + 1}`,
      title: qa.quizTitle || qa.topicTitle || 'Quiz',
      score: qa.percentage || qa.scorePercentage || Math.round((qa.score / (qa.totalQuestions || 1)) * 100),
    }));
  }, [quizAttempts]);

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <span>Progress & Learning Analytics</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Monitor your study hours, quiz mastery trajectories, and subject completion benchmarks in real-time.
        </p>
      </div>

      {/* KPI Stats Grid - All dynamic based on DataStore */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <TiltCard3D maxTilt={4}>
          <div className="p-5 rounded-2xl glass-card border border-slate-800 bg-slate-900/60 text-center space-y-1 h-full flex flex-col justify-center">
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {stats.totalHours || stats.weeklyStudyHours}h
            </div>
            <div className="text-xs text-slate-400 font-medium">Study Hours Logged</div>
          </div>
        </TiltCard3D>

        <TiltCard3D maxTilt={4}>
          <div className="p-5 rounded-2xl glass-card border border-slate-800 bg-slate-900/60 text-center space-y-1 h-full flex flex-col justify-center">
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 flex items-center justify-center gap-1.5 font-mono">
              <Flame className="w-6 h-6 fill-amber-400 animate-pulse" />
              {stats.activeStreak || 1} Days
            </div>
            <div className="text-xs text-slate-400 font-medium">
              Study Streak
            </div>
          </div>
        </TiltCard3D>

        <TiltCard3D maxTilt={4}>
          <div className="p-5 rounded-2xl glass-card border border-slate-800 bg-slate-900/60 text-center space-y-1 h-full flex flex-col justify-center">
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-400 font-mono">
              {stats.quizAccuracyAvg}%
            </div>
            <div className="text-xs text-slate-400 font-medium">Quiz Accuracy Average</div>
          </div>
        </TiltCard3D>

        <TiltCard3D maxTilt={4}>
          <div className="p-5 rounded-2xl glass-card border border-slate-800 bg-slate-900/60 text-center space-y-1 h-full flex flex-col justify-center">
            <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400 font-mono">
              {stats.topicsCompleted} / {stats.totalTopicsCount}
            </div>
            <div className="text-xs text-slate-400 font-medium">Topics Mastered</div>
          </div>
        </TiltCard3D>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Weekly Hours Bar Chart (8 cols) */}
        <div className="lg:col-span-8 p-6 rounded-3xl glass-panel border border-slate-800 bg-slate-900/60 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              Weekly Study Momentum
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              Week Total: <strong className="text-blue-400">{stats.weeklyStudyHours} hrs</strong>
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyHours} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="analyticsBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.85} />
                    <stop offset="100%" stopColor="#1D4ED8" stopOpacity={0.35} />
                  </linearGradient>
                  <linearGradient id="analyticsTodayGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60A5FA" stopOpacity={1} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#64748B" fontSize={12} tickLine={false} axisLine={{ stroke: '#1E293B' }} />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={{ stroke: '#1E293B' }} unit="h" />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="p-3 rounded-xl bg-slate-900/95 border border-slate-700/80 shadow-xl backdrop-blur-md text-xs space-y-1">
                          <p className="font-bold text-slate-200">{label}</p>
                          <p className="text-blue-400 font-semibold">{payload[0].value} hours logged</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="hours" radius={[6, 6, 2, 2]}>
                  {weeklyHours.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isToday ? 'url(#analyticsTodayGrad)' : 'url(#analyticsBarGrad)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div className="text-xs text-slate-300">
              <span className="font-semibold text-white">Study Habit Recommendation: </span>
              Completing 45 focused minutes each day yields 3x higher retention than cramming for 5 hours right before exams.
            </div>
          </div>
        </div>

        {/* Subject Mastery Radar (4 cols) */}
        <div className="lg:col-span-4 p-6 rounded-3xl glass-panel border border-slate-800 bg-slate-900/60 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              Syllabus Balance
            </h2>
            <span className="text-[11px] text-slate-400 font-mono">By Course</span>
          </div>

          {radarData.length >= 3 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" stroke="#94A3B8" fontSize={11} />
                  <PolarRadiusAxis stroke="#64748B" domain={[0, 100]} fontSize={10} />
                  <Radar name="Completion %" dataKey="score" stroke="#06B6D4" fill="#06B6D4" fillOpacity={0.35} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
              <Layers className="w-8 h-8 text-cyan-400/50" />
              <p className="text-xs text-slate-300">Enrol in 3 or more subjects to unlock full radar analysis.</p>
            </div>
          )}
        </div>

        {/* Quiz Score Trajectory (12 cols) */}
        <div className="lg:col-span-12 p-6 rounded-3xl glass-panel border border-slate-800 bg-slate-900/60 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" />
                Quiz Score Trajectory & Diagnostic Trend
              </h2>
              <p className="text-xs text-slate-400">Tracking score improvements across your recent practice sessions</p>
            </div>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-800 text-emerald-400 border border-slate-700 font-bold">
              Avg: {stats.quizAccuracyAvg}%
            </span>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={quizTrendData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="attempt" stroke="#64748B" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} domain={[0, 100]} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#F8FAFC',
                    fontSize: '12px',
                  }}
                  formatter={(value: any) => [`${value}%`, 'Accuracy']}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#10B981', stroke: '#064E3B' }}
                  activeDot={{ r: 6, fill: '#34D399' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
