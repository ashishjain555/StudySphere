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
} from 'lucide-react';
import { DataStore } from '../lib/dataStore';
import { StudyPlanTask, Subject } from '../types';

export const StudyPlannerPage: React.FC = () => {
  const [tasks, setTasks] = useState<StudyPlanTask[]>(() => DataStore.getTasks());
  const [subjects] = useState<Subject[]>(() => DataStore.getSubjects());
  const [activeView, setActiveView] = useState<'today' | 'week' | 'calendar'>('today');

  // Calendar view state
  const [calendarDate, setCalendarDate] = useState<Date>(() => new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // New task modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubjectId, setNewSubjectId] = useState(subjects[0]?.id || 'general');
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('high');
  const [newDuration, setNewDuration] = useState(45);
  const [newDueDate, setNewDueDate] = useState(new Date().toISOString().split('T')[0]);

  // Delete task modal state
  const [taskToDelete, setTaskToDelete] = useState<StudyPlanTask | null>(null);

  const handleToggleTask = (taskId: string) => {
    const updated = tasks.map((t) => (t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t));
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
      subjectName: subj?.name || 'General',
      title: newTitle,
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

  // Calendar calculations & navigation
  const calYear = calendarDate.getFullYear();
  const calMonth = calendarDate.getMonth();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
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

  const filteredTasks = tasks.filter((t) => {
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
    return true; // Calendar or all
  });

  const selectedDateTasks = tasks.filter((t) => t.dueDate === selectedCalendarDate);

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

  const completedCount = tasks.filter((t) => t.isCompleted).length;
  const progressPct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-amber-400" />
            Study Planner
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Organize study tasks, assign subject priorities, and track daily progress.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs border border-amber-400/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Study Task
        </button>
      </div>

      {/* Progress Bar & View Switcher */}
      <div className="p-6 rounded-3xl glass-panel border border-gray-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 flex-1 w-full">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-gray-200">Overall Goal Completion</span>
            <span className="text-amber-400 font-mono">{progressPct}% ({completedCount}/{tasks.length} tasks)</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-gray-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-900 border border-gray-800 text-xs shrink-0">
          <button
            onClick={() => setActiveView('today')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeView === 'today' ? 'bg-amber-500 text-white shadow' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setActiveView('week')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeView === 'week' ? 'bg-amber-500 text-white shadow' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setActiveView('calendar')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeView === 'calendar' ? 'bg-amber-500 text-white shadow' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Calendar
          </button>
        </div>
      </div>

      {/* Task List / Calendar View */}
      {activeView !== 'calendar' ? (
        <div className="space-y-4">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className={`p-5 rounded-2xl glass-card border transition-all flex items-center justify-between gap-4 ${
                  task.isCompleted
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <button
                    onClick={() => handleToggleTask(task.id)}
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                      task.isCompleted
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-gray-700 bg-gray-950 hover:border-amber-400'
                    }`}
                  >
                    {task.isCompleted && <Check className="w-4 h-4" />}
                  </button>

                  <div className="space-y-1">
                    <div className={`text-sm font-bold ${task.isCompleted ? 'line-through text-gray-500' : 'text-gray-100'}`}>
                      {task.title}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="font-mono text-amber-400 font-semibold">{task.subjectName}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {task.durationMins} mins
                      </span>
                      <span>•</span>
                      <span>Due: {task.dueDate}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-[10px] font-mono px-2.5 py-1 rounded-full uppercase tracking-wider font-bold ${
                      task.priority === 'high'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : task.priority === 'medium'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    }`}
                  >
                    {task.priority} Priority
                  </span>

                  <button
                    onClick={() => setTaskToDelete(task)}
                    className="p-2 rounded-lg hover:bg-rose-500/10 text-gray-500 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Delete study task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-16 text-center text-gray-400 glass-panel rounded-3xl border border-gray-800">
              <CalendarIcon className="w-10 h-10 mx-auto mb-3 text-gray-600" />
              <p className="text-sm font-semibold">No study tasks scheduled for {activeView}.</p>
              <p className="text-xs text-gray-500 mt-1">Click "Add Study Task" above to schedule a session!</p>
            </div>
          )}
        </div>
      ) : (
        /* Calendar View Grid */
        <div className="space-y-6">
          <div className="p-6 rounded-3xl glass-panel border border-gray-800 space-y-5">
            {/* Calendar Controls Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
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
                    Click any date to view scheduled tasks or plan ahead.
                  </p>
                </div>
              </div>

              {/* Month Navigation Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTodayMonth}
                  className="px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-700 text-xs font-semibold text-gray-300 hover:text-white transition-all cursor-pointer"
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
                    className="min-h-[80px] p-2 rounded-xl bg-gray-950/30 border border-gray-900/60 opacity-35 flex flex-col justify-between cursor-not-allowed select-none"
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
                const completedCount = dayTasks.filter((t) => t.isCompleted).length;

                return (
                  <button
                    key={`day-${dayNum}`}
                    type="button"
                    onClick={() => setSelectedCalendarDate(dateStr)}
                    className={`min-h-[80px] p-2 rounded-xl border flex flex-col justify-between text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500 shadow-md ring-1 ring-amber-500/50'
                        : isToday
                        ? 'bg-gray-900/80 border-amber-500/60 hover:border-amber-400'
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
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold truncate ${
                          completedCount === dayTasks.length
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                        title={`${dayTasks.length} task(s), ${completedCount} completed`}
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
          <div className="p-6 rounded-3xl glass-panel border border-gray-800 space-y-4 animate-fadeIn">
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
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Schedule Task for this Date
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
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
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
                  No study tasks scheduled for this day.
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Click "Schedule Task for this Date" above to add a study session.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-md glass-panel bg-gray-900 rounded-3xl border border-gray-800 p-6 space-y-5 animate-fadeIn">
            <h2 className="text-lg font-bold text-gray-100">Add New Study Task</h2>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Complete DBMS Unit 3 Exercises"
                  required
                  className="w-full py-2.5 px-4 rounded-xl bg-gray-950 border border-gray-800 text-gray-100 text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Subject
                </label>
                <select
                  value={newSubjectId}
                  onChange={(e) => setNewSubjectId(e.target.value)}
                  className="w-full py-2.5 px-4 rounded-xl bg-gray-950 border border-gray-800 text-gray-100 text-sm focus:border-amber-500 focus:outline-none"
                >
                  {subjects.length > 0 ? (
                    subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))
                  ) : (
                    <option value="general">General Studies</option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full py-2.5 px-4 rounded-xl bg-gray-950 border border-gray-800 text-gray-100 text-sm focus:border-amber-500 focus:outline-none"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                    Duration (Mins)
                  </label>
                  <input
                    type="number"
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    min={10}
                    max={300}
                    className="w-full py-2.5 px-4 rounded-xl bg-gray-950 border border-gray-800 text-gray-100 text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full py-2.5 px-4 rounded-xl bg-gray-950 border border-gray-800 text-gray-100 text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Task Confirmation Modal */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md p-6 rounded-3xl glass-panel bg-gray-950 border border-red-500/30 shadow-2xl space-y-4">
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
              Are you sure you want to delete <strong className="text-white">"{taskToDelete.title}"</strong>?
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
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold border border-red-400/30 cursor-pointer transition-colors shadow-lg shadow-red-950/40"
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
