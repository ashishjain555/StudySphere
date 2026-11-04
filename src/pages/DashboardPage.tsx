import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { DataStore } from '../lib/dataStore';
import { StudyPlanTask, WeakTopic, Subject, StudyMaterial } from '../types';

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

  useEffect(() => {
    const handleUpdate = () => {
      setMaterials(DataStore.getMaterials().slice(0, 3));
    };
    window.addEventListener('studysphere:materials_update', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('studysphere:materials_update', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const weeklyHoursData = [
    { day: 'Mon', hours: 0 },
    { day: 'Tue', hours: 0 },
    { day: 'Wed', hours: 0 },
    { day: 'Thu', hours: 0 },
    { day: 'Fri', hours: 0 },
    { day: 'Sat', hours: 0 },
    { day: 'Sun', hours: 0 },
  ];

  const handleToggleTask = (taskId: string) => {
    const updated = tasks.map((t) => (t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t));
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

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner Greeting */}
      <div className="p-8 rounded-3xl glass-panel border border-slate-800/80 bg-slate-900/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 text-slate-300 text-xs font-medium border border-slate-700/60">
            <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
            Study Workspace Active
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {getGreeting()}, <span className="text-slate-100 font-semibold">{user?.fullName || 'Scholar'}</span> 👋
          </h1>
          <p className="text-sm text-slate-400">
            Ready to continue learning? Track your study plans, curriculum subjects, and diagnostics.
          </p>
        </div>

        <div className="flex items-center gap-4 relative z-10 shrink-0">
          {/* Quick Assistant Launcher Tile */}
          <div
            onClick={() => onNavigate('/app/ai-tutor')}
            className="hidden sm:flex flex-col items-center justify-center px-4 py-2.5 rounded-2xl glass-card border-slate-800 hover:border-slate-700 transition-all cursor-pointer group"
            title="Launch Study Tutor"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
              <MessageSquare className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono text-slate-400 font-medium mt-1 group-hover:text-slate-200 transition-colors flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Tutor Ready
            </span>
          </div>

          <div className="px-5 py-3 rounded-2xl glass-card border-gray-800 text-center">
            <div className="flex items-center justify-center gap-1.5 text-amber-400 font-bold text-lg">
              <Flame className="w-5 h-5 fill-amber-400" />
              {quizAttempts.length > 0 ? '1 Day' : '0 Days'}
            </div>
            <div className="text-[11px] text-gray-400 font-medium">Study Streak</div>
          </div>

          <div className="px-5 py-3 rounded-2xl glass-card border-gray-800 text-center">
            <div className="flex items-center justify-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold text-lg">
              <Clock className="w-5 h-5" />
              {quizAttempts.length * 0.5} hrs
            </div>
            <div className="text-[11px] text-gray-400 font-medium">This Week</div>
          </div>
        </div>
      </div>

      {/* Quick Action Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => onNavigate('/app/ai-tutor')}
          className="p-5 rounded-2xl glass-card border-gray-800 hover:border-blue-500/50 text-left transition-all group flex items-center justify-between"
        >
          <div className="space-y-1">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-500/30 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="font-bold text-sm text-gray-100 mt-2">Study Tutor</div>
            <div className="text-xs text-gray-400">Structured explanations</div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-500 group-hover:translate-x-1 group-hover:text-blue-400 transition-all" />
        </button>

        <button
          onClick={() => onNavigate('/app/pdf-analyzer')}
          className="p-5 rounded-2xl glass-card border-gray-800 hover:border-cyan-500/50 text-left transition-all group flex items-center justify-between"
        >
          <div className="space-y-1">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30 group-hover:scale-110 transition-transform">
              <Upload className="w-5 h-5" />
            </div>
            <div className="font-bold text-sm text-gray-100 mt-2">Upload PDF</div>
            <div className="text-xs text-gray-400">Smart summaries & Q&A</div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-500 group-hover:translate-x-1 group-hover:text-cyan-400 transition-all" />
        </button>

        <button
          onClick={() => onNavigate('/app/quiz')}
          className="p-5 rounded-2xl glass-card border-gray-800 hover:border-blue-500/50 text-left transition-all group flex items-center justify-between"
        >
          <div className="space-y-1">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30 group-hover:scale-110 transition-transform">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div className="font-bold text-sm text-gray-100 mt-2">Start Quiz</div>
            <div className="text-xs text-gray-400">Practice questions</div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-500 group-hover:translate-x-1 group-hover:text-blue-400 transition-all" />
        </button>

        <button
          onClick={() => onNavigate('/app/planner')}
          className="p-5 rounded-2xl glass-card border-gray-800 hover:border-amber-500/50 text-left transition-all group flex items-center justify-between"
        >
          <div className="space-y-1">
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center border border-amber-500/30 group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="font-bold text-sm text-gray-100 mt-2">Plan Study</div>
            <div className="text-xs text-gray-400">Task calendar</div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-500 group-hover:translate-x-1 group-hover:text-amber-400 transition-all" />
        </button>
      </div>

      {/* Weak Topic Alert Widget */}
      <div className="p-6 rounded-2xl glass-panel border border-gray-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-gray-100">Weak Topics Diagnostics</h2>
          </div>
          <button
            onClick={() => onNavigate('/app/weak-topics')}
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
          >
            View All <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {weakTopics.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {weakTopics.map((wt) => (
              <div
                key={wt.id}
                className="p-4 rounded-xl bg-gray-950/60 border border-gray-800 flex items-center justify-between gap-4"
              >
                <div>
                  <div className="text-xs font-mono text-gray-400">{wt.subjectName}</div>
                  <div className="text-sm font-semibold text-gray-200">{wt.topicName}</div>
                  <div className="text-xs text-rose-400 mt-1 font-mono">
                    Quiz Accuracy: {wt.accuracyPercentage}%
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onAskAI(`Explain ${wt.topicName} in detail with exam tips`)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 text-xs font-medium border border-blue-500/30 transition-colors"
                  >
                    Ask Tutor
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-gray-950/40 border border-gray-800/80 text-xs text-gray-400 flex items-center justify-between">
            <span>No weak topics detected yet! Complete a quiz to analyze your performance.</span>
            <button
              onClick={() => onNavigate('/app/quiz')}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold text-xs"
            >
              Take Quiz
            </button>
          </div>
        )}
      </div>

      {/* Middle Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 p-6 rounded-3xl glass-panel border border-gray-800 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                Weekly Study Time
              </h2>
              <p className="text-xs text-gray-400">Log study activity by completing planner tasks & quizzes</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyHoursData}>
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
                />
                <Bar dataKey="hours" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Today's Tasks Widget */}
        <div className="lg:col-span-4 p-6 rounded-3xl glass-panel border border-gray-800 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              Today's Tasks
            </h2>
            <button
              onClick={() => onNavigate('/app/planner')}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300"
            >
              Planner
            </button>
          </div>

          <div className="space-y-3">
            {tasks.length > 0 ? (
              tasks.slice(0, 4).map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleToggleTask(task.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                    task.isCompleted
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-gray-400'
                      : 'bg-gray-900/60 border-gray-800 text-gray-200 hover:border-gray-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      task.isCompleted
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-gray-600 bg-gray-950'
                    }`}
                  >
                    {task.isCompleted && <CheckCircle2 className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <div className={`text-xs font-semibold ${task.isCompleted ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                      {task.title}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-gray-400 space-y-2">
                <p className="text-xs">No study tasks scheduled for today.</p>
                <button
                  onClick={() => onNavigate('/app/planner')}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-white font-semibold text-xs inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Study Task
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Subjects & Materials */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 p-6 rounded-3xl glass-panel border border-gray-800 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              Curriculum Subjects
            </h2>
            <button
              onClick={() => onNavigate('/app/subjects')}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              All Subjects <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {subjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subjects.map((subj) => (
                <div
                  key={subj.id}
                  onClick={() => onNavigate(`/app/subjects/${subj.id}`)}
                  className="p-5 rounded-2xl glass-card border-gray-800 hover:border-blue-500/50 cursor-pointer transition-all space-y-3 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-md">
                      {subj.code}
                    </span>
                    <span className="text-xs font-bold text-gray-300">{subj.progressPercentage}%</span>
                  </div>
                  <h3 className="text-base font-bold text-gray-100 group-hover:text-blue-500 dark:group-hover:text-blue-300 transition-colors">
                    {subj.name}
                  </h3>
                  <p className="text-xs text-gray-400 line-clamp-2">{subj.description}</p>
                  <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-blue-500 rounded-full transition-all"
                      style={{ width: `${subj.progressPercentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-400 space-y-3 bg-gray-950/40 rounded-2xl border border-gray-800/80 p-6">
              <BookOpen className="w-7 h-7 text-cyan-400/60 mx-auto" />
              <p className="text-xs text-gray-300">No curriculum subjects added yet.</p>
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

        {/* Study Materials */}
        <div className="lg:col-span-4 p-6 rounded-3xl glass-panel border border-gray-800 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              Course Materials
            </h2>
            <button
              onClick={() => onNavigate('/app/materials')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              Library
            </button>
          </div>

          <div className="space-y-3">
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
                  className="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800 hover:border-gray-700 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <FileText className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0" />
                    <div className="truncate">
                      <div className="text-xs font-semibold text-gray-200 truncate">{mat.title}</div>
                      <div className="text-[10px] text-gray-400">{mat.fileSize || 'PDF'}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-gray-400 space-y-2 bg-gray-950/40 rounded-2xl border border-gray-800/80 p-4">
                <p className="text-xs text-gray-300">No course materials uploaded yet.</p>
                <button
                  onClick={() => onNavigate('/app/materials')}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs inline-flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Upload Notes or PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
