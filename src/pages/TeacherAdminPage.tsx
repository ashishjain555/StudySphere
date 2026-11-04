import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Plus,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  BookOpen,
  FileText,
  Search,
  Download,
  ExternalLink,
  Layers,
  FileCheck,
  FileCode,
  X,
  Loader2,
  Tag,
} from 'lucide-react';
import { DataStore } from '../lib/dataStore';
import { PDFStorage, dataURLtoBlob, createDefaultPdfDataUrl } from '../lib/pdfStorage';
import { StudyMaterial, Subject, MaterialFileType } from '../types';
import { useAuth } from '../context/AuthContext';

export const TeacherAdminPage: React.FC = () => {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<StudyMaterial[]>(() => DataStore.getMaterials());
  const [subjects] = useState<Subject[]>(() => DataStore.getSubjects());
  const [blobUrlMap, setBlobUrlMap] = useState<Record<string, string>>({});
  const [materialToDelete, setMaterialToDelete] = useState<StudyMaterial | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      setMaterials(DataStore.getMaterials());
    };
    window.addEventListener('studysphere:materials_update', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('studysphere:materials_update', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || 'subj_cs');
  const [customSubjectName, setCustomSubjectName] = useState('');
  const [fileType, setFileType] = useState<MaterialFileType>('pdf');
  const [isPublished, setIsPublished] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Prefetch blobs on mount for instant PDF opening
  useEffect(() => {
    let isMounted = true;

    const prefetchBlobs = async () => {
      const newMap: Record<string, string> = {};
      for (const mat of materials) {
        try {
          const stored = await PDFStorage.getPDF(mat.id);
          if (stored && stored.dataUrl) {
            const blob = dataURLtoBlob(stored.dataUrl);
            newMap[mat.id] = URL.createObjectURL(blob);
            continue;
          }
          if (mat.fileUrl && mat.fileUrl.startsWith('data:')) {
            const blob = dataURLtoBlob(mat.fileUrl);
            newMap[mat.id] = URL.createObjectURL(blob);
            continue;
          }
          if (mat.fileUrl && mat.fileUrl.startsWith('http')) {
            newMap[mat.id] = mat.fileUrl;
          }
        } catch (e) {
          console.warn('Error prefetching PDF for material:', mat.id, e);
        }
      }

      if (isMounted && Object.keys(newMap).length > 0) {
        setBlobUrlMap((prev) => ({ ...prev, ...newMap }));
      }
    };

    prefetchBlobs();

    return () => {
      isMounted = false;
    };
  }, [materials]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!title) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setTitle(cleanName);
      }
    }
  };

  const getSubjectName = (mat: StudyMaterial): string => {
    if (mat.subjectName) return mat.subjectName;
    const found = subjects.find((s) => s.id === mat.subjectId);
    return found ? found.name : 'General Studies';
  };

  const handleTogglePublish = (matId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = materials.map((m) =>
      m.id === matId ? { ...m, isPublished: !m.isPublished } : m
    );
    setMaterials(updated);
    DataStore.saveMaterials(updated);
  };

  const confirmDeleteMaterial = () => {
    if (!materialToDelete) return;
    const matId = materialToDelete.id;
    DataStore.deleteMaterial(matId);
    setMaterials(DataStore.getMaterials());
    setMaterialToDelete(null);
  };

  const resolveMaterialUrl = async (mat: StudyMaterial): Promise<string | null> => {
    if (blobUrlMap[mat.id]) return blobUrlMap[mat.id];

    try {
      const stored = await PDFStorage.getPDF(mat.id);
      if (stored && stored.dataUrl) {
        const blob = dataURLtoBlob(stored.dataUrl);
        const url = URL.createObjectURL(blob);
        setBlobUrlMap((prev) => ({ ...prev, [mat.id]: url }));
        return url;
      }
    } catch (e) {
      console.warn('Error reading from storage:', e);
    }

    if (mat.fileUrl && mat.fileUrl.startsWith('data:')) {
      const blob = dataURLtoBlob(mat.fileUrl);
      const url = URL.createObjectURL(blob);
      setBlobUrlMap((prev) => ({ ...prev, [mat.id]: url }));
      return url;
    }

    if (mat.fileUrl && mat.fileUrl.startsWith('http')) {
      return mat.fileUrl;
    }

    // Fallback: Generate real PDF with title & subject
    const fallbackDataUrl = createDefaultPdfDataUrl(mat.title, getSubjectName(mat));
    const fallbackBlob = dataURLtoBlob(fallbackDataUrl);
    const fallbackUrl = URL.createObjectURL(fallbackBlob);
    setBlobUrlMap((prev) => ({ ...prev, [mat.id]: fallbackUrl }));
    return fallbackUrl;
  };

  const handleOpenPdf = async (mat: StudyMaterial, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const url = await resolveMaterialUrl(mat);
      if (url) {
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Error opening PDF:', err);
    }
  };

  const handleDownload = async (mat: StudyMaterial, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const url = await resolveMaterialUrl(mat);
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.download = `${mat.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedFile) return;

    setIsUploading(true);
    const newId = `mat_teacher_${Date.now()}`;

    try {
      // 1. Create immediate Blob URL
      const directBlobUrl = URL.createObjectURL(selectedFile);
      setBlobUrlMap((prev) => ({ ...prev, [newId]: directBlobUrl }));

      // 2. Read Base64 Data URL
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      // 3. Save into IndexedDB PDFStorage
      await PDFStorage.savePDF({
        id: newId,
        name: selectedFile.name,
        dataUrl: base64Data,
        mimeType: selectedFile.type || 'application/pdf',
        size: selectedFile.size,
        uploadedAt: new Date().toISOString(),
      });

      const effectiveSubjectId = customSubjectName.trim()
        ? `subj_${customSubjectName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
        : subjectId;

      const effectiveSubjectName = customSubjectName.trim()
        ? customSubjectName.trim()
        : subjects.find((s) => s.id === subjectId)?.name || 'General Course';

      const uploader = user?.fullName || 'Educator Admin';

      // 4. Save metadata in DataStore
      const newMat: StudyMaterial = {
        id: newId,
        subjectId: effectiveSubjectId,
        subjectName: effectiveSubjectName,
        title: title.trim(),
        description: description.trim() || `Course resource for ${effectiveSubjectName}.`,
        fileType,
        fileUrl: `#indexeddb_${newId}`,
        fileSize: formatFileSize(selectedFile.size),
        isPublished,
        uploaderName: uploader,
        createdAt: new Date().toISOString(),
      };

      DataStore.addMaterial(newMat);
      setMaterials(DataStore.getMaterials());

      if (isPublished) {
        DataStore.addNotification({
          id: `notif_${newId}`,
          title: `New Material Uploaded: ${newMat.title}`,
          description: newMat.description,
          subjectName: effectiveSubjectName,
          materialId: newId,
          fileType: newMat.fileType,
          fileSize: newMat.fileSize,
          uploaderName: uploader,
          createdAt: new Date().toISOString(),
          isRead: false,
        });
      }

      setUploadSuccess(true);
      setTimeout(() => {
        setIsUploading(false);
        setUploadSuccess(false);
        setShowUploadModal(false);
        // Reset form
        setTitle('');
        setDescription('');
        setCustomSubjectName('');
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }, 500);
    } catch (err) {
      console.error('Error saving teacher material:', err);
      setIsUploading(false);
    }
  };

  // Filtered materials
  const filteredMaterials = materials.filter((mat) => {
    const query = searchQuery.toLowerCase();
    const subj = getSubjectName(mat).toLowerCase();
    const matchesSearch =
      mat.title.toLowerCase().includes(query) ||
      mat.description.toLowerCase().includes(query) ||
      subj.includes(query);

    const matchesStatus =
      selectedStatus === 'all'
        ? true
        : selectedStatus === 'published'
        ? mat.isPublished
        : !mat.isPublished;

    const matchesType = selectedType === 'all' || mat.fileType === selectedType;

    return matchesSearch && matchesStatus && matchesType;
  });

  const publishedCount = materials.filter((m) => m.isPublished).length;
  const draftCount = materials.length - publishedCount;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-blue-500 dark:text-blue-400" />
            Educator & Resource Management Portal
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Upload curriculum materials, PDFs, manage publication status, and organize subjects for student access.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="self-start sm:self-auto px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-2 border border-blue-400/30 transition-all cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4 text-blue-200" />
          <span>Upload New Material</span>
        </button>
      </div>

      {/* Analytics Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl glass-card border border-gray-800 space-y-1">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold">
            <span>Total Resources</span>
            <FileText className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{materials.length}</div>
          <p className="text-[11px] text-gray-500">Across all courses</p>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-gray-800 space-y-1">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold">
            <span>Published & Live</span>
            <Eye className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{publishedCount}</div>
          <p className="text-[11px] text-gray-500">Accessible by students</p>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-gray-800 space-y-1">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold">
            <span>Drafts</span>
            <EyeOff className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">{draftCount}</div>
          <p className="text-[11px] text-gray-500">Hidden from students</p>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-gray-800 space-y-1">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold">
            <span>Curriculum Subjects</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400">{subjects.length}</div>
          <p className="text-[11px] text-gray-500">Active subjects</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl glass-panel border border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search resources, subjects, or notes..."
            className="w-full pl-10 pr-4 py-2 bg-gray-950/80 border border-gray-800 focus:border-blue-500 rounded-xl text-gray-100 placeholder-gray-500 text-xs focus:outline-none transition-all"
          />
        </div>

        {/* Status and Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto text-xs pb-1 sm:pb-0">
          {(['all', 'published', 'draft'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-lg font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                selectedStatus === st
                  ? 'bg-blue-600 text-white shadow border border-blue-500/30'
                  : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-gray-200'
              }`}
            >
              {st}
            </button>
          ))}

          <div className="w-[1px] h-5 bg-gray-800 mx-1 hidden sm:block" />

          {['all', 'pdf', 'notes', 'question_paper', 'assignment'].map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap ${
                selectedType === t
                  ? 'bg-slate-800 text-blue-300 border border-blue-500/30'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {t === 'all' ? 'All Types' : t.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Materials Table / List */}
      <div className="p-6 rounded-3xl glass-panel border border-gray-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-100">Managed Course Resources</h2>
          <span className="text-xs text-gray-500 font-mono">
            {filteredMaterials.length} of {materials.length} resources
          </span>
        </div>

        <div className="space-y-3">
          {filteredMaterials.map((mat) => {
            const subjectLabel = getSubjectName(mat);

            return (
              <div
                key={mat.id}
                className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 hover:border-blue-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3 overflow-hidden">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0 mt-0.5">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 overflow-hidden">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-gray-100 truncate">{mat.title}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                        <Tag className="w-2.5 h-2.5" />
                        {subjectLabel}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 uppercase font-semibold">
                        {mat.fileType.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">{mat.fileSize || 'PDF'}</span>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-1">{mat.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                  {/* Status Toggle Button */}
                  <button
                    onClick={(e) => handleTogglePublish(mat.id, e)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      mat.isPublished
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                        : 'bg-gray-800 text-gray-400 hover:text-gray-200 border border-gray-700'
                    }`}
                    title="Click to toggle publish / draft status"
                  >
                    {mat.isPublished ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{mat.isPublished ? 'Published' : 'Draft'}</span>
                  </button>

                  {/* Open PDF in New Tab */}
                  <button
                    onClick={(e) => handleOpenPdf(mat, e)}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 border border-blue-400/30 transition-all cursor-pointer shadow-sm"
                    title="Open exact PDF in a new tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open PDF</span>
                  </button>

                  {/* Download */}
                  <button
                    onClick={(e) => handleDownload(mat, e)}
                    className="p-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white border border-gray-800 transition-colors"
                    title="Download original file"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMaterialToDelete(mat);
                    }}
                    className="p-2 rounded-xl bg-gray-900 hover:bg-red-500/10 text-gray-400 hover:text-red-400 border border-gray-800 transition-colors cursor-pointer"
                    title="Delete resource"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {filteredMaterials.length === 0 && (
            <div className="p-10 text-center border border-dashed border-gray-800 rounded-2xl space-y-2">
              <FileText className="w-8 h-8 text-gray-600 mx-auto" />
              <p className="text-sm font-bold text-gray-300">No resources found</p>
              <p className="text-xs text-gray-500">
                Click "Upload New Material" to add your course PDFs or lecture notes.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal with REAL PDF File Upload */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg glass-panel bg-gray-950 rounded-3xl border border-gray-800 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Upload Course Material</h2>
                  <p className="text-xs text-gray-400">Attach and publish original PDF resources for students</p>
                </div>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMaterial} className="space-y-4">
              {/* PDF File Attachment Input */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Select PDF Document <span className="text-blue-400">*</span>
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-800 hover:border-blue-500/50 rounded-2xl p-4 text-center cursor-pointer bg-gray-900/40 transition-colors"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-2 text-blue-300 text-xs font-semibold">
                      <FileText className="w-4 h-4 shrink-0" />
                      <span className="truncate max-w-xs">{selectedFile.name}</span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        ({formatFileSize(selectedFile.size)})
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="w-5 h-5 text-gray-500 mx-auto" />
                      <p className="text-xs text-gray-300 font-medium">Click to select original course PDF</p>
                      <p className="text-[10px] text-gray-500">Supports PDF documents up to 50 MB</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Resource Title <span className="text-blue-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Unit 3 Concurrency & Deadlocks Notes"
                  required
                  className="w-full py-2.5 px-3.5 rounded-xl bg-gray-900 border border-gray-800 focus:border-blue-500 text-gray-100 placeholder-gray-500 text-xs focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief summary of topics or syllabus covered in this document..."
                  rows={2}
                  className="w-full py-2.5 px-3.5 rounded-xl bg-gray-900 border border-gray-800 focus:border-blue-500 text-gray-100 placeholder-gray-500 text-xs focus:outline-none resize-none"
                />
              </div>

              {/* Subject Selection + Custom Subject */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Subject
                  </label>
                  <select
                    value={subjectId}
                    onChange={(e) => {
                      setSubjectId(e.target.value);
                      setCustomSubjectName('');
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-gray-900 border border-gray-800 focus:border-blue-500 text-gray-100 text-xs focus:outline-none"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Resource Type
                  </label>
                  <select
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value as any)}
                    className="w-full py-2.5 px-3 rounded-xl bg-gray-900 border border-gray-800 focus:border-blue-500 text-gray-100 text-xs focus:outline-none"
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="notes">Lecture Notes</option>
                    <option value="question_paper">Question Paper</option>
                    <option value="assignment">Assignment</option>
                  </select>
                </div>
              </div>

              {/* Or Custom Subject Name */}
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">
                  Or enter new subject name:
                </label>
                <input
                  type="text"
                  value={customSubjectName}
                  onChange={(e) => setCustomSubjectName(e.target.value)}
                  placeholder="e.g. Distributed Systems, Calculus..."
                  className="w-full py-2 px-3 rounded-xl bg-gray-900 border border-gray-800 focus:border-blue-500 text-gray-100 placeholder-gray-600 text-xs focus:outline-none"
                />
              </div>

              {/* Publish Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  id="pub-teacher"
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 rounded bg-gray-950 border-gray-800 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="pub-teacher" className="text-xs text-gray-300 font-medium cursor-pointer">
                  Publish immediately (Students will see this resource in Study Materials)
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!title.trim() || !selectedFile || isUploading}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs border border-blue-400/30 shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                      Saving PDF...
                    </>
                  ) : uploadSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      Saved Successfully!
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Publish Material
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Resource Confirmation Modal */}
      {materialToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md p-6 rounded-3xl glass-panel bg-gray-950 border border-red-500/30 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Educator Resource?</h3>
                <p className="text-xs text-gray-400">Remove from student materials & educator hub.</p>
              </div>
            </div>

            <p className="text-sm text-gray-300 bg-gray-900/60 p-3.5 rounded-2xl border border-gray-800 leading-relaxed">
              Are you sure you want to delete <strong className="text-white">"{materialToDelete.title}"</strong>?
              This will remove this PDF resource from the student study materials and delete its notifications.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMaterialToDelete(null)}
                className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteMaterial}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold border border-red-400/30 cursor-pointer transition-colors shadow-lg shadow-red-950/40"
              >
                Yes, Delete Resource
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
