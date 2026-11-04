import React, { useState, useRef, useMemo } from 'react';
import {
  BookOpen,
  ArrowLeft,
  FileText,
  Clock,
  MessageSquare,
  Loader2,
  ChevronRight,
  FolderOpen,
  UploadCloud,
  X,
  AlertCircle,
  CheckCircle2,
  Layers,
  Trash2,
  ChevronDown,
} from 'lucide-react';
import { DataStore, formatChapterLabel, formatFileSize } from '../lib/dataStore';
import { Subject, Topic, SubjectDocument } from '../types';

interface SubjectDetailPageProps {
  subjectId: string;
  onNavigate: (path: string) => void;
  onAskAI: (query: string) => void;
}

const formatUploadedDate = (isoStr?: string): string => {
  if (!isoStr) return 'Recently';
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'Recently';
  }
};

const getChapterDisplay = (rawName?: string, chapterNum: number = 1): { badge: string; title: string } => {
  const badge = `Chapter ${chapterNum}`;
  if (!rawName) return { badge, title: `Core Curriculum` };
  const cleaned = rawName
    .replace(/^(unit|chapter)\s*\d+\s*:\s*/i, '')
    .replace(/^(unit|chapter)\s*\d+\s*-\s*/i, '')
    .replace(/^(unit|chapter)\s*\d+\s*/i, '')
    .trim();
  return { badge, title: cleaned || `Core Curriculum` };
};

const formatInline = (text: string): React.ReactNode => {
  if (!text) return null;
  const tokens = text.split(/(\*\*.*?\*\*|`.*?`|\$\$.*?\$\$|\$.*?\$)/g);

  return tokens.map((token, idx) => {
    if (token.startsWith('**') && token.endsWith('**') && token.length >= 4) {
      return (
        <strong key={idx} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith('`') && token.endsWith('`') && token.length >= 2) {
      return (
        <code key={idx} className="px-1.5 py-0.5 rounded bg-gray-950 border border-gray-800 text-cyan-300 font-mono text-xs">
          {token.slice(1, -1)}
        </code>
      );
    }
    if (token.startsWith('$$') && token.endsWith('$$') && token.length >= 4) {
      return (
        <span key={idx} className="font-mono text-amber-300 font-semibold px-1">
          {token.slice(2, -2)}
        </span>
      );
    }
    if (token.startsWith('$') && token.endsWith('$') && token.length >= 2) {
      return (
        <span key={idx} className="font-mono text-amber-300 font-semibold px-0.5">
          {token.slice(1, -1)}
        </span>
      );
    }
    return token;
  });
};

const renderNotesMarkdown = (content: string) => {
  if (!content) return null;
  const parts = content.split(/(```[\s\S]*?```)/g);

  return parts.map((part, pIdx) => {
    if (part.startsWith('```')) {
      const match = part.match(/^```(\w+)?\n?([\s\S]*?)```$/);
      const language = match ? match[1] || '' : '';
      const code = match ? match[2] : part.slice(3, -3);
      return (
        <div key={pIdx} className="my-3 rounded-xl bg-gray-950 border border-gray-800 overflow-hidden font-mono text-xs">
          {language && (
            <div className="px-3 py-1 bg-gray-900 border-b border-gray-800 text-[10px] text-gray-400 font-bold uppercase">
              {language}
            </div>
          )}
          <pre className="p-4 text-cyan-300 overflow-x-auto whitespace-pre">{code.trim()}</pre>
        </div>
      );
    }

    const lines = part.split('\n');
    return (
      <div key={pIdx} className="space-y-2">
        {lines.map((line, lIdx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={lIdx} className="h-1.5" />;

          if (trimmed.startsWith('> ')) {
            return (
              <div key={lIdx} className="my-2.5 p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border-l-4 border-blue-500 text-sm text-blue-900 dark:text-blue-200">
                {formatInline(trimmed.replace(/^>\s+/, ''))}
              </div>
            );
          }
          if (trimmed.startsWith('### ')) {
            return (
              <h4 key={lIdx} className="text-base font-bold text-blue-600 dark:text-blue-300 pt-3 pb-1 border-b border-gray-800/80">
                {formatInline(trimmed.replace(/^###\s+/, ''))}
              </h4>
            );
          }
          if (trimmed.startsWith('## ')) {
            return (
              <h3 key={lIdx} className="text-lg font-bold text-white pt-4 pb-1">
                {formatInline(trimmed.replace(/^##\s+/, ''))}
              </h3>
            );
          }
          if (/^[-*•]\s+/.test(trimmed)) {
            return (
              <div key={lIdx} className="flex items-start gap-2.5 my-1 text-gray-200 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 mt-2 shrink-0" />
                <span className="flex-1">{formatInline(trimmed.replace(/^[-*•]\s+/, ''))}</span>
              </div>
            );
          }
          const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
          if (numMatch) {
            return (
              <div key={lIdx} className="flex items-start gap-2.5 my-1 text-gray-200 text-sm">
                <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">{numMatch[1]}.</span>
                <span className="flex-1">{formatInline(numMatch[2])}</span>
              </div>
            );
          }

          return (
            <p key={lIdx} className="text-sm text-gray-200 leading-relaxed my-1">
              {formatInline(line)}
            </p>
          );
        })}
      </div>
    );
  });
};

export const SubjectDetailPage: React.FC<SubjectDetailPageProps> = ({
  subjectId,
  onNavigate,
  onAskAI,
}) => {
  const subjects = DataStore.getSubjects();
  const foundSubject = subjects.find((s) => s.id === subjectId) || (subjects.length > 0 ? subjects[0] : null);
  const [subject, setSubject] = useState<Subject | null>(foundSubject);
  const [topics, setTopics] = useState<Topic[]>(() => (foundSubject ? DataStore.getTopics(foundSubject.id) : []));
  const materials = foundSubject ? DataStore.getMaterials().filter((m) => m.subjectId === foundSubject.id) : [];

  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'materials'>('overview');
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(topics[0] || null);
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(topics[0]?.id || null);
  const [expandedSubtopicIdx, setExpandedSubtopicIdx] = useState<Record<string, boolean>>({});

  // Group topics by Chapter / Unit
  const chaptersMap: Record<number, Topic[]> = useMemo(() => {
    const map: Record<number, Topic[]> = {};
    topics.forEach((t) => {
      const num = Number(t.unitNumber) || 1;
      if (!map[num]) map[num] = [];
      map[num].push(t);
    });
    return map;
  }, [topics]);

  const chapterNumbers = useMemo(() => {
    const keys = Object.keys(chaptersMap).map(Number).sort((a, b) => a - b);
    return keys.length > 0 ? keys : [1, 2, 3, 4];
  }, [chaptersMap]);

  // Active Chapter calculations: Only this chapter's topics are displayed!
  const activeChapterNum = selectedChapter && chapterNumbers.includes(selectedChapter)
    ? selectedChapter
    : (chapterNumbers[0] || 1);
  const activeChapterTopics = chaptersMap[activeChapterNum] || [];
  const activeChapterFirstTopic = activeChapterTopics[0];
  const activeChapterDisplay = getChapterDisplay(activeChapterFirstTopic?.unitName, activeChapterNum);
  const activeTotalMins = activeChapterTopics.reduce((acc, t) => acc + (t.durationMins || 45), 0);
  const activeDocSource = activeChapterFirstTopic?.documentName;

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'subject' | 'chapter' | 'topic' | 'document';
    id: string;
    name: string;
    chapterNum?: number;
  } | null>(null);

  const handleConfirmDelete = () => {
    if (!deleteTarget || !subject) return;

    if (deleteTarget.type === 'subject') {
      DataStore.deleteSubject(subject.id);
      onNavigate('/app/subjects');
    } else if (deleteTarget.type === 'chapter') {
      const cNum = deleteTarget.chapterNum!;
      DataStore.deleteChapter(subject.id, cNum);
      const updatedTopics = DataStore.getTopics(subject.id);
      setTopics(updatedTopics);
      const remainingChapNums = Array.from(new Set(updatedTopics.map((t) => Number(t.unitNumber) || 1))).sort((a, b) => a - b);
      if (selectedChapter === cNum || activeChapterNum === cNum) {
        setSelectedChapter(remainingChapNums[0] || null);
      }
      if (selectedTopic && selectedTopic.unitNumber === cNum) {
        setSelectedTopic(updatedTopics[0] || null);
        if (updatedTopics.length === 0) {
          setActiveTab('overview');
        }
      }
      const updatedSubjs = DataStore.getSubjects();
      const current = updatedSubjs.find((s) => s.id === subject.id);
      if (current) setSubject(current);
    } else if (deleteTarget.type === 'topic') {
      DataStore.deleteTopic(deleteTarget.id);
      const updatedTopics = DataStore.getTopics(subject.id);
      setTopics(updatedTopics);
      if (selectedTopic?.id === deleteTarget.id) {
        const fallback =
          updatedTopics.find((t) => t.unitNumber === selectedTopic.unitNumber) || updatedTopics[0] || null;
        setSelectedTopic(fallback);
        if (!fallback) setActiveTab('overview');
      }
      const updatedSubjs = DataStore.getSubjects();
      const current = updatedSubjs.find((s) => s.id === subject.id);
      if (current) setSubject(current);
    }

    setDeleteTarget(null);
  };

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleUploadPDF = async (file: File) => {
    if (!subject) {
      setErrorMessage('Subject could not be loaded.');
      return;
    }

    if (file.type !== 'application/pdf') {
      setErrorMessage('Please upload a valid PDF document (.pdf).');
      return;
    }

    if (file.size > 30 * 1024 * 1024) {
      setErrorMessage('File size exceeds 30 MB limit.');
      return;
    }

    setErrorMessage('');
    setIsUploading(true);
    setUploadProgress(20);
    setUploadStatus('Reading PDF document into memory...');

    try {
      const base64Data = await readFileAsBase64(file);
      setUploadProgress(45);
      setUploadStatus(`AI parsing chapters & topics for ${subject.name}...`);

      const res = await fetch('/api/ai/parse-subject-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfBase64: base64Data,
          filename: file.name,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to parse chapters and topics from PDF.');
      }

      setUploadProgress(80);
      setUploadStatus('Adding new Chapters and Topics to this subject...');
      const data = await res.json();

      // Intelligent Chapter Number Assignment:
      // If filename or unit specifies a chapter (e.g. CIS Chp2 Complete.pdf -> Chapter 2),
      // and that chapter does not yet exist in this subject, use that chapter number.
      // Otherwise, use next available chapter number so PDFs never collide or mix.
      const currentChapNums = Object.keys(chaptersMap).map(Number);
      const existingMaxUnit = currentChapNums.length > 0 ? Math.max(...currentChapNums) : 0;
      const fileChapterMatch = file.name.match(/(?:chp|chapter|unit|ch)[\s_-]*(\d+)/i);
      const fileChapterNum = fileChapterMatch ? parseInt(fileChapterMatch[1], 10) : null;
      const docId = `doc_${Date.now()}`;
      const newTopics: Topic[] = [];

      if (Array.isArray(data.units)) {
        data.units.forEach((unit: any, uIdx: number) => {
          let uNum: number;
          const detectedUnitNum = unit.unitNumber || fileChapterNum;
          if (detectedUnitNum && !currentChapNums.includes(detectedUnitNum)) {
            uNum = detectedUnitNum;
          } else {
            uNum = existingMaxUnit + uIdx + 1;
          }
          const uName = formatChapterLabel(unit.unitName, uNum);
          if (Array.isArray(unit.topics)) {
            unit.topics.forEach((t: any, tIdx: number) => {
              newTopics.push({
                id: `top_${Date.now()}_${uNum}_${tIdx}`,
                subjectId: subject.id,
                documentId: docId,
                documentName: file.name,
                unitNumber: uNum,
                unitName: uName,
                title: t.title || `Topic ${tIdx + 1}`,
                description: t.description || 'Topic breakdown and study guide.',
                notesContent: t.notesContent || 'Detailed notes generated from PDF.',
                subtopics: Array.isArray(t.subtopics) ? t.subtopics : [],
                durationMins: t.durationMins || 45,
                difficulty: t.difficulty || 'medium',
                questionsCount: 5,
              });
            });
          }
        });
      }

      if (newTopics.length > 0) {
        DataStore.addTopics(newTopics);
        const updatedList = DataStore.getTopics(subject.id);
        setTopics(updatedList);
        setSelectedTopic(newTopics[0]);
        // Immediately make the new chapter active so only its topics appear!
        setSelectedChapter(newTopics[0].unitNumber);
        setExpandedTopicId(newTopics[0].id);

        const allUnitNumbers = new Set(updatedList.map((t) => Number(t.unitNumber)));
        const updatedSubj: Subject = {
          ...subject,
          unitsCount: allUnitNumbers.size,
          topicCount: updatedList.length,
        };
        DataStore.updateSubject(updatedSubj);
        setSubject(updatedSubj);
      }

      setUploadProgress(100);
      setUploadStatus('Chapters and topics added successfully!');

      setTimeout(() => {
        setIsUploading(false);
        setShowUploadModal(false);
      }, 700);
    } catch (err: any) {
      console.error('Failed to add chapters from PDF:', err);
      setErrorMessage(err.message || 'Failed to parse chapters from PDF.');
      setIsUploading(false);
    }
  };

  if (!subject) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <button
          onClick={() => onNavigate('/app/subjects')}
          className="text-xs font-semibold text-gray-400 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Subject Library
        </button>
        <div className="p-12 text-center rounded-3xl glass-card border border-gray-800 bg-gray-900/40 space-y-4 max-w-lg mx-auto my-12">
          <BookOpen className="w-12 h-12 text-gray-500 mx-auto" />
          <h2 className="text-xl font-bold text-white">Subject Not Found</h2>
          <p className="text-gray-400 text-xs">
            This subject doesn't exist in your curriculum. Go to your Subject Library to view or create your subjects.
          </p>
          <button
            onClick={() => onNavigate('/app/subjects')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            View Subject Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Back Navigation */}
      <button
        onClick={() => onNavigate('/app/subjects')}
        className="text-xs font-semibold text-gray-400 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Subject Library
      </button>

      {/* Subject Header Banner */}
      <div className="p-8 rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/20 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-500/30">
              {subject.code}
            </span>
            <h1 className="text-3xl font-extrabold text-white">{subject.name}</h1>
            <p className="text-sm text-gray-400 dark:text-gray-300 max-w-2xl">{subject.description}</p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                setErrorMessage('');
                setShowUploadModal(true);
              }}
              className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-2 border border-blue-400/30 transition-all cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 text-blue-200" />
              Add Chapters via PDF
            </button>

            <button
              onClick={() =>
                setDeleteTarget({
                  type: 'subject',
                  id: subject.id,
                  name: subject.name,
                })
              }
              className="px-3.5 py-2.5 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 hover:text-red-200 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              title="Delete Subject"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
              <span className="hidden sm:inline">Delete Subject</span>
            </button>

            <div className="px-5 py-3 rounded-2xl glass-card text-center border-gray-800">
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{subject.progressPercentage}%</div>
              <div className="text-[10px] text-gray-400 font-medium">Completion</div>
            </div>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-800 pb-3">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'overview' ? 'bg-blue-600 text-white border border-blue-400/40' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Chapters ({chapterNumbers.length})
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'notes' ? 'bg-blue-600 text-white border border-blue-400/40' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          Topic Notes & Mechanics {selectedTopic ? `• ${selectedTopic.title.slice(0, 18)}...` : ''}
        </button>
        <button
          onClick={() => setActiveTab('materials')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'materials' ? 'bg-blue-600 text-white border border-blue-400/40' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          Resources & Materials ({materials.length})
        </button>
      </div>

      {/* Overview Tab Content: Single Active Chapter with its Topics */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Chapter Selector Navigation Bar */}
          <div className="p-4 rounded-2xl glass-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-gray-800/80">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-1">Select Chapter:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {chapterNumbers.map((cNum) => {
                  const isSelected = activeChapterNum === cNum;
                  const cTopics = chaptersMap[cNum] || [];
                  return (
                    <button
                      key={cNum}
                      onClick={() => setSelectedChapter(cNum)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white border border-blue-400'
                          : 'bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-800'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Chap {cNum}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-gray-800 text-gray-400'
                        }`}
                      >
                        {cTopics.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => {
                setErrorMessage('');
                setShowUploadModal(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 border border-blue-400/30 transition-all cursor-pointer self-start sm:self-auto"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              + Add Chapters via PDF
            </button>
          </div>

          {/* Active Chapter Details & Topics List (Only active chapter is shown, not stacked!) */}
          {chapterNumbers.length === 0 ? (
            <div className="p-12 text-center text-gray-400 glass-card rounded-2xl border-gray-800">
              <BookOpen className="w-10 h-10 mx-auto text-gray-600 mb-2" />
              <p className="text-sm font-semibold text-gray-300">No chapters found for this subject.</p>
              <p className="text-xs text-gray-500 mt-1">Upload a PDF to automatically generate chapters and topics.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Active Chapter Header Card */}
              <div className="p-5 sm:p-6 rounded-2xl glass-panel bg-gray-950/80 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="px-3.5 py-2 rounded-xl bg-indigo-600/20 text-indigo-400 font-mono font-bold text-sm flex items-center gap-2 border border-indigo-500/30 shrink-0">
                    <BookOpen className="w-4 h-4 text-indigo-400" />
                    <span>{activeChapterDisplay.badge}</span>
                  </div>

                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-bold text-white truncate">
                        {activeChapterDisplay.title}
                      </h3>
                      {activeDocSource && (
                        <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950/70 border border-indigo-500/30 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                          <FileText className="w-2.5 h-2.5 text-indigo-400" />
                          <span className="truncate max-w-[180px]">{activeDocSource}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 flex items-center gap-2">
                      <span>{activeChapterTopics.length} Topics covered</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-500" /> ~{activeTotalMins} mins total study time
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    title={`Delete Chapter ${activeChapterNum}`}
                    onClick={() => {
                      setDeleteTarget({
                        type: 'chapter',
                        id: String(activeChapterNum),
                        name: `${activeChapterDisplay.badge}: ${activeChapterDisplay.title}`,
                        chapterNum: activeChapterNum,
                      });
                    }}
                    className="px-3 py-1.5 rounded-xl bg-gray-900/90 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors border border-gray-800 hover:border-red-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    <span>Delete Chapter</span>
                  </button>
                </div>
              </div>

              {/* Active Chapter's Topics Cards List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    {activeChapterDisplay.badge} Topics ({activeChapterTopics.length})
                  </span>
                  <span className="text-[11px] text-gray-400 hidden sm:inline">
                    Click any topic to read deep theory, numericals & formulas
                  </span>
                </div>

                {activeChapterTopics.length === 0 ? (
                  <div className="py-8 text-center text-gray-500 text-xs glass-card rounded-2xl">
                    No topics found for this chapter.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {activeChapterTopics.map((top, idx) => {
                      const isExpanded = expandedTopicId === top.id;
                      const hasSubtopics = Array.isArray(top.subtopics) && top.subtopics.length > 0;

                      return (
                        <div
                          key={top.id}
                          className={`rounded-2xl border transition-all overflow-hidden ${
                            isExpanded
                              ? 'bg-slate-900 border-blue-500/40'
                              : 'bg-slate-900/60 hover:bg-slate-800/40 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {/* Topic Main Bar (Clicking toggles the dropdown) */}
                          <div
                            onClick={() => {
                              setExpandedTopicId(isExpanded ? null : top.id);
                              setSelectedTopic(top);
                            }}
                            className="p-4 sm:p-5 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                          >
                            <div className="flex items-start gap-3.5 min-w-0">
                              <div
                                className={`w-8 h-8 rounded-xl font-mono text-xs font-bold flex items-center justify-center border shrink-0 mt-0.5 transition-colors ${
                                  isExpanded
                                    ? 'bg-indigo-600 text-white border-indigo-400'
                                    : 'bg-gray-900 group-hover:bg-indigo-600/30 text-gray-300 group-hover:text-indigo-300 border-gray-800 group-hover:border-indigo-500/30'
                                }`}
                              >
                                {idx + 1}
                              </div>
                              <div className="min-w-0 space-y-1">
                                <h4 className="text-sm sm:text-base font-bold text-gray-100 group-hover:text-indigo-300 transition-colors">
                                  {top.title}
                                </h4>
                                <p className="text-xs text-gray-400 line-clamp-1">{top.description}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                              {hasSubtopics && (
                                <span className="text-[11px] font-mono text-indigo-300 bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-500/30 flex items-center gap-1">
                                  <Layers className="w-3 h-3 text-indigo-400" />
                                  {top.subtopics!.length} Subtopics
                                </span>
                              )}
                              <span className="text-[11px] font-mono text-gray-300 flex items-center gap-1 bg-gray-900 px-2.5 py-1 rounded-lg border border-gray-800">
                                <Clock className="w-3 h-3 text-gray-400" /> {top.durationMins}m
                              </span>
                              <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-gray-800 text-gray-300 uppercase font-semibold">
                                {top.difficulty}
                              </span>
                              <div className="flex items-center gap-1 text-xs text-indigo-400 font-semibold pl-1">
                                <span className="hidden md:inline">{isExpanded ? 'Hide' : 'View Subtopics'}</span>
                                <ChevronDown
                                  className={`w-4 h-4 transition-transform duration-300 ${
                                    isExpanded ? 'rotate-180 text-indigo-300' : 'text-gray-400'
                                  }`}
                                />
                              </div>
                              <button
                                title={`Delete ${top.title}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteTarget({
                                    type: 'topic',
                                    id: top.id,
                                    name: top.title,
                                  });
                                }}
                                className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Dropdown Content with Comprehensive Topic Notes & Subtopics */}
                          {isExpanded && (
                            <div className="px-5 pb-5 pt-3 border-t border-gray-800/80 space-y-4 bg-gray-950/95 animate-fadeIn">
                              {/* Comprehensive Topic Notes & Concepts */}
                              {top.notesContent && (
                                <div className="p-4 sm:p-5 rounded-2xl bg-gray-900/60 border border-gray-800/80 space-y-3">
                                  <div className="flex items-center justify-between pb-2 border-b border-gray-800/70">
                                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                                      <BookOpen className="w-3.5 h-3.5" />
                                      Comprehensive Concepts & Explanations
                                    </span>
                                  </div>
                                  <div className="text-xs sm:text-sm text-gray-200 leading-relaxed">
                                    {renderNotesMarkdown(top.notesContent)}
                                  </div>
                                </div>
                              )}

                              {/* Detailed Subtopics Breakdown */}
                              {hasSubtopics && (
                                <div className="space-y-2.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                                      <Layers className="w-3.5 h-3.5" />
                                      Subtopics Breakdown ({top.subtopics!.length})
                                    </span>
                                  </div>
                                  <div className="space-y-2.5">
                                    {top.subtopics!.map((sub, sIdx) => {
                                      const subKey = `${top.id}_${sIdx}`;
                                      const isSubOpen = expandedSubtopicIdx[subKey] !== false; // open by default

                                      return (
                                        <div
                                          key={sIdx}
                                          className={`rounded-xl border transition-all overflow-hidden ${
                                            isSubOpen
                                              ? 'border-indigo-500/40 bg-gray-900/80 shadow-md'
                                              : 'border-gray-800/80 bg-gray-900/40 hover:bg-gray-900/60'
                                          }`}
                                        >
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setExpandedSubtopicIdx((prev) => ({
                                                ...prev,
                                                [subKey]: !isSubOpen,
                                              }));
                                            }}
                                            className="w-full p-3.5 text-left flex items-center justify-between gap-3 cursor-pointer"
                                          >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                              <span className="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center text-[11px] font-mono font-bold shrink-0">
                                                {sIdx + 1}
                                              </span>
                                              <span className="text-xs sm:text-sm font-semibold text-gray-200">
                                                {sub.title}
                                              </span>
                                            </div>
                                            <ChevronDown
                                              className={`w-4 h-4 text-indigo-400 transition-transform duration-200 shrink-0 ${
                                                isSubOpen ? 'rotate-180' : ''
                                              }`}
                                            />
                                          </button>

                                          {isSubOpen && (
                                            <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-gray-200 border-t border-gray-800/60 leading-relaxed bg-gray-950/70">
                                              {renderNotesMarkdown(sub.concept)}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Footer Action Buttons */}
                              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-800/60">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTopic(top);
                                    setActiveTab('notes');
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }}
                                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>Open In Full Notes View</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onAskAI(`Explain the concepts of ${top.title} from Chapter ${top.unitNumber} in detail.`);
                                  }}
                                  className="px-3.5 py-2 rounded-xl bg-blue-950/40 hover:bg-blue-900/40 text-blue-300 hover:text-white border border-blue-500/30 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                                >
                                  <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                                  Ask Tutor
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Notes Tab Content: Specific Topic Deep Notes & Theory (Diagrams removed) */}
      {activeTab === 'notes' && selectedTopic && (
        <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-gray-800 space-y-6 animate-fadeIn">
          {/* Top Breadcrumb & Back to Chapters Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-800">
            <button
              onClick={() => {
                setActiveTab('overview');
                setSelectedChapter(selectedTopic.unitNumber);
              }}
              className="text-xs font-semibold text-indigo-300 hover:text-white flex items-center gap-2 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/30 px-3.5 py-2 rounded-xl transition-all cursor-pointer self-start"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Chapter {selectedTopic.unitNumber} Topics
            </button>

            <div className="text-xs text-gray-400 flex items-center gap-2 flex-wrap">
              <span className="text-gray-300 hover:text-white cursor-pointer" onClick={() => setActiveTab('overview')}>
                {subject.name}
              </span>
              <span>/</span>
              {selectedTopic.documentName && (
                <>
                  <span className="text-indigo-400 font-medium">
                    {selectedTopic.documentName}
                  </span>
                  <span>/</span>
                </>
              )}
              <span className="text-indigo-300 font-semibold">
                Chapter {selectedTopic.unitNumber}
              </span>
              <span>/</span>
              <span className="text-gray-200 font-medium truncate max-w-xs">{selectedTopic.title}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-500/20 px-2.5 py-0.5 rounded-md border border-indigo-500/30">
                  Chapter {selectedTopic.unitNumber}
                </span>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {selectedTopic.durationMins} mins
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-800 text-gray-300 uppercase font-semibold">
                  {selectedTopic.difficulty}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-100">{selectedTopic.title}</h2>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">{selectedTopic.description}</p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
              <button
                onClick={() => onAskAI(`Explain ${selectedTopic.title} in detail with exam tips`)}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs border border-blue-400/30 flex items-center gap-2 transition-all cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                Ask Tutor About Topic
              </button>

              <button
                onClick={() =>
                  setDeleteTarget({
                    type: 'topic',
                    id: selectedTopic.id,
                    name: selectedTopic.title,
                  })
                }
                className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 hover:text-red-200 transition-colors cursor-pointer"
                title="Delete this topic"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </div>
          </div>

          {/* Subtopics Breakdown if available */}
          {selectedTopic.subtopics && selectedTopic.subtopics.length > 0 && (
            <div className="space-y-4 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                Subtopics & Core Concepts ({selectedTopic.subtopics.length})
              </span>
              <div className="grid grid-cols-1 gap-3.5">
                {selectedTopic.subtopics.map((sub, sIdx) => (
                  <div key={sIdx} className="p-5 rounded-2xl bg-gray-950/80 border border-gray-800 space-y-2">
                    <h3 className="text-base font-bold text-indigo-300 flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 flex items-center justify-center text-xs font-mono font-bold shrink-0">
                        {sIdx + 1}
                      </span>
                      {sub.title}
                    </h3>
                    <div className="text-sm text-gray-200 leading-relaxed pt-1">
                      {renderNotesMarkdown(sub.concept)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deep Concept Notes, Theory & Formulas */}
          <div className="space-y-4 pt-2">
            {renderNotesMarkdown(selectedTopic.notesContent)}
          </div>

          {/* Bottom Topic Navigation */}
          {(() => {
            const currentChapterTopics = chaptersMap[selectedTopic.unitNumber] || topics;
            const currentIdx = currentChapterTopics.findIndex((t) => t.id === selectedTopic.id);
            const prevTopic = currentIdx > 0 ? currentChapterTopics[currentIdx - 1] : null;
            const nextTopic =
              currentIdx >= 0 && currentIdx < currentChapterTopics.length - 1
                ? currentChapterTopics[currentIdx + 1]
                : null;

            return (
              <div className="pt-6 border-t border-gray-800 flex items-center justify-between gap-4">
                {prevTopic ? (
                  <button
                    onClick={() => {
                      setSelectedTopic(prevTopic);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-xs font-semibold text-gray-300 hover:text-white flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Previous: {prevTopic.title}</span>
                  </button>
                ) : (
                  <div />
                )}

                {nextTopic ? (
                  <button
                    onClick={() => {
                      setSelectedTopic(nextTopic);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center gap-2 cursor-pointer shadow-md transition-all ml-auto"
                  >
                    <span>Next: {nextTopic.title}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <div />
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Materials Tab Content */}
      {activeTab === 'materials' && (
        <div className="space-y-3">
          {materials.length > 0 ? (
            materials.map((m) => (
              <div key={m.id} className="p-4 rounded-xl glass-card flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-400" />
                  <div>
                    <div className="text-sm font-semibold text-gray-200">{m.title}</div>
                    <div className="text-xs text-gray-400">{m.description}</div>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('/app/materials')}
                  className="px-3.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold cursor-pointer"
                >
                  View Resource
                </button>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-gray-400">No specific resources found for this subject yet.</div>
          )}
        </div>
      )}

      {/* Upload PDF Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg p-6 rounded-3xl glass-panel bg-gray-950 border border-gray-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Add Chapters via PDF</h3>
                  <p className="text-xs text-gray-400">Append new Chapters & Topics to {subject.name}</p>
                </div>
              </div>

              {!isUploading && (
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-900 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {!isUploading ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleUploadPDF(e.dataTransfer.files[0]);
                  }
                }}
                className="p-8 rounded-2xl border-2 border-dashed border-gray-800 hover:border-indigo-500/60 bg-gray-900/40 hover:bg-gray-900/70 transition-all flex flex-col items-center justify-center text-center cursor-pointer space-y-3 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-bold text-gray-200">
                    Click to browse or drop your PDF here
                  </span>
                  <p className="text-xs text-gray-400">
                    Textbook chapter, lecture notes or course syllabus (Up to 30 MB)
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleUploadPDF(e.target.files[0]);
                    }
                  }}
                />
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-indigo-300 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                    {uploadStatus}
                  </span>
                  <span className="font-mono font-bold text-gray-300">{uploadProgress}%</span>
                </div>

                <div className="w-full h-2.5 rounded-full bg-gray-950 overflow-hidden border border-gray-800">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>

                <p className="text-[11px] text-gray-400 text-center">
                  Please keep this window open while StudySphere parses chapters and topics...
                </p>
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-gray-300 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>How it works:</strong> AI parses the PDF into Chapters and Topics, adding them directly to <strong>{subject.name}</strong>.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md p-6 rounded-3xl glass-panel bg-gray-950 border border-red-500/30 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white capitalize">
                  Delete {deleteTarget.type}?
                </h3>
                <p className="text-xs text-gray-400">
                  {deleteTarget.type === 'subject' && 'This will remove the subject and all its chapters.'}
                  {deleteTarget.type === 'document' && 'This will remove this PDF document and all its chapters and topics.'}
                  {deleteTarget.type === 'chapter' && 'This will remove this chapter and all topics inside it.'}
                  {deleteTarget.type === 'topic' && 'This will remove this topic from the course curriculum.'}
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-300 bg-gray-900/60 p-3.5 rounded-2xl border border-gray-800">
              Are you sure you want to delete <strong className="text-white">"{deleteTarget.name}"</strong>?
              This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold border border-red-400/40 cursor-pointer transition-colors capitalize"
              >
                Yes, Delete {deleteTarget.type}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
