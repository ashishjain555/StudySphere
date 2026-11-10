import React, { useState, useEffect, useRef } from 'react';
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
  Upload,
  FileText,
  Trash2,
  Loader2,
  Sparkles,
  Plus,
  Flame,
  Zap,
  Target,
  Brain,
  Lightbulb,
  Check,
  ChevronRight,
  BarChart2,
  TrendingUp,
  Layers,
  GraduationCap,
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

  // Dedicated direct PDF upload states
  const [activePdfText, setActivePdfText] = useState<string>(initialPDFText || '');
  const [activePdfTitle, setActivePdfTitle] = useState<string>(initialPDFTitle || '');
  const [attachedPdfFile, setAttachedPdfFile] = useState<File | null>(null);
  const [isReadingPdf, setIsReadingPdf] = useState<boolean>(false);
  const [pdfUploadError, setPdfUploadError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const [filterResult, setFilterResult] = useState<'all' | 'incorrect' | 'correct'>('all');

  // Stats
  const attempts = DataStore.getQuizAttempts();
  const totalQuizzes = attempts.length;
  const avgScore =
    totalQuizzes > 0
      ? Math.round(attempts.reduce((acc, a) => acc + a.scorePercentage, 0) / totalQuizzes)
      : 0;
  const weakTopicsCount = DataStore.getWeakTopics().length;

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

  const handleDirectPdfUpload = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setPdfUploadError('Please select a valid PDF document file (.pdf).');
      return;
    }
    setPdfUploadError('');
    setIsReadingPdf(true);
    setAttachedPdfFile(file);
    const docName = file.name.replace(/\.pdf$/i, '');
    setActivePdfTitle(docName);
    setSelectedTopic(docName);

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const base64Data = await base64Promise;

      const res = await fetch('/api/ai/analyze-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfBase64: base64Data,
          filename: file.name,
        }),
      });
      const data = await res.json();
      if (data.extractedText) {
        setActivePdfText(data.extractedText);
      } else {
        setActivePdfText(`STUDY TOPIC: ${docName}`);
      }
    } catch (err) {
      console.warn('Direct PDF extraction fallback:', err);
      setActivePdfText(`STUDY TOPIC: ${docName}`);
    } finally {
      setIsReadingPdf(false);
    }
  };

  const handleRemovePdf = () => {
    setAttachedPdfFile(null);
    setActivePdfText('');
    setActivePdfTitle('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleStartQuiz = async () => {
    setIsGenerating(true);
    try {
      const targetSubj = subjects.find((s) => s.id === selectedSubjectId);
      
      const res = await fetch('/api/ai/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: targetSubj?.name || selectedTopic || 'General Studies',
          topic: selectedTopic,
          difficulty,
          questionCount,
          pdfText: activePdfText || initialPDFText,
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

  const handleRetakeSameQuiz = () => {
    setCurrentIdx(0);
    setSelectedAnswers({});
    setSecondsElapsed(0);
    setQuizState('running');
  };

  const handleSelectOption = (optIdx: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [currentIdx]: optIdx }));
  };

  const handleFinishQuiz = () => {
    let correct = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctOptionIndex) {
        correct += 1;
      }
    });

    const scorePct = Math.round((correct / questions.length) * 100);
    const targetSubj = subjects.find((s) => s.id === selectedSubjectId);

    const attempt: QuizAttempt = {
      id: `qa_${Date.now()}`,
      userId: DataStore.getActiveUser().id,
      subjectId: selectedSubjectId,
      subjectName: targetSubj?.name || selectedTopic || 'General Studies',
      topicTitle: selectedTopic,
      scorePercentage: scorePct,
      totalQuestions: questions.length,
      correctCount: correct,
      timeTakenSeconds: secondsElapsed,
      completedAt: new Date().toISOString(),
    };

    DataStore.recordQuizAttempt(attempt);

    if (scorePct >= 80) {
      confetti({ particleCount: 110, spread: 80, origin: { y: 0.6 } });
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

  const { correct, total, scorePct } = calculateResults();

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto pb-12">
      {/* Quiz Header & AI Engine Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/25 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              AI Adaptive Exam Simulator
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white flex items-center gap-3">
            <HelpCircle className="w-8 h-8 text-blue-500" />
            Practice Quiz Generator
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Test concepts, formulate questions directly from PDF notes, and detect weak areas before exams.
          </p>
        </div>

        {quizState !== 'setup' && (
          <button
            type="button"
            onClick={() => setQuizState('setup')}
            className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-800 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            New Quiz Setup
          </button>
        )}
      </div>

      {/* 1. SETUP STATE */}
      {quizState === 'setup' && (
        <div className="space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-2xl glass-panel bg-gray-950/70 border border-gray-800/80 flex items-center gap-3.5 shadow-lg">
              <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-black text-white">{totalQuizzes}</div>
                <div className="text-[11px] text-gray-400">Total Attempts</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl glass-panel bg-gray-950/70 border border-gray-800/80 flex items-center gap-3.5 shadow-lg">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-black text-emerald-400">{avgScore}%</div>
                <div className="text-[11px] text-gray-400">Average Accuracy</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl glass-panel bg-gray-950/70 border border-gray-800/80 flex items-center gap-3.5 shadow-lg">
              <div className="w-11 h-11 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-black text-rose-400">{weakTopicsCount}</div>
                <div className="text-[11px] text-gray-400">Weak Topics Identified</div>
              </div>
            </div>
          </div>

          {/* Main Setup Card */}
          <div className="p-6 sm:p-8 rounded-3xl glass-panel bg-gray-950/80 border border-gray-800 space-y-6 shadow-xl">
            {/* Direct PDF Upload / Attached PDF Banner */}
            {activePdfText || activePdfTitle ? (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-900/40 border border-blue-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn shadow-lg">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wide">
                        Attached PDF Document
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                        Active Quiz Source
                      </span>
                    </div>
                    <p className="text-sm font-bold text-white mt-1">
                      {activePdfTitle || attachedPdfFile?.name || 'Uploaded Study PDF'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isReadingPdf
                        ? 'Extracting syllabus concepts from PDF...'
                        : 'AI will formulate multiple-choice questions strictly from this PDF document.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={handleRemovePdf}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-rose-400 hover:text-rose-300 text-xs font-semibold border border-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove PDF</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Direct PDF Upload Dropzone */
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleDirectPdfUpload(file);
                }}
                className="p-5 sm:p-6 rounded-2xl border-2 border-dashed border-indigo-500/30 hover:border-indigo-500/70 bg-gradient-to-br from-indigo-950/20 via-slate-900/40 to-slate-950/40 transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left group shadow-inner"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 group-hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/25 flex items-center justify-center transition-all group-hover:scale-105 shrink-0 shadow-md shadow-indigo-600/10">
                    {isReadingPdf ? <Loader2 className="w-6 h-6 animate-spin text-indigo-400" /> : <Upload className="w-6 h-6" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors flex items-center gap-2 justify-center sm:justify-start">
                      Generate Quiz directly from a PDF Document
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                        DIRECT UPLOAD
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Upload your chapter notes, syllabus PDF, or textbook slides — AI will parse questions directly from it.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-2 border border-indigo-400/30 shadow-md shrink-0 pointer-events-none"
                >
                  <Plus className="w-4 h-4" />
                  <span>Choose PDF File</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleDirectPdfUpload(file);
                  }}
                />
              </div>
            )}

            {pdfUploadError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{pdfUploadError}</span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2 border-t border-gray-800/80">
              <h2 className="text-base font-bold text-gray-100 flex items-center gap-2">
                <Brain className="w-4 h-4 text-blue-400" />
                Configure Quiz Parameters
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Subject Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Academic Subject
                </label>
                <div className="relative">
                  <BookOpen className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-gray-100 text-sm focus:border-blue-500 focus:outline-none transition-all cursor-pointer"
                  >
                    {subjects.length > 0 ? (
                      subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.code}: {s.name}
                        </option>
                      ))
                    ) : (
                      <option value="general">General Engineering & Science</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Topic Input */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Topic / Target Chapter
                </label>
                <div className="relative">
                  <Target className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    placeholder="e.g. Graph Traversal, SQL Joins, Deadlocks"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-gray-100 text-sm focus:border-blue-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Difficulty Level */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setDifficulty('easy')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      difficulty === 'easy'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500'
                        : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                      <Zap className="w-4 h-4 text-emerald-400" />
                      Easy Mode
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">Core definitions & basic terminology</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDifficulty('medium')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      difficulty === 'medium'
                        ? 'bg-blue-600/15 border-blue-500 text-blue-300 shadow-md shadow-blue-500/10 ring-1 ring-blue-500'
                        : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                      <Target className="w-4 h-4 text-blue-400" />
                      Medium Mode
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">Standard university midterms & problem solving</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDifficulty('hard')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      difficulty === 'hard'
                        ? 'bg-rose-500/10 border-rose-500 text-rose-300 shadow-md shadow-rose-500/10 ring-1 ring-rose-500'
                        : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                      <Flame className="w-4 h-4 text-rose-400" />
                      Hard / GATE Mode
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">Edge cases, complex algorithms & proofs</p>
                  </button>
                </div>
              </div>

              {/* Number of Questions */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Question Count & Estimated Duration
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { cnt: 5, time: '~5 mins', label: 'Quick Sprint' },
                    { cnt: 10, time: '~10 mins', label: 'Standard Test' },
                    { cnt: 15, time: '~15 mins', label: 'Full Review' },
                    { cnt: 20, time: '~20 mins', label: 'Mock Exam' },
                  ].map(({ cnt, time, label }) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setQuestionCount(cnt)}
                      className={`p-3 rounded-xl text-center border transition-all cursor-pointer ${
                        questionCount === cnt
                          ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/20'
                          : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:text-gray-200 hover:border-gray-700'
                      }`}
                    >
                      <div className="font-bold text-xs">{cnt} Questions</div>
                      <div className="text-[10px] opacity-75 mt-0.5">{time} • {label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Start Quiz Action */}
            <div className="pt-2">
              <button
                onClick={handleStartQuiz}
                disabled={isGenerating}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-500 text-white font-bold text-sm border border-blue-400/40 flex items-center justify-center gap-2.5 transition-all shadow-xl shadow-blue-600/25 disabled:opacity-50 cursor-pointer active:scale-[0.99]"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>AI is synthesizing questions from your syllabus...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-amber-300" />
                    <span>Synthesize & Start Practice Quiz</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. RUNNING QUIZ STATE */}
      {quizState === 'running' && questions.length > 0 && (
        <div className="p-6 sm:p-8 rounded-3xl glass-panel bg-gray-950/80 border border-gray-800 space-y-6 shadow-2xl animate-fadeIn">
          {/* Progress Header */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <span className="font-mono font-bold text-blue-400 bg-blue-500/15 px-3 py-1 rounded-full border border-blue-500/30">
                  Question {currentIdx + 1} of {questions.length}
                </span>
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                  {difficulty} difficulty
                </span>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
                <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>
                  {Math.floor(secondsElapsed / 60)}:
                  {(secondsElapsed % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>

            {/* Visual Animated Progress Bar */}
            <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 transition-all duration-300 rounded-full"
                style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Text Box */}
          <div className="p-5 rounded-2xl bg-gray-900/60 border border-gray-800/80">
            <div className="text-xs text-gray-400 font-mono uppercase tracking-wider mb-2 flex items-center gap-2">
              <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
              <span>Question {currentIdx + 1}</span>
            </div>
            <div className="text-base sm:text-lg font-bold text-white leading-relaxed">
              {questions[currentIdx].questionText}
            </div>
          </div>

          {/* Option Cards */}
          <div className="space-y-3">
            {questions[currentIdx].options.map((opt, optIdx) => {
              const isSelected = selectedAnswers[currentIdx] === optIdx;
              return (
                <div
                  key={optIdx}
                  onClick={() => handleSelectOption(optIdx)}
                  className={`p-4 sm:p-4.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${
                    isSelected
                      ? 'bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-blue-950/40 border-blue-500 text-white shadow-lg shadow-blue-600/15 ring-1 ring-blue-500'
                      : 'bg-gray-900/50 border-gray-800/80 text-gray-300 hover:border-gray-700 hover:bg-gray-900/80'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-8 h-8 rounded-xl border flex items-center justify-center font-bold text-xs font-mono transition-colors ${
                        isSelected
                          ? 'bg-blue-600 border-blue-400 text-white shadow-md'
                          : 'border-gray-700 bg-gray-950 text-gray-400 group-hover:border-gray-600'
                      }`}
                    >
                      {String.fromCharCode(65 + optIdx)}
                    </div>
                    <span className="text-sm font-medium leading-snug">{opt}</span>
                  </div>

                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Question Breadcrumb Tracker */}
          <div className="flex items-center justify-center gap-1.5 flex-wrap pt-2">
            {questions.map((_, i) => {
              const answered = selectedAnswers[i] !== undefined;
              const isCurr = i === currentIdx;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentIdx(i)}
                  className={`w-7 h-7 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                    isCurr
                      ? 'bg-blue-600 text-white border border-blue-400 scale-110 shadow-md'
                      : answered
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-gray-900 text-gray-500 border border-gray-800 hover:border-gray-700'
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-800/80">
            <button
              onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
              disabled={currentIdx === 0}
              className="px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 text-xs font-semibold disabled:opacity-40 transition-colors cursor-pointer"
            >
              Previous
            </button>

            {currentIdx < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIdx((prev) => prev + 1)}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 border border-blue-400/30 cursor-pointer transition-colors shadow-md"
              >
                <span>Next Question</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinishQuiz}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Submit & View Results</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. COMPLETED RESULTS STATE */}
      {quizState === 'completed' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Hero Result Score Card */}
          <div className="p-8 rounded-3xl glass-panel bg-gray-950/80 border border-gray-800 space-y-6 text-center shadow-2xl relative overflow-hidden">
            <div className="space-y-3">
              <div
                className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center border shadow-xl ${
                  scorePct >= 80
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 shadow-amber-500/10'
                    : scorePct >= 60
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 shadow-blue-500/10'
                    : 'bg-rose-500/20 text-rose-400 border-rose-500/30 shadow-rose-500/10'
                }`}
              >
                <Award className="w-10 h-10" />
              </div>

              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-gray-400">
                  Quiz Completed Successfully
                </span>
                <div className="text-5xl font-black text-white mt-1">
                  <span className={scorePct >= 80 ? 'text-emerald-400' : scorePct >= 60 ? 'text-blue-400' : 'text-rose-400'}>
                    {scorePct}%
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-200 mt-1">
                  {scorePct >= 80
                    ? 'Outstanding Mastery! 🏆'
                    : scorePct >= 60
                    ? 'Solid Effort — Good Progression! 👍'
                    : 'Concept Review Recommended 🎯'}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Solved {correct} out of {total} questions correctly in {Math.floor(secondsElapsed / 60)}m {secondsElapsed % 60}s.
                </p>
              </div>

              {/* Metrics Pills */}
              <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
                <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {correct} Correct
                </span>
                <span className="text-xs px-3 py-1 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 font-semibold flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5" />
                  {total - correct} Incorrect
                </span>
                <span className="text-xs px-3 py-1 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 font-semibold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {Math.round(secondsElapsed / Math.max(1, total))}s avg / question
                </span>
              </div>
            </div>

            {/* Diagnostic Weak Topic Sync Notice */}
            {scorePct < 60 && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-left animate-fadeIn">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                  <span className="text-xs text-rose-300">
                    Topic <strong>"{selectedTopic}"</strong> has been automatically logged to your Weak Topics detector for structured revision.
                  </span>
                </div>
                <button
                  onClick={() => onNavigate('/app/weak-topics')}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors shrink-0 cursor-pointer shadow-md"
                >
                  View Weak Topics
                </button>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-gray-800/80">
              <button
                onClick={handleRetakeSameQuiz}
                className="w-full sm:flex-1 py-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-200 font-semibold text-xs transition-colors flex items-center justify-center gap-2 border border-gray-800 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Retake This Quiz
              </button>

              <button
                onClick={() => setQuizState('setup')}
                className="w-full sm:flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 border border-blue-400/30 shadow-lg shadow-blue-600/20 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Configure New Quiz
              </button>

              <button
                onClick={() => onNavigate('/app/dashboard')}
                className="w-full sm:flex-1 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                Return to Dashboard
              </button>
            </div>
          </div>

          {/* Breakdown Answers Section */}
          <div className="p-6 sm:p-8 rounded-3xl glass-panel bg-gray-950/80 border border-gray-800 space-y-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-800/80">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  Answer Breakdown & Explanations
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Review question rationale and concept solutions</p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-900 border border-gray-800 text-xs">
                <button
                  type="button"
                  onClick={() => setFilterResult('all')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    filterResult === 'all' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  All ({total})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterResult('incorrect')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    filterResult === 'incorrect' ? 'bg-rose-600 text-white' : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Incorrect ({total - correct})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterResult('correct')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    filterResult === 'correct' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Correct ({correct})
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {questions
                .map((q, idx) => ({ q, idx }))
                .filter(({ q, idx }) => {
                  const userOpt = selectedAnswers[idx];
                  const isCorrect = userOpt === q.correctOptionIndex;
                  if (filterResult === 'correct') return isCorrect;
                  if (filterResult === 'incorrect') return !isCorrect;
                  return true;
                })
                .map(({ q, idx }) => {
                  const userOpt = selectedAnswers[idx];
                  const isCorrect = userOpt === q.correctOptionIndex;
                  return (
                    <div
                      key={idx}
                      className={`p-5 rounded-2xl border space-y-3.5 transition-all ${
                        isCorrect
                          ? 'bg-emerald-500/5 border-emerald-500/30'
                          : 'bg-rose-500/5 border-rose-500/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          {isCorrect ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                          )}
                          <span className="text-sm font-bold text-gray-100 leading-snug">
                            {idx + 1}. {q.questionText}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full uppercase font-bold shrink-0 ${
                            isCorrect
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {isCorrect ? 'Correct' : 'Needs Review'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs pl-7">
                        <div className={`p-3 rounded-xl border ${isCorrect ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-rose-500/10 border-rose-500/20 text-rose-300'}`}>
                          <span className="text-[10px] uppercase font-bold tracking-wider block opacity-75 mb-0.5">
                            Your Chosen Answer:
                          </span>
                          <span className="font-semibold">{q.options[userOpt] || 'Unanswered'}</span>
                        </div>

                        {!isCorrect && (
                          <div className="p-3 rounded-xl border bg-emerald-500/10 border-emerald-500/20 text-emerald-300">
                            <span className="text-[10px] uppercase font-bold tracking-wider block opacity-75 mb-0.5">
                              Correct Syllabus Answer:
                            </span>
                            <span className="font-semibold">{q.options[q.correctOptionIndex]}</span>
                          </div>
                        )}
                      </div>

                      {q.explanation && (
                        <div className="ml-7 p-3.5 rounded-xl bg-gray-900/80 border border-gray-800 text-xs text-gray-300 space-y-1">
                          <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                            <Lightbulb className="w-3.5 h-3.5" />
                            <span>AI Concept Explanation</span>
                          </div>
                          <p className="leading-relaxed text-gray-400">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
