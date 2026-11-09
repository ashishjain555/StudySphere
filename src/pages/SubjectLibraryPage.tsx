import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Network,
  Database,
  Wifi,
  Cpu,
  Compass,
  Globe,
  Layers,
  Loader2,
  ChevronRight,
  UploadCloud,
  X,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  LayoutGrid,
  List,
  FileText,
  Target,
  Sparkles,
  AlertTriangle,
  Brain,
  Clock,
  ArrowRight,
} from 'lucide-react';
import {
  DataStore,
  formatFileSize,
  formatChapterLabel,
} from '../lib/dataStore';
import { Subject, Topic, WeakTopic, StudyMaterial, QuizAttempt } from '../types';
import { TiltCard3D } from '../components/3d/TiltCard3D';

interface SubjectLibraryPageProps {
  onNavigate: (path: string) => void;
}

export const SubjectLibraryPage: React.FC<SubjectLibraryPageProps> = ({ onNavigate }) => {
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const s = DataStore.getSubjects();
    return Array.isArray(s) ? s : [];
  });
  const [allTopics, setAllTopics] = useState<Topic[]>(() => {
    const t = DataStore.getTopics();
    return Array.isArray(t) ? t : [];
  });
  const [allMaterials, setAllMaterials] = useState<StudyMaterial[]>(() => {
    const m = DataStore.getMaterials();
    return Array.isArray(m) ? m : [];
  });
  const [allQuizzes, setAllQuizzes] = useState<QuizAttempt[]>(() => {
    const q = DataStore.getQuizAttempts();
    return Array.isArray(q) ? q : [];
  });
  const [allWeakTopics, setAllWeakTopics] = useState<WeakTopic[]>(() => {
    const w = DataStore.getWeakTopics();
    return Array.isArray(w) ? w : [];
  });

  // Search, Filter, Sort & View states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'in_progress' | 'needs_review' | 'with_docs'>('all');
  const [sortBy, setSortBy] = useState<'default' | 'progress_desc' | 'chapters_desc' | 'name_asc'>('default');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Custom subject modal fields
  const [customName, setCustomName] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customUnits, setCustomUnits] = useState(4);
  const [customColor, setCustomColor] = useState('from-indigo-500 to-violet-600');
  const [customIcon, setCustomIcon] = useState('BookOpen');

  // Synchronize state when store updates
  useEffect(() => {
    const handleUpdate = () => {
      const s = DataStore.getSubjects();
      setSubjects(Array.isArray(s) ? s : []);
      const t = DataStore.getTopics();
      setAllTopics(Array.isArray(t) ? t : []);
      const m = DataStore.getMaterials();
      setAllMaterials(Array.isArray(m) ? m : []);
      const q = DataStore.getQuizAttempts();
      setAllQuizzes(Array.isArray(q) ? q : []);
      const w = DataStore.getWeakTopics();
      setAllWeakTopics(Array.isArray(w) ? w : []);
    };
    window.addEventListener('studysphere:materials_update', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('studysphere:materials_update', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const safeSubjects = Array.isArray(subjects) ? subjects : [];
  const safeTopics = Array.isArray(allTopics) ? allTopics : [];
  const safeMaterials = Array.isArray(allMaterials) ? allMaterials : [];
  const safeWeakTopics = Array.isArray(allWeakTopics) ? allWeakTopics : [];

  // Real Aggregated Metrics computed directly from DataStore
  const totalChapters = useMemo(() => {
    return safeSubjects.reduce((sum, s) => {
      const sTopics = safeTopics.filter((t) => t && t.subjectId === s.id);
      const uniqueUnits = new Set(sTopics.map((t) => `${t.documentId || 'core'}_${t.unitNumber}`)).size;
      return sum + (uniqueUnits || s.unitsCount || 1);
    }, 0);
  }, [safeSubjects, safeTopics]);

  const totalTopicsCount = useMemo(() => {
    return safeSubjects.reduce((sum, s) => {
      const count = safeTopics.filter((t) => t && t.subjectId === s.id).length;
      return sum + (count || s.topicCount || 0);
    }, 0);
  }, [safeSubjects, safeTopics]);

  const totalDocsCount = useMemo(() => {
    const directDocs = safeSubjects.reduce((sum, s) => sum + (s.documents?.length || 0), 0);
    return directDocs + safeMaterials.length;
  }, [safeSubjects, safeMaterials]);

  const averageProgress = useMemo(() => {
    if (safeSubjects.length === 0) return 0;
    const total = safeSubjects.reduce((sum, s) => sum + (s.progressPercentage || 0), 0);
    return Math.round(total / safeSubjects.length);
  }, [safeSubjects]);

  const confirmDeleteSubject = () => {
    if (!subjectToDelete) return;
    DataStore.deleteSubject(subjectToDelete.id);
    setSubjects(DataStore.getSubjects());
    setAllTopics(DataStore.getTopics());
    setAllMaterials(DataStore.getMaterials());
    setSubjectToDelete(null);
  };

  const handleCreateCustomSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newSubjId = `subj_${Date.now()}`;
    const code = customCode.trim() || `SUBJ-${Math.floor(100 + Math.random() * 900)}`;
    const units = Math.max(1, Math.min(10, Number(customUnits) || 4));

    const newSubject: Subject = {
      id: newSubjId,
      name: customName.trim(),
      code: code.toUpperCase(),
      description: customDesc.trim() || `Course curriculum for ${customName.trim()}.`,
      icon: customIcon || 'BookOpen',
      progressPercentage: 0,
      topicCount: units * 3,
      unitsCount: units,
      color: customColor || 'from-indigo-500 to-violet-600',
    };

    // Auto-generate starter chapters & topics for each unit
    const newTopics: Topic[] = [];
    for (let u = 1; u <= units; u++) {
      for (let t = 1; t <= 3; t++) {
        newTopics.push({
          id: `top_${newSubjId}_u${u}_${t}`,
          subjectId: newSubjId,
          unitNumber: u,
          unitName: `Chapter ${u}: Core Fundamentals`,
          title: `Topic ${u}.${t}: Key Principles & Analysis`,
          description: `Detailed study outline and exam notes for Chapter ${u}, Module ${t}.`,
          notesContent: `### Study Notes for Chapter ${u} - Topic ${t}\n- **Core Concept**: Theoretical principles, derivation, and real-world application.\n- **Key Formulae**: Understand and memorize fundamental definitions.\n- **Exam Tips**: Review previous semester questions for this section.`,
          durationMins: 45,
          difficulty: t === 1 ? 'easy' : t === 2 ? 'medium' : 'hard',
          questionsCount: 5,
        });
      }
    }

    DataStore.addSubject(newSubject);
    DataStore.addTopics(newTopics);
    setSubjects(DataStore.getSubjects());
    setAllTopics(DataStore.getTopics());

    // Reset and close
    setCustomName('');
    setCustomCode('');
    setCustomDesc('');
    setShowAddCustomModal(false);
    onNavigate(`/app/subjects/${newSubject.id}`);
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Network': return Network;
      case 'Database': return Database;
      case 'Wifi': return Wifi;
      case 'Cpu': return Cpu;
      case 'Bot': return Compass;
      case 'Globe': return Globe;
      default: return Layers;
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleUploadPDF = async (file: File) => {
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
      setUploadStatus('AI analyzing syllabus: generating Chapters & Topics...');

      const res = await fetch('/api/ai/parse-subject-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfBase64: base64Data,
          filename: file.name,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to parse subject from PDF.');
      }

      setUploadProgress(80);
      setUploadStatus('Structuring Chapters and Topics notes...');
      const data = await res.json();

      const newSubjId = `subj_${Date.now()}`;
      const docId = `doc_${Date.now()}`;
      const unitsCount = Array.isArray(data.units) ? data.units.length : 3;
      let totalTopicCount = 0;

      const fileChapterMatch = file.name.match(/(?:chp|chapter|unit|ch)[\s_-]*(\d+)/i);
      const fileChapterNum = fileChapterMatch ? parseInt(fileChapterMatch[1], 10) : null;

      const newTopics: Topic[] = [];
      if (Array.isArray(data.units)) {
        data.units.forEach((unit: any, uIdx: number) => {
          const uNum = unit.unitNumber || fileChapterNum || (uIdx + 1);
          const uName = formatChapterLabel(unit.unitName, uNum);
          if (Array.isArray(unit.topics)) {
            unit.topics.forEach((t: any, tIdx: number) => {
              totalTopicCount++;
              newTopics.push({
                id: `top_${Date.now()}_${uNum}_${tIdx}`,
                subjectId: newSubjId,
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

      const newSubject: Subject = {
        id: newSubjId,
        name: data.subjectName || file.name.replace(/\.pdf$/i, ''),
        code: data.subjectCode || 'CS-NEW',
        description: data.subjectDescription || `Course units and detailed topic notes extracted from ${file.name}.`,
        icon: data.icon || 'Layers',
        progressPercentage: 0,
        topicCount: totalTopicCount || 8,
        unitsCount: unitsCount || 3,
        color: data.color || 'from-blue-600 to-indigo-600',
        documents: [
          {
            id: docId,
            subjectId: newSubjId,
            name: file.name,
            uploadedAt: new Date().toISOString(),
            chaptersCount: unitsCount,
            topicCount: totalTopicCount,
            fileSize: formatFileSize(file.size),
          },
        ],
      };

      DataStore.addSubject(newSubject);
      if (newTopics.length > 0) {
        DataStore.addTopics(newTopics);
      }

      setSubjects(DataStore.getSubjects());
      setAllTopics(DataStore.getTopics());
      setUploadProgress(100);
      setUploadStatus('Subject created successfully! Opening...');

      setTimeout(() => {
        setIsUploading(false);
        setShowUploadModal(false);
        onNavigate(`/app/subjects/${newSubject.id}`);
      }, 700);
    } catch (err: any) {
      console.error('Failed to create subject from PDF:', err);
      setErrorMessage(err.message || 'Failed to parse subject from PDF. Please try again.');
      setIsUploading(false);
    }
  };

  // Filter & Sort Logic
  const filteredSubjects = useMemo(() => {
    let result = [...subjects];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q) ||
          (s.description && s.description.toLowerCase().includes(q))
      );
    }

    // Filter tab
    if (filterTab === 'in_progress') {
      result = result.filter((s) => s.progressPercentage > 0 && s.progressPercentage < 100);
    } else if (filterTab === 'needs_review') {
      result = result.filter((s) => allWeakTopics.some((wt) => wt.subjectId === s.id));
    } else if (filterTab === 'with_docs') {
      result = result.filter(
        (s) =>
          (s.documents && s.documents.length > 0) ||
          allMaterials.some((m) => m.subjectId === s.id)
      );
    }

    // Sorting
    if (sortBy === 'progress_desc') {
      result.sort((a, b) => b.progressPercentage - a.progressPercentage);
    } else if (sortBy === 'chapters_desc') {
      result.sort((a, b) => (b.unitsCount || 1) - (a.unitsCount || 1));
    } else if (sortBy === 'name_asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [subjects, searchQuery, filterTab, sortBy, allWeakTopics, allMaterials]);

  // Counts for filter pills
  const inProgressCount = useMemo(
    () => subjects.filter((s) => s.progressPercentage > 0 && s.progressPercentage < 100).length,
    [subjects]
  );
  const needsReviewCount = useMemo(
    () => subjects.filter((s) => allWeakTopics.some((wt) => wt.subjectId === s.id)).length,
    [subjects, allWeakTopics]
  );
  const withDocsCount = useMemo(
    () =>
      subjects.filter(
        (s) => (s.documents && s.documents.length > 0) || allMaterials.some((m) => m.subjectId === s.id)
      ).length,
    [subjects, allMaterials]
  );

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <span>My Subjects & Curriculum</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Browse course chapters, structured revision notes, question banks, and progress analytics.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
          <button
            onClick={() => setShowAddCustomModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-2 border border-indigo-400/30 transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4 text-indigo-200" />
            <span>Add Course</span>
          </button>
          <button
            onClick={() => {
              setErrorMessage('');
              setShowUploadModal(true);
            }}
            className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-2 border border-blue-400/30 transition-all cursor-pointer shadow-sm"
          >
            <UploadCloud className="w-4 h-4 text-blue-200" />
            <span>Import Syllabus PDF</span>
          </button>
        </div>
      </div>

      {/* Real Aggregate Metrics Strip (All backed by DataStore state) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl glass-card border border-slate-800 bg-slate-900/60 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-white font-mono">{subjects.length}</div>
            <div className="text-xs text-slate-400">Enrolled Courses</div>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl glass-card border border-slate-800 bg-slate-900/60 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-white font-mono">{totalChapters}</div>
            <div className="text-xs text-slate-400">Syllabus Chapters</div>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl glass-card border border-slate-800 bg-slate-900/60 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-white font-mono">{totalTopicsCount}</div>
            <div className="text-xs text-slate-400">Curriculum Topics</div>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl glass-card border border-slate-800 bg-slate-900/60 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-white font-mono">{averageProgress}%</div>
            <div className="text-xs text-slate-400">Average Progress</div>
          </div>
        </div>
      </div>

      {/* Search, Filter Tabs & View Controls */}
      <div className="p-4 rounded-2xl glass-panel border border-slate-800 bg-slate-900/50 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by course name, code (e.g. CS-201)..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500/60 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort & View Mode Controls */}
          <div className="flex items-center gap-2.5 self-end md:self-auto">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="default" className="bg-slate-900 text-slate-200">Sort: Default</option>
                <option value="progress_desc" className="bg-slate-900 text-slate-200">Progress: High to Low</option>
                <option value="chapters_desc" className="bg-slate-900 text-slate-200">Most Chapters</option>
                <option value="name_asc" className="bg-slate-900 text-slate-200">Course Code (A-Z)</option>
              </select>
            </div>

            {/* Grid / List View Toggle */}
            <div className="flex items-center p-1 rounded-xl bg-slate-950/80 border border-slate-800">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              filterTab === 'all'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/35'
                : 'bg-slate-950/50 text-slate-400 border border-slate-800 hover:border-slate-700'
            }`}
          >
            All Courses ({subjects.length})
          </button>

          <button
            onClick={() => setFilterTab('in_progress')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              filterTab === 'in_progress'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/35'
                : 'bg-slate-950/50 text-slate-400 border border-slate-800 hover:border-slate-700'
            }`}
          >
            In Progress ({inProgressCount})
          </button>

          <button
            onClick={() => setFilterTab('needs_review')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              filterTab === 'needs_review'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/35'
                : 'bg-slate-950/50 text-slate-400 border border-slate-800 hover:border-slate-700'
            }`}
          >
            Needs Review ({needsReviewCount})
          </button>

          <button
            onClick={() => setFilterTab('with_docs')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              filterTab === 'with_docs'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/35'
                : 'bg-slate-950/50 text-slate-400 border border-slate-800 hover:border-slate-700'
            }`}
          >
            With Syllabus PDFs ({withDocsCount})
          </button>
        </div>
      </div>

      {/* Grid of Subject Cards or Empty State */}
      {subjects.length === 0 ? (
        <div className="p-12 text-center rounded-3xl glass-card border border-slate-800 bg-slate-900/40 space-y-5 max-w-2xl mx-auto my-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/25 text-blue-400 flex items-center justify-center mx-auto">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">No Subjects Enrolled Yet</h2>
            <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
              Your curriculum workspace is empty. Add your academic courses manually or upload your semester syllabus PDF to auto-generate chapters and notes.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setShowAddCustomModal(true)}
              className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs border border-indigo-400/30 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4 text-indigo-200" />
              Add Course Manually
            </button>
            <button
              onClick={() => {
                setErrorMessage('');
                setShowUploadModal(true);
              }}
              className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs border border-blue-400/30 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <UploadCloud className="w-4 h-4 text-blue-200" />
              Upload Syllabus PDF
            </button>
          </div>
        </div>
      ) : filteredSubjects.length === 0 ? (
        <div className="p-8 text-center rounded-2xl glass-card border border-slate-800 bg-slate-900/40 space-y-3">
          <p className="text-xs sm:text-sm text-slate-400">
            No courses match the current search or filter criteria.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterTab('all');
            }}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubjects.map((subj) => {
            const IconComp = getIcon(subj.icon);

            // Compute subject-specific real numbers
            const sTopics = allTopics.filter((t) => t.subjectId === subj.id);
            const computedChapters = new Set(sTopics.map((t) => `${t.documentId || 'core'}_${t.unitNumber}`)).size || subj.unitsCount || 1;
            const computedTopics = sTopics.length || subj.topicCount || 0;
            const subjDocsCount = (subj.documents?.length || 0) + allMaterials.filter((m) => m.subjectId === subj.id).length;
            const subjWeak = allWeakTopics.filter((wt) => wt.subjectId === subj.id);
            const subjQuizzes = allQuizzes.filter((q) => q.subjectId === subj.id);
            const avgQuizScore =
              subjQuizzes.length > 0
                ? Math.round(subjQuizzes.reduce((sum, q) => sum + (q.percentage || 0), 0) / subjQuizzes.length)
                : null;

            return (
              <TiltCard3D key={subj.id} maxTilt={5}>
                <div
                  onClick={() => onNavigate(`/app/subjects/${subj.id}`)}
                  className="p-6 rounded-3xl glass-card border border-slate-800 hover:border-blue-500/50 cursor-pointer transition-all space-y-4 flex flex-col justify-between group bg-slate-950/60 h-full relative"
                >
                  <div>
                    {/* Top Row: Icon + Code + Actions */}
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${subj.color} flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform`}>
                        <IconComp className="w-6 h-6" />
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/25">
                          {subj.code}
                        </span>
                        <button
                          title={`Delete ${subj.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSubjectToDelete(subj);
                          }}
                          className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Course Title & Summary */}
                    <h2 className="text-lg font-bold text-slate-100 group-hover:text-blue-300 transition-colors line-clamp-1">
                      {subj.name}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                      {subj.description}
                    </p>

                    {/* Diagnostic Badge if weak topics exist */}
                    {subjWeak.length > 0 && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate('/app/weak-topics');
                        }}
                        className="mt-3 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[11px] font-medium flex items-center gap-1.5 hover:bg-amber-500/20 transition-colors"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{subjWeak.length} Weak Topic{subjWeak.length > 1 ? 's' : ''} detected</span>
                      </div>
                    )}
                  </div>

                  {/* Metadata Chips Grid */}
                  <div className="space-y-3 pt-3 border-t border-slate-800/80">
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        <span>{computedChapters} Chapters</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>{computedTopics} Topics</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <UploadCloud className="w-3.5 h-3.5 text-slate-400" />
                        <span>{subjDocsCount} Materials</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-slate-400" />
                        <span>{avgQuizScore !== null ? `${avgQuizScore}% Avg Quiz` : 'No quizzes'}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 text-[11px]">Syllabus Coverage</span>
                        <span className="font-bold text-blue-400 font-mono">{subj.progressPercentage}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all"
                          style={{ width: `${Math.max(5, subj.progressPercentage)}%` }}
                        />
                      </div>
                    </div>

                    {/* Action Links */}
                    <div className="pt-2 flex items-center justify-between text-xs">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate(`/app/quiz`);
                        }}
                        className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
                      >
                        <Target className="w-3 h-3 text-amber-400" />
                        <span>Quiz Practice</span>
                      </button>

                      <div className="font-semibold text-blue-400 group-hover:text-blue-300 flex items-center gap-1">
                        <span>Open Course</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              </TiltCard3D>
            );
          })}
        </div>
      ) : (
        /* Detailed List View */
        <div className="rounded-2xl glass-panel border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-mono text-[10px]">
                <tr>
                  <th className="py-3 px-4">Course & Code</th>
                  <th className="py-3 px-4">Chapters</th>
                  <th className="py-3 px-4">Topics</th>
                  <th className="py-3 px-4">Materials</th>
                  <th className="py-3 px-4">Diagnostics</th>
                  <th className="py-3 px-4">Progress</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-200">
                {filteredSubjects.map((subj) => {
                  const sTopics = allTopics.filter((t) => t.subjectId === subj.id);
                  const computedChapters = new Set(sTopics.map((t) => `${t.documentId || 'core'}_${t.unitNumber}`)).size || subj.unitsCount || 1;
                  const computedTopics = sTopics.length || subj.topicCount || 0;
                  const subjDocsCount = (subj.documents?.length || 0) + allMaterials.filter((m) => m.subjectId === subj.id).length;
                  const subjWeak = allWeakTopics.filter((wt) => wt.subjectId === subj.id);

                  return (
                    <tr
                      key={subj.id}
                      onClick={() => onNavigate(`/app/subjects/${subj.id}`)}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-100 group-hover:text-blue-300 transition-colors">
                          {subj.name}
                        </div>
                        <div className="font-mono text-[10px] text-blue-400 mt-0.5">{subj.code}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono">{computedChapters} Chapters</td>
                      <td className="py-3.5 px-4 font-mono">{computedTopics} Topics</td>
                      <td className="py-3.5 px-4 font-mono">{subjDocsCount} Files</td>
                      <td className="py-3.5 px-4">
                        {subjWeak.length > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 text-[10px] border border-amber-500/25">
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                            {subjWeak.length} Needs Review
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">All clear</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${subj.progressPercentage}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] text-slate-300">{subj.progressPercentage}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigate(`/app/subjects/${subj.id}`);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 text-[11px] font-medium border border-blue-500/30 transition-colors"
                          >
                            Open
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSubjectToDelete(subj);
                            }}
                            className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload PDF Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg p-6 rounded-3xl glass-panel bg-slate-950 border border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/25">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Import Course from Syllabus PDF</h3>
                  <p className="text-xs text-slate-400">AI auto-extracts Chapters, Topics, and Study Notes</p>
                </div>
              </div>

              {!isUploading && (
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
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
                className="p-8 rounded-2xl border-2 border-dashed border-slate-800 hover:border-blue-500/60 bg-slate-900/40 hover:bg-slate-900/70 transition-all flex flex-col items-center justify-center text-center cursor-pointer space-y-3 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform border border-blue-500/20">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-bold text-slate-200">
                    Click to browse or drop your Syllabus PDF here
                  </span>
                  <p className="text-xs text-slate-400">
                    Textbook, curriculum handout, course outline, or slides (Up to 30 MB)
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
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-blue-300 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    {uploadStatus}
                  </span>
                  <span className="font-mono font-bold text-slate-300">{uploadProgress}%</span>
                </div>

                <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>

                <p className="text-[11px] text-slate-400 text-center">
                  Processing syllabus structure and generating curriculum modules...
                </p>
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-slate-300 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Curriculum Parser:</strong> AI analyzes table of contents and headings to generate Chapters, detailed Topic notes, and revision hints automatically.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Subject Modal */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg p-6 rounded-3xl glass-panel bg-slate-950 border border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Add New Subject</h3>
                  <p className="text-xs text-slate-400">Create a course curriculum with chapter modules.</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddCustomModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Subject Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Operating Systems, Calculus, Microprocessors"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none placeholder-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Course Code (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CS-401, MATH-202"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none placeholder-slate-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Chapters / Units
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={customUnits}
                    onChange={(e) => setCustomUnits(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Summary of course syllabus, objectives, and prerequisites..."
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none placeholder-slate-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Color Theme</label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { label: 'Indigo', val: 'from-indigo-500 to-violet-600' },
                    { label: 'Blue', val: 'from-blue-500 to-cyan-600' },
                    { label: 'Emerald', val: 'from-emerald-500 to-teal-600' },
                    { label: 'Amber', val: 'from-amber-500 to-orange-600' },
                    { label: 'Rose', val: 'from-rose-500 to-pink-600' },
                  ].map((c) => (
                    <button
                      type="button"
                      key={c.val}
                      onClick={() => setCustomColor(c.val)}
                      className={`h-8 rounded-xl bg-gradient-to-r ${c.val} border transition-all cursor-pointer ${
                        customColor === c.val ? 'border-white scale-105 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddCustomModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold border border-indigo-400/30 cursor-pointer shadow-sm transition-all"
                >
                  Create Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Subject Confirmation Modal */}
      {subjectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md p-6 rounded-3xl glass-panel bg-slate-950 border border-rose-500/30 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Subject</h3>
                <p className="text-xs text-slate-400">Permanent removal of curriculum and notes.</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800 leading-relaxed">
              Are you sure you want to delete <strong className="text-white">"{subjectToDelete.name}"</strong>? All chapters, topics, study notes, and attached documents under this course will be permanently removed.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSubjectToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteSubject}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold border border-rose-400/30 cursor-pointer transition-colors"
              >
                Yes, Delete Subject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
