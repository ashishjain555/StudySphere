import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  MessageSquare,
  HelpCircle,
  CheckCircle2,
  RotateCcw,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { DataStore } from '../lib/dataStore';
import { WeakTopic } from '../types';

interface WeakTopicDetectionPageProps {
  onNavigate: (path: string) => void;
  onAskAI: (query: string) => void;
}

export const WeakTopicDetectionPage: React.FC<WeakTopicDetectionPageProps> = ({
  onNavigate,
  onAskAI,
}) => {
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>(() => DataStore.getWeakTopics());

  useEffect(() => {
    const handleUpdate = () => {
      setWeakTopics(DataStore.getWeakTopics());
    };
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('studysphere:data_update', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('studysphere:data_update', handleUpdate);
    };
  }, []);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-rose-400" />
            Weak Topic Diagnostic Panel
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Automated performance analysis pinpointing topics with low quiz accuracy (&lt; 60%) for target revision.
          </p>
        </div>
      </div>

      {/* Grid of Weak Topic Cards or Empty State */}
      {weakTopics.length === 0 ? (
        <div className="p-12 text-center rounded-3xl glass-card border border-gray-800 bg-gray-900/40 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">No Weak Topics Detected Yet</h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Your learning slate is clean! As you take quizzes and study concepts, any areas where your score falls below 60% will automatically appear here with targeted revision drills.
          </p>
          <div className="pt-2 flex items-center justify-center">
            <button
              onClick={() => onNavigate('/app/quiz')}
              className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs border border-blue-400/30 flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <HelpCircle className="w-4 h-4" />
              Take a Diagnostic Quiz
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {weakTopics.map((wt) => (
            <div
              key={wt.id}
              className={`p-6 rounded-3xl glass-card border space-y-4 transition-all ${
                wt.status === 'critical'
                  ? 'bg-rose-950/20 border-rose-500/40'
                  : wt.status === 'improved'
                  ? 'bg-emerald-950/20 border-emerald-500/40'
                  : 'bg-amber-950/20 border-amber-500/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-gray-400 bg-gray-900 px-3 py-1 rounded-full border border-gray-800">
                  {wt.subjectName}
                </span>
                <span
                  className={`text-[10px] font-mono px-2.5 py-1 rounded-full uppercase font-bold ${
                    wt.status === 'critical'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : wt.status === 'improved'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {wt.status}
                </span>
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-100">{wt.topicName}</h2>
                <div className="flex items-center gap-4 mt-2 text-xs font-mono">
                  <span className="text-rose-400 font-bold">Accuracy: {wt.accuracyPercentage}%</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-400">{wt.errorCount} Error(s) Logged</span>
                </div>
              </div>

              <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    wt.accuracyPercentage < 50 ? 'bg-rose-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${wt.accuracyPercentage}%` }}
                />
              </div>

              {/* Recommended Action Buttons */}
              <div className="pt-2 grid grid-cols-3 gap-2">
                <button
                  onClick={() => onNavigate(`/app/subjects/${wt.subjectId}`)}
                  className="py-2 px-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Notes
                </button>

                <button
                  onClick={() => onAskAI(`Explain ${wt.topicName} step-by-step with exam tips`)}
                  className="py-2 px-3 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 text-xs font-medium border border-blue-500/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Ask Tutor
                </button>

                <button
                  onClick={() => onNavigate('/app/quiz')}
                  className="py-2 px-3 rounded-xl bg-amber-50 dark:bg-amber-600/20 hover:bg-amber-100 dark:hover:bg-amber-600/30 text-amber-700 dark:text-amber-300 text-xs font-semibold border border-amber-200 dark:border-amber-500/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  Quiz
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
