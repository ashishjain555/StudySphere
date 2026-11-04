import React, { useState, useRef } from 'react';
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
} from 'lucide-react';
import {
  DataStore,
  formatFileSize,
  formatChapterLabel,
} from '../lib/dataStore';
import { Subject, Topic } from '../types';

interface SubjectLibraryPageProps {
  onNavigate: (path: string) => void;
}

export const SubjectLibraryPage: React.FC<SubjectLibraryPageProps> = ({ onNavigate }) => {
  const [subjects, setSubjects] = useState<Subject[]>(() => DataStore.getSubjects());
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

  const confirmDeleteSubject = () => {
    if (!subjectToDelete) return;
    DataStore.deleteSubject(subjectToDelete.id);
    setSubjects(DataStore.getSubjects());
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
      setUploadStatus('AI analyzing document: generating Subject, Chapters & Topics...');

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
      setUploadProgress(100);
      setUploadStatus('Subject created successfully! Redirecting...');

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

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-blue-500 dark:text-blue-400" />
            Subject Library
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Browse curriculum chapters, topic notes, question banks, and practice modules.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => setShowAddCustomModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-2 border border-indigo-400/30 transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4 text-indigo-200" />
            Add Subject
          </button>
          <button
            onClick={() => {
              setErrorMessage('');
              setShowUploadModal(true);
            }}
            className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-2 border border-blue-400/30 transition-all cursor-pointer shadow-sm"
          >
            <UploadCloud className="w-4 h-4 text-blue-200" />
            Create from PDF
          </button>
        </div>
      </div>

      {/* Grid of Subject Cards or Empty State */}
      {subjects.length === 0 ? (
        <div className="p-12 text-center rounded-3xl glass-card border border-gray-800 bg-gray-900/40 space-y-5 max-w-2xl mx-auto my-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">No Subjects Added Yet</h2>
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              Your personalized curriculum is fresh and clean. Add your course subjects manually or upload your syllabus PDF.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setShowAddCustomModal(true)}
              className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs border border-indigo-400/30 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4 text-indigo-200" />
              Add Subject Manually
            </button>
            <button
              onClick={() => {
                setErrorMessage('');
                setShowUploadModal(true);
              }}
              className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs border border-blue-400/30 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <UploadCloud className="w-4 h-4 text-blue-200" />
              Create from Syllabus PDF
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subj) => {
            const IconComp = getIcon(subj.icon);
            return (
              <div
                key={subj.id}
                onClick={() => onNavigate(`/app/subjects/${subj.id}`)}
                className="p-6 rounded-3xl glass-card border border-gray-800 hover:border-blue-500/50 cursor-pointer transition-all space-y-4 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${subj.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                      <IconComp className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/20 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-500/30">
                        {subj.code}
                      </span>
                      <button
                        title={`Delete ${subj.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSubjectToDelete(subj);
                        }}
                        className="p-1.5 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h2 className="text-xl font-bold text-gray-100 group-hover:text-blue-500 dark:group-hover:text-blue-300 transition-colors">
                    {subj.name}
                  </h2>
                  <p className="text-xs text-gray-400 mt-2 line-clamp-2">{subj.description}</p>
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-800/80">
                  <div className="flex items-center justify-between text-xs text-gray-300 font-medium">
                    <span>{subj.unitsCount} Chapters • {subj.topicCount} Topics</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{subj.progressPercentage}%</span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-blue-500 rounded-full transition-all"
                      style={{ width: `${subj.progressPercentage}%` }}
                    />
                  </div>

                  <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 flex items-center justify-end gap-1 pt-1">
                    Open Subject <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
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
                  <h3 className="text-base font-bold text-white">Create Subject from PDF</h3>
                  <p className="text-xs text-gray-400">Auto-structures Chapters, Topics, and Notes</p>
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
                className="p-8 rounded-2xl border-2 border-dashed border-gray-800 hover:border-blue-500/60 bg-gray-900/40 hover:bg-gray-900/70 transition-all flex flex-col items-center justify-center text-center cursor-pointer space-y-3 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-bold text-gray-200">
                    Click to browse or drop your PDF here
                  </span>
                  <p className="text-xs text-gray-400">
                    Syllabus, textbook, lecture slides or notes (Up to 30 MB)
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
                  <span className="font-semibold text-blue-600 dark:text-blue-300 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    {uploadStatus}
                  </span>
                  <span className="font-mono font-bold text-gray-300">{uploadProgress}%</span>
                </div>

                <div className="w-full h-2.5 rounded-full bg-gray-950 overflow-hidden border border-gray-800">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>

                <p className="text-[11px] text-gray-400 text-center">
                  Please keep this window open while StudySphere analyzes your syllabus...
                </p>
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-500/20 text-xs text-gray-600 dark:text-gray-300 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                <strong>How it works:</strong> AI parses the PDF, detects the Subject Name, extracts Chapters, and creates Topic notes with real working mechanics and exam facts.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Subject Modal */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg p-6 rounded-3xl glass-panel bg-gray-950 border border-gray-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Add New Subject</h3>
                  <p className="text-xs text-gray-400">Create your custom course and generate chapter modules.</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddCustomModal(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Subject Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Systems, Calculus, Microprocessors"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-white text-sm focus:border-indigo-500 focus:outline-none placeholder-gray-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Course Code (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CS-401, MATH-202"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-white text-sm focus:border-indigo-500 focus:outline-none placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Chapters / Units
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={customUnits}
                    onChange={(e) => setCustomUnits(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of the course topics, concepts, and syllabus..."
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-gray-900 border border-gray-800 text-white text-xs focus:border-indigo-500 focus:outline-none placeholder-gray-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-2">Color Theme</label>
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

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowAddCustomModal(false)}
                  className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 text-xs font-medium cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold border border-indigo-400/30 cursor-pointer shadow-sm transition-all"
                >
                  Create Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Subject Confirmation Modal */}
      {subjectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md p-6 rounded-3xl glass-panel bg-gray-950 border border-red-500/30 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Subject</h3>
                <p className="text-xs text-gray-400">This will remove the subject and all its chapters.</p>
              </div>
            </div>

            <p className="text-sm text-gray-300 bg-gray-900/60 p-3.5 rounded-2xl border border-gray-800">
              Are you sure you want to delete <strong className="text-white">"{subjectToDelete.name}"</strong>? All chapters, topics, and study notes under this subject will be permanently removed.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSubjectToDelete(null)}
                className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteSubject}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold border border-red-400/30 cursor-pointer transition-colors"
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
