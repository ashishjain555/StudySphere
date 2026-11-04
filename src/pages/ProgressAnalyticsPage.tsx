import React from 'react';
import { TrendingUp, Flame, Clock, Award, CheckCircle2, BookOpen, BarChart3, AlertCircle } from 'lucide-react';
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
} from 'recharts';
import { DataStore } from '../lib/dataStore';

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
        dayMap[name] = (dayMap[name] || 0) + (t.durationMins || 30) / 60;
      }
    });

  quizAttempts.forEach((qa) => {
    const d = new Date(qa.completedAt);
    if (!isNaN(d.getTime())) {
      const name = dayNames[d.getDay()];
      const hrs = qa.timeTakenSeconds > 0 ? qa.timeTakenSeconds / 3600 : 0.25;
      dayMap[name] = (dayMap[name] || 0) + hrs;
    }
  });

  const weeklyHours = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => ({
    day,
    hours: Math.round((dayMap[day] || 0) * 10) / 10,
  }));

  const radarData = subjects.map((s) => ({
    subject: s.code,
    score: s.progressPercentage || 0,
  }));

  const quizTrendData = quizAttempts.slice(-10).map((qa, idx) => ({
    attempt: `Q${idx + 1}: ${qa.subjectName.slice(0, 8)}`,
    score: qa.scorePercentage,
  }));

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-emerald-400" />
          Progress & Learning Analytics
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Monitor your study hours, quiz mastery trends, and subject completion rates.
        </p>
      </div>

      {/* KPI Stats Grid - All dynamic based on DataStore */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-3xl glass-card border-gray-800 text-center space-y-1">
          <div className="text-3xl font-extrabold text-white">
            {stats.weeklyStudyHours} hrs
          </div>
          <div className="text-xs text-gray-400 font-medium">Weekly Study Hours</div>
        </div>

        <div className="p-6 rounded-3xl glass-card border-gray-800 text-center space-y-1">
          <div className="text-3xl font-extrabold text-amber-400 flex items-center justify-center gap-1">
            <Flame className="w-6 h-6 fill-amber-400" />
            {stats.activeStreak} Days
          </div>
          <div className="text-xs text-gray-400 font-medium">
            Active Streak (Longest: {stats.longestStreak})
          </div>
        </div>

        <div className="p-6 rounded-3xl glass-card border-gray-800 text-center space-y-1">
          <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">
            {stats.quizAccuracyAvg}%
          </div>
          <div className="text-xs text-gray-400 font-medium">Quiz Accuracy Average</div>
        </div>

        <div className="p-6 rounded-3xl glass-card border-gray-800 text-center space-y-1">
          <div className="text-3xl font-extrabold text-cyan-600 dark:text-cyan-400">
            {stats.topicsCompleted} / {stats.totalTopicsCount}
          </div>
          <div className="text-xs text-gray-400 font-medium">Topics Completed</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Weekly Hours */}
        <div className="lg:col-span-6 p-6 rounded-3xl glass-panel border border-gray-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Weekly Study Hours
            </h2>
            <span className="text-xs text-gray-400 font-mono">
              Total: {stats.weeklyStudyHours} hrs
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyHours}>
                <XAxis dataKey="day" stroke="#9CA3AF" fontSize={12} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} unit="h" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    borderColor: '#374151',
                    borderRadius: '0.75rem',
                    color: '#F9FAFB',
                    fontSize: '12px',
                  }}
                  formatter={(value: any) => [`${value} hrs`, 'Study Time']}
                />
                <Bar dataKey="hours" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject Proficiency Radar */}
        <div className="lg:col-span-6 p-6 rounded-3xl glass-panel border border-gray-800 space-y-4">
          <h2 className="text-base font-bold text-gray-100 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            Subject Proficiency Matrix
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="subject" stroke="#9CA3AF" fontSize={11} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#6B7280" fontSize={10} />
                <Radar name="Proficiency" dataKey="score" stroke="#2563EB" fill="#2563EB" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quiz Performance Progression */}
        <div className="lg:col-span-12 p-6 rounded-3xl glass-panel border border-gray-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-100 flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-500 dark:text-blue-400" />
              Quiz Performance Trend
            </h2>
            <span className="text-xs text-gray-400 font-mono">
              {quizAttempts.length} Total Quizzes Taken
            </span>
          </div>

          {quizTrendData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={quizTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                  <XAxis dataKey="attempt" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#9CA3AF" fontSize={12} tickLine={false} unit="%" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111827',
                      borderColor: '#374151',
                      borderRadius: '0.75rem',
                      color: '#F9FAFB',
                      fontSize: '12px',
                    }}
                    formatter={(value: any) => [`${value}%`, 'Score']}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#2563EB"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#2563EB' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="p-8 text-center border border-dashed border-gray-800 rounded-2xl space-y-2">
              <BarChart3 className="w-8 h-8 text-gray-600 mx-auto" />
              <p className="text-sm font-semibold text-gray-300">No Quiz Attempts Recorded Yet</p>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Generate and complete quizzes in the Quiz Generator to unlock live accuracy trajectories and mastery tracking.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
