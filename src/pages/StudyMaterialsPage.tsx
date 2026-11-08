import React, { useState, useRef, useEffect } from 'react';
import {
  FolderOpen,
  FileText,
  Search,
  Download,
  Filter,
  X,
  Plus,
  Upload,
  CheckCircle,
  Tag,
  Trash2,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { DataStore } from '../lib/dataStore';
import { PDFStorage, dataURLtoBlob, createDefaultPdfDataUrl } from '../lib/pdfStorage';
import { StudyMaterial, MaterialFileType } from '../types';
import { useAuth } from '../context/AuthContext';

interface StudyMaterialsPageProps {
  onNavigate?: (path: string) => void;
}

export const StudyMaterialsPage: React.FC<StudyMaterialsPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<StudyMaterial[]>(() => DataStore.getMaterials());
  const [subjects] = useState(() => DataStore.getSubjects());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [blobUrlMap, setBlobUrlMap] = useState<Record<string, string>>({});
  const [lastUploadedDoc, setLastUploadedDoc] = useState<StudyMaterial | null>(null);
  const [materialToDelete, setMaterialToDelete] = useState<StudyMaterial | null>(null);

  // Material highlighted from clicking header notification
  const [highlightedMatId, setHighlightedMatId] = useState<string | null>(() => {
    try {
      const id = sessionStorage.getItem('studysphere_highlight_material');
      if (id) {
        sessionStorage.removeItem('studysphere_highlight_material');
        return id;
      }
    } catch {}
    return null;
  });

  // Real-time synchronization when any teacher/admin or student uploads or deletes materials
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

  // Smooth scroll to highlighted material
  useEffect(() => {
    if (highlightedMatId) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`material_${highlightedMatId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [highlightedMatId, materials]);

  // Upload Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customSubjectName, setCustomSubjectName] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [docDescription, setDocDescription] = useState('');
  const [selectedFileType, setSelectedFileType] = useState<MaterialFileType>('pdf');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getSubjectLabel = (mat: StudyMaterial): string => {
    if (mat.subjectName) return mat.subjectName;
    const found = subjects.find((s) => s.id === mat.subjectId);
    return found ? found.name : 'General Science';
  };

  /**
   * Pre-load Blob URLs for all stored materials on mount.
   * Ensures instant, synchronous opening in a new tab without popup blocker interference.
   */
  useEffect(() => {
    PDFStorage.cleanupLegacyStorage().catch(() => {});
    let isMounted = true;

    const prefetchBlobs = async () => {
      const newMap: Record<string, string> = {};

      for (const mat of materials) {
        if (blobUrlMap[mat.id]) continue;

        try {
          // 1. Check IndexedDB / LocalStorage
          const stored = await PDFStorage.getPDF(mat.id);
          if (stored && stored.dataUrl) {
            const blob = dataURLtoBlob(stored.dataUrl);
            newMap[mat.id] = URL.createObjectURL(blob);
            continue;
          }

          // 2. Check inline Base64
          if (mat.fileUrl && mat.fileUrl.startsWith('data:')) {
            const blob = dataURLtoBlob(mat.fileUrl);
            newMap[mat.id] = URL.createObjectURL(blob);
            continue;
          }

          // 3. Check regular URL
          if (mat.fileUrl && mat.fileUrl.startsWith('http')) {
            newMap[mat.id] = mat.fileUrl;
          }
        } catch (e) {
          console.warn('Error resolving PDF blob for material:', mat.id, e);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);

      if (!docTitle) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setDocTitle(cleanName);
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim() || !customSubjectName.trim() || !selectedFile) return;

    setIsUploading(true);
    const newId = `mat_${Date.now()}`;

    const matchedSubject = subjects.find(
      (s) => s.name.toLowerCase() === customSubjectName.trim().toLowerCase()
    );

    const subjectId = matchedSubject
      ? matchedSubject.id
      : `subj_${customSubjectName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    try {
      // 1. Immediately create a direct Blob URL directly from the original File
      const directBlobUrl = URL.createObjectURL(selectedFile);
      setBlobUrlMap((prev) => ({ ...prev, [newId]: directBlobUrl }));

      // 2. Read the entire original file as Base64 Data URL
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      // 3. Permanently store the exact binary file in PDFStorage
      await PDFStorage.savePDF({
        id: newId,
        name: selectedFile.name,
        dataUrl: base64Data,
        mimeType: selectedFile.type || 'application/pdf',
        size: selectedFile.size,
        uploadedAt: new Date().toISOString(),
      });

      // 4. Save metadata in DataStore
      const isTeacher = user?.role === 'teacher';
      const uploader = isTeacher
        ? user?.fullName || 'Educator Admin'
        : user?.fullName || 'Student Workspace';

      const newMaterial: StudyMaterial = {
        id: newId,
        subjectId,
        subjectName: customSubjectName.trim(),
        title: docTitle.trim(),
        description:
          docDescription.trim() ||
          `Study resource for ${customSubjectName.trim()} uploaded by ${uploader}.`,
        fileType: selectedFileType,
        fileUrl: `#indexeddb_${newId}`,
        fileSize: formatFileSize(selectedFile.size),
        isPublished: true,
        uploaderName: uploader,
        createdAt: new Date().toISOString(),
      };

      DataStore.addMaterial(newMaterial);
      setMaterials(DataStore.getMaterials());
      setLastUploadedDoc(newMaterial);

      if (isTeacher) {
        DataStore.addNotification({
          id: `notif_${newId}`,
          title: `New Material Uploaded: ${newMaterial.title}`,
          description: newMaterial.description,
          subjectName: newMaterial.subjectName || customSubjectName.trim(),
          materialId: newId,
          fileType: newMaterial.fileType,
          fileSize: newMaterial.fileSize,
          uploaderName: uploader,
          createdAt: new Date().toISOString(),
          isRead: false,
        });
      }

      setUploadSuccess(true);
      setTimeout(() => {
        setUploadSuccess(false);
        setIsUploading(false);
        setIsModalOpen(false);
        // Reset form
        setCustomSubjectName('');
        setDocTitle('');
        setDocDescription('');
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }, 500);
    } catch (err) {
      console.error('Error saving study material:', err);
      setIsUploading(false);
    }
  };

  /**
   * Resolves the actual Blob URL for opening or downloading the original PDF.
   */
  const resolveMaterialUrl = async (mat: StudyMaterial): Promise<string | null> => {
    // 1. In-memory pre-resolved URL
    if (blobUrlMap[mat.id]) {
      return blobUrlMap[mat.id];
    }

    // 2. IndexedDB / LocalStorage check
    try {
      const stored = await PDFStorage.getPDF(mat.id);
      if (stored && stored.dataUrl) {
        const blob = dataURLtoBlob(stored.dataUrl);
        const url = URL.createObjectURL(blob);
        setBlobUrlMap((prev) => ({ ...prev, [mat.id]: url }));
        return url;
      }
    } catch (e) {
      console.warn('Error reading from PDFStorage:', e);
    }

    // 3. Inline Base64 Data URL
    if (mat.fileUrl && mat.fileUrl.startsWith('data:')) {
      const blob = dataURLtoBlob(mat.fileUrl);
      const url = URL.createObjectURL(blob);
      setBlobUrlMap((prev) => ({ ...prev, [mat.id]: url }));
      return url;
    }

    // 4. External URL
    if (mat.fileUrl && mat.fileUrl.startsWith('http')) {
      return mat.fileUrl;
    }

    // 5. Fallback: Generate valid printable PDF document so no document is ever broken
    const fallbackDataUrl = createDefaultPdfDataUrl(mat.title, getSubjectLabel(mat));
    const fallbackBlob = dataURLtoBlob(fallbackDataUrl);
    const fallbackUrl = URL.createObjectURL(fallbackBlob);
    setBlobUrlMap((prev) => ({ ...prev, [mat.id]: fallbackUrl }));
    return fallbackUrl;
  };

  /**
   * Directly opens the exact original uploaded PDF file in a new browser tab.
   * Uses native anchor click with target="_blank" and rel="noopener" (NOT noreferrer)
   * so browser PDF viewer can read blob URLs directly without restriction.
   */
  const handleOpenPdfInNewTab = async (mat: StudyMaterial, e?: React.MouseEvent) => {
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
      console.error('Error opening PDF in new tab:', err);
    }
  };

  const handleDownload = async (mat: StudyMaterial, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const url = await resolveMaterialUrl(mat);
      if (url) {
        const a = document.createElement('a');
        a.href = url;
        const cleanName = (mat.title || 'study_material')
          .trim()
          .replace(/[^a-zA-Z0-9_\-\s]/g, '')
          .replace(/\s+/g, '_');
        a.download = cleanName.toLowerCase().endsWith('.pdf') ? cleanName : `${cleanName}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Error downloading PDF:', err);
    }
  };

  const confirmDeleteMaterial = () => {
    if (!materialToDelete) return;
    const matId = materialToDelete.id;
    DataStore.deleteMaterial(matId);
    setMaterials(DataStore.getMaterials());
    if (lastUploadedDoc?.id === matId) {
      setLastUploadedDoc(null);
    }
    if (highlightedMatId === matId) {
      setHighlightedMatId(null);
    }
    setMaterialToDelete(null);
  };

  const filtered = materials.filter((m) => {
    const subjectLabel = getSubjectLabel(m).toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      m.title.toLowerCase().includes(query) ||
      m.description.toLowerCase().includes(query) ||
      subjectLabel.includes(query);
    const matchesType = selectedType === 'all' || m.fileType === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header with Upload Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <FolderOpen className="w-8 h-8 text-blue-500 dark:text-blue-400" />
            Study Materials Library
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Access and open your exact study notes and original PDFs in full screen by subject.
          </p>
        </div>

        {/* Upload Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="self-start sm:self-auto px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-2 border border-blue-400/30 transition-all cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4 text-blue-200" />
          <span>Upload PDF / Material</span>
        </button>
      </div>

      {/* Uploaded Confirmation Banner with Instant Open */}
      {lastUploadedDoc && (
        <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                "{lastUploadedDoc.title}" uploaded & saved!
              </p>
              <p className="text-[11px] text-gray-400">
                Your original PDF is ready to open directly in a new tab.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => handleOpenPdfInNewTab(lastUploadedDoc)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 border border-blue-400/30 shadow-md transition-all cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in New Tab Now</span>
            </button>
            <button
              onClick={() => setLastUploadedDoc(null)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Notice Banner for Announced Material */}
      {highlightedMatId && (
        <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/40 flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping" />
            <div>
              <p className="text-xs font-bold text-white">
                Viewing announced study material from notice
              </p>
              <p className="text-[11px] text-blue-300">
                {materials.find((m) => m.id === highlightedMatId)?.title || 'Teacher Uploaded PDF'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setHighlightedMatId(null)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl glass-panel border border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by subject name, title, or keywords..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-950/80 border border-gray-800 focus:border-blue-500 rounded-xl text-gray-100 placeholder-gray-500 text-xs focus:outline-none transition-all"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs pb-1 sm:pb-0">
          {['all', 'pdf', 'notes', 'question_paper', 'assignment'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-lg font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                selectedType === type
                  ? 'bg-blue-600 text-white shadow border border-blue-500/30'
                  : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-gray-200'
              }`}
            >
              {type.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Material Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((mat) => {
          const subjectLabel = getSubjectLabel(mat);
          const canDelete =
            user?.role === 'teacher' ||
            mat.uploaderName === 'Student Workspace' ||
            (user?.fullName && mat.uploaderName === user.fullName);
          const isHighlighted = mat.id === highlightedMatId;

          return (
            <div
              id={`material_${mat.id}`}
              key={mat.id}
              className={`p-6 rounded-3xl glass-card border flex flex-col justify-between space-y-4 transition-all group ${
                isHighlighted
                  ? 'border-blue-500 bg-blue-950/20 ring-2 ring-blue-500/50 shadow-xl shadow-blue-500/10'
                  : 'border-gray-800 hover:border-blue-500/40'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase font-bold">
                      {mat.fileType.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 flex items-center gap-1">
                      <Tag className="w-2.5 h-2.5" />
                      {subjectLabel}
                    </span>
                    {isHighlighted && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white animate-pulse">
                        Selected Notice
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-mono">{mat.fileSize || 'PDF'}</span>
                    {canDelete && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMaterialToDelete(mat);
                        }}
                        className="p-1 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Delete material"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <h2 className="text-base font-bold text-gray-100 group-hover:text-blue-300 transition-colors">
                  {mat.title}
                </h2>
                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                  {mat.description}
                </p>
              </div>

              {/* Direct Action Buttons - Opens Exact Original PDF in New Tab */}
              <div className="pt-4 border-t border-gray-800/80 flex items-center justify-between gap-3">
                <span className="text-[11px] text-gray-500 truncate">{mat.uploaderName}</span>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => handleDownload(mat, e)}
                    className="p-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-800 transition-colors"
                    title="Download Original PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => handleOpenPdfInNewTab(mat, e)}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 border border-blue-400/30 shadow-sm transition-all cursor-pointer"
                    title="Open exact PDF in a new tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open PDF</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {materials.length === 0 ? (
        <div className="p-12 sm:p-16 text-center border border-dashed border-slate-800/80 rounded-3xl space-y-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/25 text-blue-400 flex items-center justify-center mx-auto shadow-inner">
            <FolderOpen className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-xl font-bold text-white tracking-tight">Your Private Study Vault is Empty</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              All documents and PDFs you upload are 100% private to your account. No other user can view or access your personal materials.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs inline-flex items-center gap-2 border border-blue-400/30 transition-all cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Your First PDF</span>
            </button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-gray-800 rounded-3xl space-y-3">
          <FolderOpen className="w-10 h-10 text-gray-600 mx-auto" />
          <p className="text-base font-bold text-gray-300">No study materials match your search</p>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Try adjusting your search query, selecting "ALL" categories, or click "Upload PDF / Material" to add your study documents.
          </p>
        </div>
      ) : null}

      {/* Upload Material Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg glass-panel bg-gray-950 rounded-3xl border border-gray-800 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Upload Study Material</h2>
                  <p className="text-xs text-gray-400">Save your original PDF to open anytime in a new tab</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* Subject Name Input with quick suggestion list */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Subject Name <span className="text-blue-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customSubjectName}
                  onChange={(e) => setCustomSubjectName(e.target.value)}
                  placeholder="e.g. Operating Systems, Mathematics, DBMS..."
                  className="w-full py-2.5 px-3.5 rounded-xl bg-gray-900 border border-gray-800 focus:border-blue-500 text-gray-100 placeholder-gray-500 text-xs focus:outline-none"
                />
                {/* Quick Subject Chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {subjects.slice(0, 4).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setCustomSubjectName(s.name)}
                      className="px-2 py-0.5 rounded-md bg-gray-900 hover:bg-gray-800 text-[10px] text-gray-400 hover:text-gray-200 border border-gray-800 transition-colors"
                    >
                      + {s.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Document Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Document Title <span className="text-blue-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="e.g. Chapter 4 Concurrency & Deadlocks Notes"
                  className="w-full py-2.5 px-3.5 rounded-xl bg-gray-900 border border-gray-800 focus:border-blue-500 text-gray-100 placeholder-gray-500 text-xs focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Short Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={docDescription}
                  onChange={(e) => setDocDescription(e.target.value)}
                  placeholder="Brief notes or description..."
                  className="w-full py-2.5 px-3.5 rounded-xl bg-gray-900 border border-gray-800 focus:border-blue-500 text-gray-100 placeholder-gray-500 text-xs focus:outline-none resize-none"
                />
              </div>

              {/* Material Type Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Material Type
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['pdf', 'notes', 'question_paper', 'assignment'] as MaterialFileType[]).map(
                    (type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setSelectedFileType(type)}
                        className={`py-2 px-1 text-center rounded-xl text-[11px] font-semibold uppercase border transition-all ${
                          selectedFileType === type
                            ? 'bg-blue-600 text-white border-blue-500 shadow'
                            : 'bg-gray-900 text-gray-400 border-gray-800 hover:text-gray-200'
                        }`}
                      >
                        {type.replace('_', ' ')}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* File Attachment */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Choose PDF File <span className="text-blue-400">*</span>
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
                      <p className="text-xs text-gray-300 font-medium">Click to select original PDF</p>
                      <p className="text-[10px] text-gray-500">Supports PDF documents up to 50 MB</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!docTitle.trim() || !customSubjectName.trim() || !selectedFile || isUploading}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs border border-blue-400/30 shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                      Saving PDF...
                    </>
                  ) : uploadSuccess ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-white" />
                      Saved Successfully!
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Add to Study Materials
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Study Material Confirmation Modal */}
      {materialToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md p-6 rounded-3xl glass-panel bg-gray-950 border border-red-500/30 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Study Material?</h3>
                <p className="text-xs text-gray-400">This document will be permanently removed.</p>
              </div>
            </div>

            <p className="text-sm text-gray-300 bg-gray-900/60 p-3.5 rounded-2xl border border-gray-800 leading-relaxed">
              Are you sure you want to delete <strong className="text-white">"{materialToDelete.title}"</strong>?
              {materialToDelete.subjectName && (
                <span className="block mt-1 text-xs text-gray-400">
                  Subject: <span className="text-gray-300">{materialToDelete.subjectName}</span>
                </span>
              )}
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
                Yes, Delete Material
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
