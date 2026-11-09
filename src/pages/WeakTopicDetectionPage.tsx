import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  MessageSquare,
  HelpCircle,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Target,
  Brain,
  Flame,
  Search,
  Filter,
  Check,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { DataStore } from '../lib/dataStore';
import { WeakTopic, Subject } from '../types';
import { TiltCard3D } from '../components/3d/TiltCard3D';

interface WeakTopicDetectionPageProps {
  onNavigate: (path: string) => void;
  onAskAI: (query: string) => void;
}

export const WeakTopicDetectionPage: React.FC<WeakTopicDetectionPageProps> = ({
  onNavigate,
  onAskAI,
}) => {
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>(() => {
    const w = DataStore.getWeakTopics();
    return Array.isArray(w) ? w : [];
  });
  const [subjects] = useState<Subject[]>(() => {
    const s = DataStore.getSubjects();
    return Array.isArray(s) ? s : [];
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'moderate' | 'improved'>('all');

  useEffect(() => {
    const handleUpdate = () => {
      const w = DataStore.getWeakTopics();
      setWeakTopics(Array.isArray(w) ? w : []);
    };
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('studysphere:data_update', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('studysphere:data_update', handleUpdate);
    };
  }, []);

  const safeWeakTopics = Array.isArray(weakTopics) ? weakTopics : [];

  // Real Calculated Metrics (100% computed from DataStore)
  const totalErrors = useMemo(() => {
    return safeWeakTopics.reduce((sum, wt) => sum + ((wt && wt.errorCount) || 1), 0);
  }, [safeWeakTopics]);

  const criticalTopics = useMemo(() => {
    return safeWeakTopics.filter((wt) => wt && (wt.status === 'critical' || wt.accuracyPercentage < 50));
  }, [safeWeakTopics]);

  const moderateTopics = useMemo(() => {
    return safeWeakTopics.filter(
      (wt) => wt && (wt.status !== 'critical' && wt.status !== 'improved' && wt.accuracyPercentage >= 50 && wt.accuracyPercentage < 70)
    );
  }, [safeWeakTopics]);

  const improvedTopics = useMemo(() => {
    return safeWeakTopics.filter((wt) => wt && (wt.status === 'improved' || wt.accuracyPercentage >= 70));
  }, [safeWeakTopics]);

  // Filtered List
  const filtered = useMemo(() => {
    return safeWeakTopics.filter((wt) => {
      if (!wt) return false;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (wt.topicName && wt.topicName.toLowerCase().includes(q)) ||
        (wt.subjectName && wt.subjectName.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (filterSeverity === 'critical') {
        return wt.status === 'critical' || wt.accuracyPercentage < 50;
      }
      if (filterSeverity === 'moderate') {
        return wt.status !== 'critical' && wt.status !== 'improved' && wt.accuracyPercentage >= 50 && wt.accuracyPercentage < 70;
      }
      if (filterSeverity === 'improved') {
        return wt.status === 'improved' || wt.accuracyPercentage >= 70;
      }
      return true;
    });
  }, [weakTopics, searchQuery, filterSeverity]);

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span>Weak Topics & Diagnostic Center</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Automated cognitive gap detection. Pinpoints low quiz accuracy (&lt; 60%) with targeted revision paths.
          </p>
        </div>

        <button
          onClick={() => onNavigate('/app/quiz')}
          className="self-start sm:self-auto px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-2 border border-blue-400/30 transition-all cursor-pointer shadow-sm"
        >
          <HelpCircle className="w-4 h-4 text-blue-200" />
          <span>Take Diagnostic Quiz</span>
        </button>
      </div>

      {/* Real Diagnostic Metrics Strip (100% computed from DataStore) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl glass-card border border-slate-800 bg-slate-900/60 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-white font-mono">{weakTopics.length}</div>
            <div className="text-xs text-slate-400">Total Flagged Topics</div>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl glass-card border border-slate-800 bg-slate-900/60 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400 shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-white font-mono">{criticalTopics.length}</div>
            <div className="text-xs text-slate-400">Critical Priority (&lt;50%)</div>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl glass-card border border-slate-800 bg-slate-900/60 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-white font-mono">{moderateTopics.length}</div>
            <div className="text-xs text-slate-400">Needs Practice (50-70%)</div>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl glass-card border border-slate-800 bg-slate-900/60 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-white font-mono">{improvedTopics.length}</div>
            <div className="text-xs text-slate-400">Improved Topics</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl glass-panel border border-slate-800 bg-slate-900/50 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search weak topics, concepts, or subjects..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500/60 transition-all"
            />
          </div>

          {/* Filter Severity Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => setFilterSeverity('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                filterSeverity === 'all'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/35'
                  : 'bg-slate-950/50 text-slate-400 border border-slate-800 hover:border-slate-700'
              }`}
            >
              All Flagged ({weakTopics.length})
            </button>
            <button
              onClick={() => setFilterSeverity('critical')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                filterSeverity === 'critical'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/35'
                  : 'bg-slate-950/50 text-slate-400 border border-slate-800 hover:border-slate-700'
              }`}
            >
              Critical ({criticalTopics.length})
            </button>
            <button
              onClick={() => setFilterSeverity('moderate')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                filterSeverity === 'moderate'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/35'
                  : 'bg-slate-950/50 text-slate-400 border border-slate-800 hover:border-slate-700'
              }`}
            >
              Moderate ({moderateTopics.length})
            </button>
            <button
              onClick={() => setFilterSeverity('improved')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                filterSeverity === 'improved'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/35'
                  : 'bg-slate-950/50 text-slate-400 border border-slate-800 hover:border-slate-700'
              }`}
            >
              Improved ({improvedTopics.length})
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Weak Topic Cards or Empty State */}
      {weakTopics.length === 0 ? (
        <div className="p-12 text-center rounded-3xl glass-card border border-slate-800 bg-slate-900/40 space-y-4 max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-white">No Weak Topics Detected Yet</h2>
            <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
              Your concept mastery is in excellent standing. As you take quizzes and practice exam problems, any topic where your accuracy drops below 60% will be highlighted here with custom AI revision notes.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center">
            <button
              onClick={() => onNavigate('/app/quiz')}
              className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs border border-blue-400/30 flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Take a Benchmark Quiz</span>
            </button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center rounded-2xl glass-card border border-slate-800 bg-slate-900/40 space-y-2">
          <p className="text-xs sm:text-sm text-slate-400">No weak topics match the selected filter criteria.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterSeverity('all');
            }}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((wt) => {
            const isCritical = wt.status === 'critical' || wt.accuracyPercentage < 50;
            const isImproved = wt.status === 'improved' || wt.accuracyPercentage >= 70;

            return (
              <TiltCard3D key={wt.id} maxTilt={5}>
                <div
                  className={`p-6 rounded-3xl glass-card border space-y-4 transition-all flex flex-col justify-between h-full bg-slate-950/60 ${
                    isCritical
                      ? 'border-rose-500/30 hover:border-rose-500/50'
                      : isImproved
                      ? 'border-emerald-500/30 hover:border-emerald-500/50'
                      : 'border-amber-500/30 hover:border-amber-500/50'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header Tag + Status Badge */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-slate-300 bg-slate-800/90 px-3 py-1 rounded-full border border-slate-700/60">
                        {wt.subjectName}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2.5 py-1 rounded-full uppercase font-bold border ${
                          isCritical
                            ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                            : isImproved
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {isCritical ? 'Critical Review' : isImproved ? 'Improved' : 'Needs Practice'}
                      </span>
                    </div>

                    {/* Topic Title */}
                    <div>
                      <h2 className="text-lg font-bold text-slate-100">{wt.topicName}</h2>
                      <div className="flex items-center gap-3 mt-1.5 text-xs font-mono">
                        <span
                          className={`font-bold ${
                            isCritical ? 'text-rose-400' : isImproved ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          Accuracy: {wt.accuracyPercentage}%
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-400">{wt.errorCount || 1} Error(s) Logged</span>
                      </div>
                    </div>

                    {/* Accuracy Progress Bar */}
                    <div className="space-y-1 pt-1">
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isCritical ? 'bg-rose-500' : isImproved ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.max(8, wt.accuracyPercentage)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3 Real Functional Action Buttons */}
                  <div className="pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2">
                    <button
                      onClick={() => onNavigate(`/app/subjects/${wt.subjectId}`)}
                      className="py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      title="Open Syllabus Chapter Notes"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                      <span>Notes</span>
                    </button>

                    <button
                      onClick={() =>
                        onAskAI(
                          `Explain ${wt.topicName} in ${wt.subjectName} step-by-step with practical examples, common exam traps, and clear revision notes.`
                        )
                      }
                      className="py-2 px-2.5 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 text-xs font-semibold border border-blue-500/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      title="Ask AI Tutor to break down this concept"
                    >
                      <Brain className="w-3.5 h-3.5 text-blue-400" />
                      <span>Ask Tutor</span>
                    </button>

                    <button
                      onClick={() => onNavigate('/app/quiz')}
                      className="py-2 px-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-semibold border border-amber-500/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      title="Test your recall on this topic"
                    >
                      <Target className="w-3.5 h-3.5 text-amber-400" />
                      <span>Quiz</span>
                    </button>
                  </div>
                </div>
              </TiltCard3D>
            );
          })}
        </div>
      )}
    </div>
  );
};
