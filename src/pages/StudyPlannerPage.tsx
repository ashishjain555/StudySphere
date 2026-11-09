import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  CheckCircle2,
  Trash2,
  Clock,
  AlertCircle,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Flame,
  Target,
  Zap,
  Sparkles,
  BarChart2,
  TrendingUp,
  X,
  CalendarCheck,
  Lightbulb,
  Layers,
  Filter,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DataStore } from '../lib/dataStore';
import { StudyPlanTask, Subject } from '../types';

export const StudyPlannerPage: React.FC = () => {
  const [tasks, setTasks] = useState<StudyPlanTask[]>(() => {
    const t = DataStore.getTasks();
    return Array.isArray(t) ? t : [];
  });
  const [subjects] = useState<Subject[]>(() => {
    const s = DataStore.getSubjects();
    return Array.isArray(s) ? s : [];
  });
  const [activeView, setActiveView] = useState<'today' | 'week' | 'calendar' | 'all'>('today');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Calendar view state
  const [calendarDate, setCalendarDate] = useState<Date>(() => new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );

  // New task modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubjectId, setNewSubjectId] = useState(subjects[0]?.id || 'general');
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('high');
  const [newDuration, setNewDuration] = useState(45);
  const [newDueDate, setNewDueDate] = useState(new Date().toISOString().split('T')[0]);

  // Delete task modal state
  const [taskToDelete, setTaskToDelete] = useState<StudyPlanTask | null>(null);

  // Weak topics for smart recommendations
  const rawWeak = DataStore.getWeakTopics();
  const weakTopics = Array.isArray(rawWeak) ? rawWeak : [];
  const topWeakTopic = weakTopics.length > 0 ? weakTopics[0] : null;

  const handleToggleTask = (taskId: string) => {
    const currentTasks = Array.isArray(tasks) ? tasks : [];
    const updated = currentTasks.map((t) => {
      if (t.id === taskId) {
        const nextCompleted = !t.isCompleted;
        if (nextCompleted) {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 },
          });
        }
        return { ...t, isCompleted: nextCompleted };
      }
      return t;
    });
    setTasks(updated);
    const target = updated.find((t) => t.id === taskId);
    if (target) DataStore.saveTask(target);
  };

  const confirmDeleteTask = () => {
    if (!taskToDelete) return;
    const taskId = taskToDelete.id;
    const updated = tasks.filter((t) => t.id !== taskId);
    setTasks(updated);
    DataStore.deleteTask(taskId);
    setTaskToDelete(null);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const subj = subjects.find((s) => s.id === newSubjectId);
    const newTask: StudyPlanTask = {
      id: `task_${Date.now()}`,
      userId: DataStore.getActiveUser().id,
      subjectId: newSubjectId,
      subjectName: subj?.name || 'General Studies',
      title: newTitle.trim(),
      priority: newPriority,
      durationMins: newDuration,
      dueDate: newDueDate,
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };

    const updated = [newTask, ...tasks];
    setTasks(updated);
    DataStore.saveTask(newTask);

    setNewTitle('');
    setShowAddModal(false);
  };

  const handleAddWeakTopicReview = (topicName: string, subjectName: string) => {
    const matchedSubject = subjects.find((s) => s.name.toLowerCase() === subjectName.toLowerCase());
    const newTask: StudyPlanTask = {
      id: `task_${Date.now()}`,
      userId: DataStore.getActiveUser().id,
      subjectId: matchedSubject?.id || 'general',
      subjectName: subjectName || 'General Studies',
      title: `Targeted Review: ${topicName}`,
      priority: 'high',
      durationMins: 30,
      dueDate: new Date().toISOString().split('T')[0],
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };

    const updated = [newTask, ...tasks];
    setTasks(updated);
    DataStore.saveTask(newTask);

    confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
  };

  // Calendar calculations & navigation
  const calYear = calendarDate.getFullYear();
  const calMonth = calendarDate.getMonth();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const calMonthName = monthNames[calMonth];
  const daysInCurrentMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();
  const daysInPrevMonth = new Date(calYear, calMonth, 0).getDate();

  const handlePrevMonth = () => {
    setCalendarDate(new Date(calYear, calMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate(new Date(calYear, calMonth + 1, 1));
  };

  const handleTodayMonth = () => {
    const now = new Date();
    setCalendarDate(now);
    setSelectedCalendarDate(now.toISOString().split('T')[0]);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = new Date().toISOString().split('T')[0];

  const safeTasks = Array.isArray(tasks) ? tasks : [];

  // Filtering tasks
  const filteredTasks = safeTasks.filter((t) => {
    if (!t) return false;
    // Subject filter
    if (selectedSubjectFilter !== 'all' && t.subjectId !== selectedSubjectFilter) {
      return false;
    }

    // Status filter
    if (statusFilter === 'pending' && t.isCompleted) return false;
    if (statusFilter === 'completed' && !t.isCompleted) return false;

    // View filter
    if (activeView === 'today') return t.dueDate === todayStr;
    if (activeView === 'week') {
      if (!t.dueDate) return false;
      const [y, m, d] = t.dueDate.split('-').map(Number);
      const taskDate = new Date(y, m - 1, d);
      taskDate.setHours(0, 0, 0, 0);
      const diffTime = taskDate.getTime() - today.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    }
    return true; // 'calendar' or 'all'
  });

  const selectedDateTasks = safeTasks.filter((t) => t && t.dueDate === selectedCalendarDate);

  const formattedSelectedDate = (() => {
    if (!selectedCalendarDate) return '';
    const [y, m, d] = selectedCalendarDate.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  })();

  // Platform Metrics
  const completedCount = safeTasks.filter((t) => t && t.isCompleted).length;
  const progressPct = safeTasks.length > 0 ? Math.round((completedCount / safeTasks.length) * 100) : 0;
  const todayTasks = safeTasks.filter((t) => t && t.dueDate === todayStr);
  const todayCompleted = todayTasks.filter((t) => t && t.isCompleted).length;
  const highPriorityCount = safeTasks.filter((t) => t && t.priority === 'high' && !t.isCompleted).length;
  const totalPlannedMinutes = safeTasks
    .filter((t) => t && !t.isCompleted)
    .reduce((sum, t) => sum + (t.durationMins || 0), 0);

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/25 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              Smart Study Scheduler
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-amber-400" />
            Study Planner & Goals
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Organize daily revision, assign subject priorities, and track academic consistency.
          </p>
        </div>

        <button
          onClick={() => {
            setNewDueDate(new Date().toISOString().split('T')[0]);
            setShowAddModal(true);
          }}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-xs border border-amber-400/40 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-600/25 active:scale-95 shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Study Session
        </button>
      </div>

      {/* Top Quick Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Due Today */}
        <div className="p-4.5 rounded-2xl glass-panel bg-gray-950/70 border border-gray-800/80 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="flex items-center gap-1.5 font-medium">
              <CalendarCheck className="w-3.5 h-3.5 text-amber-400" /> Due Today
            </span>
            <span className="text-[10px] font-mono text-amber-400 font-bold">
              {todayCompleted}/{todayTasks.length} DONE
            </span>
          </div>
          <div className="text-2xl font-black text-white">{todayTasks.length} Tasks</div>
          <div className="text-[11px] text-gray-400">
            {todayTasks.length - todayCompleted} remaining today
          </div>
        </div>

        {/* Completion Progress */}
        <div className="p-4.5 rounded-2xl glass-panel bg-gray-950/70 border border-gray-800/80 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="flex items-center gap-1.5 font-medium">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Completion Rate
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">{progressPct}%</span>
          </div>
          <div className="text-2xl font-black text-emerald-400">{completedCount} Completed</div>
          <div className="text-[11px] text-gray-400">Out of {tasks.length} total tasks</div>
        </div>

        {/* Planned Time */}
        <div className="p-4.5 rounded-2xl glass-panel bg-gray-950/70 border border-gray-800/80 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-blue-400" /> Focus Time Left
            </span>
            <span className="text-[10px] font-mono text-blue-400 font-bold">REMAINING</span>
          </div>
          <div className="text-2xl font-black text-white">
            {Math.floor(totalPlannedMinutes / 60)}h {totalPlannedMinutes % 60}m
          </div>
          <div className="text-[11px] text-gray-400">Total planned study duration</div>
        </div>

        {/* High Priority */}
        <div className="p-4.5 rounded-2xl glass-panel bg-gray-950/70 border border-gray-800/80 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Flame className="w-3.5 h-3.5 text-rose-400" /> High Priority
            </span>
            <span className="text-[10px] font-mono text-rose-400 font-bold">URGENT</span>
          </div>
          <div className="text-2xl font-black text-rose-400">{highPriorityCount} Pending</div>
          <div className="text-[11px] text-gray-400">Crucial exam topics</div>
        </div>
      </div>

      {/* AI Smart Recommendation Box */}
      {topWeakTopic && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950/30 via-slate-900/40 to-slate-950/40 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn shadow-lg">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5">
                  AI Revision Prompt
                </span>
                <span className="text-xs text-gray-400">
                  Subject: <strong className="text-gray-200">{topWeakTopic.subjectName}</strong>
                </span>
              </div>
              <p className="text-sm font-bold text-white mt-1">
                Weak Topic Detected: "{topWeakTopic.topicTitle}"
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Targeted practice recommended to recover mastery before midterms.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleAddWeakTopicReview(topWeakTopic.topicTitle, topWeakTopic.subjectName)}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs border border-amber-400/30 flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-amber-600/20 shrink-0 self-end sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            Schedule 30m Review
          </button>
        </div>
      )}

      {/* Control Bar: Progress & View Switchers */}
      <div className="p-5 sm:p-6 rounded-3xl glass-panel bg-gray-950/80 border border-gray-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 shadow-xl">
        {/* Overall Completion Progress */}
        <div className="space-y-2 flex-1">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-gray-200 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-amber-400" />
              Syllabus Task Completion
            </span>
            <span className="text-amber-400 font-mono">
              {progressPct}% ({completedCount}/{tasks.length} tasks)
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-gray-900 border border-gray-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* View Switcher & Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Subject Filter */}
          <div className="relative">
            <select
              value={selectedSubjectFilter}
              onChange={(e) => setSelectedSubjectFilter(e.target.value)}
              className="py-2 pl-3 pr-8 rounded-xl bg-gray-900 border border-gray-800 text-xs font-semibold text-gray-300 focus:border-amber-500 focus:outline-none transition-colors cursor-pointer"
            >
              <option value="all">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center p-1 rounded-xl bg-gray-900 border border-gray-800 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                statusFilter === 'all' ? 'bg-amber-500 text-white shadow' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                statusFilter === 'pending' ? 'bg-amber-500 text-white shadow' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                statusFilter === 'completed' ? 'bg-amber-500 text-white shadow' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Done
            </button>
          </div>

          {/* View Modes */}
          <div className="flex items-center p-1 rounded-xl bg-gray-900 border border-gray-800 text-xs">
            <button
              onClick={() => setActiveView('today')}
              className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeView === 'today' ? 'bg-amber-500 text-white shadow' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setActiveView('week')}
              className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeView === 'week' ? 'bg-amber-500 text-white shadow' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setActiveView('calendar')}
              className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeView === 'calendar' ? 'bg-amber-500 text-white shadow' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setActiveView('all')}
              className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeView === 'all' ? 'bg-amber-500 text-white shadow' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              All
            </button>
          </div>
        </div>
      </div>

      {/* Task List / Calendar View */}
      {activeView !== 'calendar' ? (
        <div className="space-y-3.5">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => {
              const isDueToday = task.dueDate === todayStr;
              const isOverdue =
                task.dueDate &&
                task.dueDate < todayStr &&
                !task.isCompleted;

              return (
                <div
                  key={task.id}
                  className={`p-4 sm:p-5 rounded-2xl glass-card border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    task.isCompleted
                      ? 'bg-emerald-500/5 border-emerald-500/25 opacity-75'
                      : isOverdue
                      ? 'bg-rose-500/5 border-rose-500/30 hover:border-rose-500/50'
                      : isDueToday
                      ? 'bg-amber-500/5 border-amber-500/30 hover:border-amber-500/50 shadow-sm'
                      : 'border-gray-800/80 hover:border-gray-700 bg-gray-950/60'
                  }`}
                >
                  {/* Task Left Checkbox & Title */}
                  <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleToggleTask(task.id)}
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-all cursor-pointer mt-0.5 sm:mt-0 ${
                        task.isCompleted
                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20'
                          : 'border-gray-700 bg-gray-900 hover:border-amber-400'
                      }`}
                      title={task.isCompleted ? 'Mark incomplete' : 'Mark completed'}
                    >
                      {task.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <div className="space-y-1 min-w-0">
                      <div
                        className={`text-sm sm:text-base font-bold transition-all truncate ${
                          task.isCompleted ? 'line-through text-gray-500' : 'text-gray-100'
                        }`}
                      >
                        {task.title}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                        <span className="font-mono text-amber-400 font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-[11px]">
                          {task.subjectName}
                        </span>

                        <span className="flex items-center gap-1 text-[11px] text-gray-400">
                          <Clock className="w-3.5 h-3.5 text-gray-500" />
                          {task.durationMins} mins
                        </span>

                        <span className="text-gray-600">•</span>

                        <span
                          className={`text-[11px] font-medium ${
                            isOverdue
                              ? 'text-rose-400 font-bold'
                              : isDueToday
                              ? 'text-amber-400 font-bold'
                              : 'text-gray-400'
                          }`}
                        >
                          {isDueToday ? 'Today' : isOverdue ? `Overdue (${task.dueDate})` : `Due: ${task.dueDate}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Task Right Actions */}
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                    <span
                      className={`text-[10px] font-mono px-2.5 py-1 rounded-full uppercase tracking-wider font-bold flex items-center gap-1 ${
                        task.priority === 'high'
                          ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          : task.priority === 'medium'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {task.priority === 'high' ? (
                        <Flame className="w-3 h-3 text-rose-400" />
                      ) : task.priority === 'medium' ? (
                        <Target className="w-3 h-3 text-amber-400" />
                      ) : (
                        <Zap className="w-3 h-3 text-blue-400" />
                      )}
                      {task.priority} Priority
                    </span>

                    <button
                      type="button"
                      onClick={() => setTaskToDelete(task)}
                      className="p-2 rounded-xl bg-gray-900/60 hover:bg-rose-500/10 border border-gray-800 text-gray-500 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete study task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-16 text-center text-gray-400 glass-panel bg-gray-950/60 rounded-3xl border border-gray-800 space-y-3">
              <CalendarIcon className="w-12 h-12 mx-auto text-gray-600" />
              <div className="space-y-1">
                <p className="text-base font-bold text-gray-200">
                  No study tasks found for this view.
                </p>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  {statusFilter !== 'all' || selectedSubjectFilter !== 'all'
                    ? 'Try resetting the filters or schedule a new study session.'
                    : 'Plan your syllabus chapters or practice quizzes to stay on track.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNewDueDate(todayStr);
                  setShowAddModal(true);
                }}
                className="mt-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs border border-amber-400/30 transition-all cursor-pointer shadow-md inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Study Session
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Calendar View Grid */
        <div className="space-y-6">
          <div className="p-6 rounded-3xl glass-panel bg-gray-950/80 border border-gray-800 space-y-5 shadow-xl">
            {/* Calendar Controls Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2">
                    {calMonthName} {calYear}
                    {calYear === new Date().getFullYear() && calMonth === new Date().getMonth() && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Current Month
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-gray-400">
                    Click any date to inspect scheduled sessions or plan upcoming exams.
                  </p>
                </div>
              </div>

              {/* Month Navigation Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTodayMonth}
                  className="px-3.5 py-1.5 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-700 text-xs font-semibold text-gray-300 hover:text-white transition-all cursor-pointer"
                >
                  Today
                </button>
                <div className="flex items-center gap-1 bg-gray-900 p-1 rounded-xl border border-gray-800">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    title="Previous Month"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    title="Next Month"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-mono font-bold text-gray-400 py-1">
              <div className="text-rose-400">Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div className="text-indigo-400">Sat</div>
            </div>

            {/* Dates Grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Previous Month Padding Cells */}
              {Array.from({ length: firstDayOfWeek }).map((_, idx) => {
                const prevDayNum = daysInPrevMonth - firstDayOfWeek + idx + 1;
                return (
                  <div
                    key={`prev-${idx}`}
                    className="min-h-[85px] p-2 rounded-2xl bg-gray-950/30 border border-gray-900/60 opacity-30 flex flex-col justify-between cursor-not-allowed select-none"
                  >
                    <span className="text-xs font-mono text-gray-600 font-semibold">{prevDayNum}</span>
                  </div>
                );
              })}

              {/* Current Month Active Days */}
              {Array.from({ length: daysInCurrentMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const monthStr = (calMonth + 1).toString().padStart(2, '0');
                const dayStr = dayNum.toString().padStart(2, '0');
                const dateStr = `${calYear}-${monthStr}-${dayStr}`;
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedCalendarDate;
                const dayTasks = tasks.filter((t) => t.dueDate === dateStr);
                const dayCompleted = dayTasks.filter((t) => t.isCompleted).length;

                return (
                  <button
                    key={`day-${dayNum}`}
                    type="button"
                    onClick={() => setSelectedCalendarDate(dateStr)}
                    className={`min-h-[85px] p-2.5 rounded-2xl border flex flex-col justify-between text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500'
                        : isToday
                        ? 'bg-gray-900/90 border-amber-500/60 hover:border-amber-400'
                        : 'bg-gray-950/60 border-gray-800/80 hover:border-gray-700 hover:bg-gray-900/40'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs font-mono font-bold ${
                          isToday
                            ? 'w-6 h-6 rounded-full bg-amber-500 text-black flex items-center justify-center font-extrabold'
                            : isSelected
                            ? 'text-amber-300 font-extrabold'
                            : 'text-gray-300'
                        }`}
                      >
                        {dayNum}
                      </span>
                      {isToday && !isSelected && (
                        <span className="hidden sm:inline-block text-[9px] font-mono font-bold text-amber-400 uppercase tracking-tighter">
                          Today
                        </span>
                      )}
                    </div>

                    {dayTasks.length > 0 && (
                      <div
                        className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold truncate mt-1 ${
                          dayCompleted === dayTasks.length
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                        title={`${dayTasks.length} task(s), ${dayCompleted} completed`}
                      >
                        {dayTasks.length} {dayTasks.length === 1 ? 'Task' : 'Tasks'}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Detail Panel */}
          <div className="p-6 rounded-3xl glass-panel bg-gray-950/80 border border-gray-800 space-y-4 shadow-xl animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2.5">
                <CalendarIcon className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-gray-100">
                  Tasks for {formattedSelectedDate}
                </h3>
                {selectedCalendarDate === todayStr && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                    Today
                  </span>
                )}
                <span className="text-xs font-mono text-gray-400">
                  ({selectedDateTasks.length} {selectedDateTasks.length === 1 ? 'task' : 'tasks'})
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setNewDueDate(selectedCalendarDate);
                  setShowAddModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-amber-600/20"
              >
                <Plus className="w-3.5 h-3.5" />
                Schedule on this Date
              </button>
            </div>

            {selectedDateTasks.length > 0 ? (
              <div className="space-y-3 pt-1">
                {selectedDateTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-4 rounded-2xl glass-card border transition-all flex items-center justify-between gap-4 ${
                      task.isCompleted
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'border-gray-800 hover:border-gray-700 bg-gray-900/40'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleToggleTask(task.id)}
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                          task.isCompleted
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-gray-700 bg-gray-950 hover:border-amber-400'
                        }`}
                      >
                        {task.isCompleted && <Check className="w-4 h-4" />}
                      </button>

                      <div className="space-y-1 min-w-0">
                        <div
                          className={`text-sm font-bold truncate ${
                            task.isCompleted ? 'line-through text-gray-500' : 'text-gray-100'
                          }`}
                        >
                          {task.title}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span className="font-mono text-amber-400 font-semibold">{task.subjectName}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {task.durationMins} mins
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`text-[10px] font-mono px-2.5 py-1 rounded-full uppercase tracking-wider font-bold ${
                          task.priority === 'high'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : task.priority === 'medium'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        }`}
                      >
                        {task.priority}
                      </span>

                      <button
                        type="button"
                        onClick={() => setTaskToDelete(task)}
                        className="p-2 rounded-lg hover:bg-rose-500/10 text-gray-500 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete study task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-gray-400 bg-gray-950/40 rounded-2xl border border-gray-800/80">
                <CalendarIcon className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                <p className="text-sm font-semibold text-gray-300">
                  No study sessions scheduled for this day.
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Click "Schedule on this Date" above to add a study session.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg glass-panel bg-slate-950/95 rounded-3xl border border-slate-800 p-6 sm:p-7 space-y-5 shadow-2xl relative animate-modalPop">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Add Study Session</h3>
                  <p className="text-[11px] text-slate-400">Plan a targeted chapter revision or practice</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Master Graph BFS/DFS Algorithms"
                  required
                  className="w-full py-2.5 px-4 rounded-xl bg-gray-900 border border-gray-800 text-gray-100 text-sm focus:border-amber-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Academic Subject
                </label>
                <select
                  value={newSubjectId}
                  onChange={(e) => setNewSubjectId(e.target.value)}
                  className="w-full py-2.5 px-4 rounded-xl bg-gray-900 border border-gray-800 text-gray-100 text-sm focus:border-amber-500 focus:outline-none transition-all cursor-pointer"
                >
                  {subjects.length > 0 ? (
                    subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code ? `${s.code}: ` : ''}{s.name}
                      </option>
                    ))
                  ) : (
                    <option value="general">General Studies</option>
                  )}
                </select>
              </div>

              {/* Priority Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Urgency / Priority
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewPriority('high')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      newPriority === 'high'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500 shadow-md ring-1 ring-rose-500'
                        : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5 text-rose-400" />
                    High
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPriority('medium')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      newPriority === 'medium'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-md ring-1 ring-amber-500'
                        : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <Target className="w-3.5 h-3.5 text-amber-400" />
                    Medium
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPriority('low')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      newPriority === 'low'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500 shadow-md ring-1 ring-blue-500'
                        : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 text-blue-400" />
                    Low
                  </button>
                </div>
              </div>

              {/* Duration Presets */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Planned Duration: <span className="text-amber-400 font-mono">{newDuration} Mins</span>
                  </label>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[25, 45, 60, 90].map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setNewDuration(dur)}
                      className={`py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        newDuration === dur
                          ? 'bg-amber-500 text-white border-amber-400 shadow-sm'
                          : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      {dur}m
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Target Due Date
                </label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full py-2.5 px-4 rounded-xl bg-gray-900 border border-gray-800 text-gray-100 text-sm focus:border-amber-500 focus:outline-none transition-all"
                />
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-gray-300 text-xs font-semibold transition-colors cursor-pointer border border-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-amber-500/25 active:scale-95"
                >
                  Schedule Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Task Confirmation Modal */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md p-6 rounded-3xl glass-panel bg-gray-950 border border-red-500/30 shadow-2xl space-y-4 animate-modalPop">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Study Task?</h3>
                <p className="text-xs text-gray-400">This task will be removed from your study schedule.</p>
              </div>
            </div>

            <p className="text-sm text-gray-300 bg-gray-900/60 p-3.5 rounded-2xl border border-gray-800 leading-relaxed">
              Are you sure you want to remove <strong className="text-white">"{taskToDelete.title}"</strong>?
              {taskToDelete.subjectName && (
                <span className="block mt-1 text-xs text-gray-400">
                  Subject: <span className="text-gray-300">{taskToDelete.subjectName}</span>
                </span>
              )}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTaskToDelete(null)}
                className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteTask}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold border border-red-400/30 cursor-pointer transition-colors shadow-lg shadow-red-950/40 active:scale-95"
              >
                Yes, Delete Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
