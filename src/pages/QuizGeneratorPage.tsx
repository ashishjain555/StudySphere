import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Award,
  RotateCcw,
  ArrowRight,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DataStore, SAMPLE_QUIZ_BANK } from '../lib/dataStore';
import { QuizQuestion, QuizAttempt, Subject } from '../types';

interface QuizGeneratorPageProps {
  initialPDFText?: string;
  initialPDFTitle?: string;
  onNavigate: (path: string) => void;
}

export const QuizGeneratorPage: React.FC<QuizGeneratorPageProps> = ({
  initialPDFText,
  initialPDFTitle,
  onNavigate,
}) => {
  const [subjects] = useState<Subject[]>(() => DataStore.getSubjects());
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(() => (subjects.length > 0 ? subjects[0].id : 'general'));
  const [selectedTopic, setSelectedTopic] = useState<string>(() => initialPDFTitle || (subjects.length > 0 ? 'Chapter 1 Concepts' : 'General Concepts'));
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionCount, setQuestionCount] = useState<number>(5);

  useEffect(() => {
    if (initialPDFTitle) {
      setSelectedTopic(initialPDFTitle);
    }
  }, [initialPDFTitle]);

  // Quiz state machine: 'setup' | 'running' | 'completed'
  const [quizState, setQuizState] = useState<'setup' | 'running' | 'completed'>('setup');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  // Timer effect
  useEffect(() => {
    let timer: any;
    if (quizState === 'running') {
      timer = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [quizState]);

  const handleStartQuiz = async () => {
    setIsGenerating(true);
    try {
      const targetSubj = subjects.find((s) => s.id === selectedSubjectId);
      
      const res = await fetch('/api/ai/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: targetSubj?.name || 'Data Structures',
          topic: selectedTopic,
          difficulty,
          questionCount,
          pdfText: initialPDFText,
        }),
      });

      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
      } else {
        setQuestions(SAMPLE_QUIZ_BANK.slice(0, questionCount));
      }
    } catch (err) {
      console.warn('Fallback quiz generator:', err);
      setQuestions(SAMPLE_QUIZ_BANK.slice(0, questionCount));
    } finally {
      setIsGenerating(false);
      setQuizState('running');
      setCurrentIdx(0);
      setSelectedAnswers({});
      setSecondsElapsed(0);
    }
  };

  const handleSelectOption = (optIdx: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [currentIdx]: optIdx }));
  };

  const handleFinishQuiz = () => {
    // Calculate score
    let correct = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctOptionIndex) {
        correct += 1;
      }
    });

    const scorePct = Math.round((correct / questions.length) * 100);
    const targetSubj = subjects.find((s) => s.id === selectedSubjectId);

    // Save attempt to DataStore & weak topic detector
    const attempt: QuizAttempt = {
      id: `qa_${Date.now()}`,
      userId: DataStore.getActiveUser().id,
      subjectId: selectedSubjectId,
      subjectName: targetSubj?.name || 'Data Structures',
      topicTitle: selectedTopic,
      scorePercentage: scorePct,
      totalQuestions: questions.length,
      correctCount: correct,
      timeTakenSeconds: secondsElapsed,
      completedAt: new Date().toISOString(),
    };

    DataStore.recordQuizAttempt(attempt);

    // Confetti on high score
    if (scorePct >= 80) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }

    setQuizState('completed');
  };

  const calculateResults = () => {
    let correct = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctOptionIndex) {
        correct += 1;
      }
    });
    const scorePct = Math.round((correct / questions.length) * 100);
    return { correct, total: questions.length, scorePct };
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
      {/* Quiz Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <HelpCircle className="w-7 h-7 text-blue-400" />
            Practice Quiz Generator
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Test your knowledge, identify weak areas, and build exam confidence.
          </p>
        </div>
      </div>

      {/* 1. SETUP STATE */}
      {quizState === 'setup' && (
        <div className="p-8 rounded-3xl glass-panel border border-gray-800 space-y-6">
          {initialPDFText && (
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                      Attached Document
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Active Source
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white mt-0.5">
                    {initialPDFTitle || 'Uploaded Study PDF'}
                  </p>
                  <p className="text-xs text-gray-400">
                    StudySphere will synthesize questions strictly extracted from this document's content.
                  </p>
                </div>
              </div>
            </div>
          )}

          <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            Configure Your Quiz Parameters
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Subject Selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Subject
              </label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full py-3 px-4 rounded-xl bg-gray-950/80 border border-gray-800 text-gray-100 text-sm focus:border-blue-500 focus:outline-none"
              >
                {subjects.length > 0 ? (
                  subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code}: {s.name}
                    </option>
                  ))
                ) : (
                  <option value="general">General Studies</option>
                )}
              </select>
            </div>

            {/* Topic Input */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Topic / Focus Area
              </label>
              <input
                type="text"
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                placeholder="e.g. Graph Traversal, SQL Joins, Deadlocks"
                className="w-full py-3 px-4 rounded-xl bg-gray-950/80 border border-gray-800 text-gray-100 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Difficulty Selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['easy', 'medium', 'hard'] as const).map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setDifficulty(diff)}
                    className={`py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                      difficulty === diff
                        ? 'bg-blue-600 text-white border border-blue-400/40'
                        : 'bg-gray-950/60 border border-gray-800 text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            {/* Number of Questions */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Number of Questions
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[5, 10, 15].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setQuestionCount(cnt)}
                    className={`py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      questionCount === cnt
                        ? 'bg-blue-600 text-white border border-blue-400/40'
                        : 'bg-gray-950/60 border border-gray-800 text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {cnt} Questions
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleStartQuiz}
            disabled={isGenerating}
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm border border-blue-400/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isGenerating ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <HelpCircle className="w-5 h-5" />
                Generate & Start Quiz
              </>
            )}
          </button>
        </div>
      )}

      {/* 2. RUNNING QUIZ STATE */}
      {quizState === 'running' && questions.length > 0 && (
        <div className="p-8 rounded-3xl glass-panel border border-gray-800 space-y-6">
          {/* Progress Header */}
          <div className="flex items-center justify-between border-b border-gray-800 pb-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/20 px-3 py-1 rounded-full border border-blue-500/30">
                Question {currentIdx + 1} of {questions.length}
              </span>
              <span className="text-xs text-gray-400 uppercase font-semibold">
                Difficulty: {questions[currentIdx].difficulty}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-gray-300 bg-gray-900 px-3 py-1.5 rounded-xl border border-gray-800">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>
                {Math.floor(secondsElapsed / 60)}:
                {(secondsElapsed % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>

          {/* Question Text */}
          <div className="text-lg font-bold text-gray-100 leading-relaxed">
            {questions[currentIdx].questionText}
          </div>

          {/* Option Cards */}
          <div className="space-y-3">
            {questions[currentIdx].options.map((opt, optIdx) => {
              const isSelected = selectedAnswers[currentIdx] === optIdx;
              return (
                <div
                  key={optIdx}
                  onClick={() => handleSelectOption(optIdx)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-600/20 border-blue-500 text-blue-200 shadow-md'
                      : 'bg-gray-900/60 border-gray-800 text-gray-300 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg border flex items-center justify-center font-bold text-xs font-mono ${
                        isSelected
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'border-gray-700 bg-gray-950 text-gray-400'
                      }`}
                    >
                      {String.fromCharCode(65 + optIdx)}
                    </div>
                    <span className="text-sm font-medium">{opt}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation controls */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-800">
            <button
              onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
              disabled={currentIdx === 0}
              className="px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 text-xs font-semibold disabled:opacity-40"
            >
              Previous
            </button>

            {currentIdx < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIdx((prev) => prev + 1)}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 border border-blue-400/30 cursor-pointer transition-colors"
              >
                Next Question
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinishQuiz}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg"
              >
                Submit Quiz
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. COMPLETED RESULTS STATE */}
      {quizState === 'completed' && (
        <div className="p-8 rounded-3xl glass-panel border border-gray-800 space-y-8">
          {/* Result Banner */}
          {(() => {
            const { correct, total, scorePct } = calculateResults();
            return (
              <>
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 rounded-3xl bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto border border-blue-500/30">
                    <Award className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-white">Quiz Completed!</h2>
                  <div className="text-4xl font-extrabold gradient-text">{scorePct}% Score</div>
                  <p className="text-xs text-gray-400">
                    Answered {correct} out of {total} questions correctly in {Math.floor(secondsElapsed / 60)}m {secondsElapsed % 60}s.
                  </p>
                </div>

                {/* Diagnostic Weak Topic Sync Notice */}
                {scorePct < 60 && (
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-xs text-rose-300">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                      <span>
                        Topic <strong>"{selectedTopic}"</strong> added to your Weak Topics diagnostic list for targeted review.
                      </span>
                    </div>
                    <button
                      onClick={() => onNavigate('/app/weak-topics')}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-semibold shrink-0"
                    >
                      View Weak Topics
                    </button>
                  </div>
                )}

                {/* Breakdown Answers List */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-200">Answer Breakdown & Explanations</h3>

                  {questions.map((q, idx) => {
                    const userOpt = selectedAnswers[idx];
                    const isCorrect = userOpt === q.correctOptionIndex;
                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border space-y-2 ${
                          isCorrect
                            ? 'bg-emerald-500/10 border-emerald-500/30'
                            : 'bg-rose-500/10 border-rose-500/30'
                        }`}
                      >
                        <div className="flex items-start gap-2 text-xs font-semibold text-gray-200">
                          {isCorrect ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          )}
                          <span>
                            {idx + 1}. {q.questionText}
                          </span>
                        </div>

                        <div className="text-xs text-gray-400 pl-6 space-y-1">
                          <div>
                            Your Answer: <strong className={isCorrect ? 'text-emerald-300' : 'text-rose-300'}>{q.options[userOpt] || 'None'}</strong>
                          </div>
                          {!isCorrect && (
                            <div>
                              Correct Answer: <strong className="text-emerald-300">{q.options[q.correctOptionIndex]}</strong>
                            </div>
                          )}
                          <div className="text-[11px] text-gray-400 pt-1 italic">{q.explanation}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4 pt-4 border-t border-gray-800">
                  <button
                    onClick={() => setQuizState('setup')}
                    className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Take Another Quiz
                  </button>

                  <button
                    onClick={() => onNavigate('/app/dashboard')}
                    className="flex-1 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold text-xs transition-colors"
                  >
                    Return to Dashboard
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};
