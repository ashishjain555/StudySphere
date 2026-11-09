import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  HardDrive,
  Layers,
  BookOpen,
  Brain,
  HelpCircle,
  ArrowUpDown,
  LayoutGrid,
  List,
  Sparkles,
} from 'lucide-react';
import { DataStore } from '../lib/dataStore';
import { PDFStorage, dataURLtoBlob, createDefaultPdfDataUrl } from '../lib/pdfStorage';
import { StudyMaterial, MaterialFileType, Subject } from '../types';
import { useAuth } from '../context/AuthContext';
import { TiltCard3D } from '../components/3d/TiltCard3D';

interface StudyMaterialsPageProps {
  onNavigate?: (path: string) => void;
}

export const StudyMaterialsPage: React.FC<StudyMaterialsPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<StudyMaterial[]>(() => {
    const m = DataStore.getMaterials();
    return Array.isArray(m) ? m : [];
  });
  const [subjects] = useState<Subject[]>(() => {
    const s = DataStore.getSubjects();
    return Array.isArray(s) ? s : [];
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name_asc' | 'size_desc'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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

  // Real-time synchronization when materials update
  useEffect(() => {
    const handleUpdate = () => {
      const m = DataStore.getMaterials();
      setMaterials(Array.isArray(m) ? m : []);
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

  // Real Storage & Content Metrics (100% computed from DataStore)
  const totalStorageLabel = useMemo(() => {
    let totalBytes = 0;
    materials.forEach((m) => {
      if (m.fileSize) {
        const match = m.fileSize.match(/^([\d.]+)\s*(MB|KB|B|GB)/i);
        if (match) {
          const val = parseFloat(match[1]);
          const unit = match[2].toUpperCase();
          if (unit === 'MB') totalBytes += val * 1024 * 1024;
          else if (unit === 'KB') totalBytes += val * 1024;
          else if (unit === 'GB') totalBytes += val * 1024 * 1024 * 1024;
          else totalBytes += val;
        }
      }
    });
    if (totalBytes === 0) return '0 KB';
    if (totalBytes < 1024 * 1024) return `${(totalBytes / 1024).toFixed(1)} KB`;
    return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
  }, [materials]);

  const safeMaterials = Array.isArray(materials) ? materials : [];

  const coveredSubjectsCount = useMemo(() => {
    return new Set(safeMaterials.map((m) => m && (m.subjectId || m.subjectName))).size;
  }, [safeMaterials]);

  const pdfCount = useMemo(() => safeMaterials.filter((m) => m && m.fileType === 'pdf').length, [safeMaterials]);
  const notesCount = useMemo(() => safeMaterials.filter((m) => m && m.fileType === 'notes').length, [safeMaterials]);
  const qpCount = useMemo(() => safeMaterials.filter((m) => m && m.fileType === 'question_paper').length, [safeMaterials]);
  const assignmentCount = useMemo(() => safeMaterials.filter((m) => m && m.fileType === 'assignment').length, [safeMaterials]);

  /**
   * Pre-load Blob URLs for all stored materials on mount.
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

      // 3. Permanently store the exact binary file in PDFStorage (IndexedDB)
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

    // 2. IndexedDB check
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

    // 5. Fallback: Generate valid printable PDF document
    const fallbackDataUrl = createDefaultPdfDataUrl(mat.title, getSubjectLabel(mat));
    const fallbackBlob = dataURLtoBlob(fallbackDataUrl);
    const fallbackUrl = URL.createObjectURL(fallbackBlob);
    setBlobUrlMap((prev) => ({ ...prev, [mat.id]: fallbackUrl }));
    return fallbackUrl;
  };

  /**
   * Opens the exact original uploaded PDF file in a new browser tab.
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

  const confirmDeleteMaterial = async () => {
    if (!materialToDelete) return;
    const matId = materialToDelete.id;

    // Delete from IndexedDB binary cache
    await PDFStorage.deletePDF(matId).catch(() => {});

    // Delete from DataStore metadata
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

  // Filter & Sort Materials
  const filtered = useMemo(() => {
    return safeMaterials
      .filter((m) => {
        if (!m) return false;
        const subjectLabel = getSubjectLabel(m).toLowerCase();
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !query ||
          m.title.toLowerCase().includes(query) ||
          (m.description && m.description.toLowerCase().includes(query)) ||
          subjectLabel.includes(query);

        const matchesType = selectedType === 'all' || m.fileType === selectedType;

        const matchesSubject =
          selectedSubjectFilter === 'all' ||
          m.subjectId === selectedSubjectFilter ||
          m.subjectName?.toLowerCase() === selectedSubjectFilter.toLowerCase();

        return matchesSearch && matchesType && matchesSubject;
      })
      .sort((a, b) => {
        if (sortBy === 'oldest') {
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        }
        if (sortBy === 'name_asc') {
          return a.title.localeCompare(b.title);
        }
        if (sortBy === 'size_desc') {
          return (b.fileSize || '').localeCompare(a.fileSize || '');
        }
        // Default: newest first
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
  }, [materials, searchQuery, selectedType, selectedSubjectFilter, sortBy, subjects]);

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header with Title & Upload Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400">
              <FolderOpen className="w-5 h-5" />
            </div>
            <span>Course Materials & Notes Vault</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Secure, full-resolution PDF repository. View original lecture notes, textbooks, and past papers.
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

      {/* Real Storage Vault Metrics Strip (100% computed from DataStore) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl glass-card border border-slate-800 bg-slate-900/60 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-white font-mono">{materials.length}</div>
            <div className="text-xs text-slate-400">Stored Documents</div>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl glass-card border border-slate-800 bg-slate-900/60 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 shrink-0">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-white font-mono">{totalStorageLabel}</div>
            <div className="text-xs text-slate-400">Total Storage Used</div>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl glass-card border border-slate-800 bg-slate-900/60 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-white font-mono">{coveredSubjectsCount}</div>
            <div className="text-xs text-slate-400">Subjects Covered</div>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl glass-card border border-slate-800 bg-slate-900/60 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-white font-mono">{pdfCount}</div>
            <div className="text-xs text-slate-400">Original PDFs</div>
          </div>
        </div>
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
                "{lastUploadedDoc.title}" uploaded & saved to your vault!
              </p>
              <p className="text-[11px] text-slate-400">
                Your original PDF is ready to open directly in a new tab without restrictions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => handleOpenPdfInNewTab(lastUploadedDoc)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 border border-blue-400/30 shadow-md transition-all cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in New Tab</span>
            </button>
            <button
              onClick={() => setLastUploadedDoc(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white"
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
            className="p-1.5 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search, Filter & View Controls */}
      <div className="p-4 rounded-2xl glass-panel border border-slate-800 bg-slate-900/50 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, subject, or keywords..."
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

          {/* Controls: Subject filter, Sort, and View Mode */}
          <div className="flex flex-wrap items-center gap-2.5 self-end md:self-auto">
            {/* Subject Dropdown Filter */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300">
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedSubjectFilter}
                onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-slate-200">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id} className="bg-slate-900 text-slate-200">
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="newest" className="bg-slate-900 text-slate-200">Newest First</option>
                <option value="oldest" className="bg-slate-900 text-slate-200">Oldest First</option>
                <option value="name_asc" className="bg-slate-900 text-slate-200">Title (A-Z)</option>
                <option value="size_desc" className="bg-slate-900 text-slate-200">File Size</option>
              </select>
            </div>

            {/* View Mode Switcher */}
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

        {/* Type Category Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              selectedType === 'all'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/35'
                : 'bg-slate-950/50 text-slate-400 border border-slate-800 hover:border-slate-700'
            }`}
          >
            All Materials ({materials.length})
          </button>
          <button
            onClick={() => setSelectedType('pdf')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              selectedType === 'pdf'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/35'
                : 'bg-slate-950/50 text-slate-400 border border-slate-800 hover:border-slate-700'
            }`}
          >
            PDF Documents ({pdfCount})
          </button>
          <button
            onClick={() => setSelectedType('notes')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              selectedType === 'notes'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/35'
                : 'bg-slate-950/50 text-slate-400 border border-slate-800 hover:border-slate-700'
            }`}
          >
            Lecture Notes ({notesCount})
          </button>
          <button
            onClick={() => setSelectedType('question_paper')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              selectedType === 'question_paper'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/35'
                : 'bg-slate-950/50 text-slate-400 border border-slate-800 hover:border-slate-700'
            }`}
          >
            Question Papers ({qpCount})
          </button>
          <button
            onClick={() => setSelectedType('assignment')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              selectedType === 'assignment'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/35'
                : 'bg-slate-950/50 text-slate-400 border border-slate-800 hover:border-slate-700'
            }`}
          >
            Assignments ({assignmentCount})
          </button>
        </div>
      </div>

      {/* Grid or List View */}
      {materials.length === 0 ? (
        <div className="p-12 sm:p-16 text-center border border-dashed border-slate-800/80 rounded-3xl space-y-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/25 text-blue-400 flex items-center justify-center mx-auto shadow-inner">
            <FolderOpen className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-xl font-bold text-white tracking-tight">Your Course Materials Vault is Empty</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              Upload textbook chapters, revision sheets, or past exam question papers. All files are permanently preserved in your private browser storage.
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
        <div className="p-10 text-center border border-dashed border-slate-800 rounded-3xl space-y-3 bg-slate-900/40">
          <FolderOpen className="w-9 h-9 text-slate-500 mx-auto" />
          <p className="text-sm font-bold text-slate-300">No study materials match your search filters</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query, or reset subject and type filters to see all available documents.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedType('all');
              setSelectedSubjectFilter('all');
            }}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((mat) => {
            const subjectLabel = getSubjectLabel(mat);
            const canDelete =
              user?.role === 'teacher' ||
              mat.uploaderName === 'Student Workspace' ||
              (user?.fullName && mat.uploaderName === user.fullName) ||
              !mat.uploaderName;
            const isHighlighted = mat.id === highlightedMatId;

            return (
              <TiltCard3D key={mat.id} maxTilt={5}>
                <div
                  id={`material_${mat.id}`}
                  className={`p-6 rounded-3xl glass-card border flex flex-col justify-between space-y-4 transition-all group bg-slate-950/60 h-full relative ${
                    isHighlighted
                      ? 'border-blue-500 bg-blue-950/20 ring-2 ring-blue-500/50 shadow-xl shadow-blue-500/10'
                      : 'border-slate-800 hover:border-blue-500/40'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header Tags & Metadata */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 uppercase font-semibold">
                          {mat.fileType.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-slate-800/90 text-slate-300 border border-slate-700/60 flex items-center gap-1">
                          <Tag className="w-2.5 h-2.5 text-blue-400" />
                          <span>{subjectLabel}</span>
                        </span>
                        {isHighlighted && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white animate-pulse">
                            Selected Notice
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-mono">{mat.fileSize || 'PDF'}</span>
                        {canDelete && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMaterialToDelete(mat);
                            }}
                            className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete material"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h2 className="text-base font-bold text-slate-100 group-hover:text-blue-300 transition-colors">
                      {mat.title}
                    </h2>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {mat.description}
                    </p>
                  </div>

                  {/* Actions & Utilities Bar */}
                  <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-500 truncate font-mono">
                      {mat.createdAt ? new Date(mat.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Saved'}
                    </span>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* AI Tutor deep dive */}
                      {onNavigate && (
                        <button
                          onClick={() => onNavigate('/app/ai-tutor')}
                          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-blue-300 border border-slate-800 transition-colors cursor-pointer"
                          title="Ask AI Tutor about this topic"
                        >
                          <Brain className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Download */}
                      <button
                        onClick={(e) => handleDownload(mat, e)}
                        className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                        title="Download Original PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      {/* Open in New Tab */}
                      <button
                        onClick={(e) => handleOpenPdfInNewTab(mat, e)}
                        className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 border border-blue-400/30 shadow-sm transition-all cursor-pointer"
                        title="Open exact PDF in a new tab"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open PDF</span>
                      </button>
                    </div>
                  </div>
                </div>
              </TiltCard3D>
            );
          })}
        </div>
      ) : (
        /* Detailed List / Table View */
        <div className="rounded-2xl glass-panel border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-mono text-[10px]">
                <tr>
                  <th className="py-3 px-4">Document Title</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">File Size</th>
                  <th className="py-3 px-4">Saved Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-200">
                {filtered.map((mat) => {
                  const subjectLabel = getSubjectLabel(mat);
                  const canDelete =
                    user?.role === 'teacher' ||
                    mat.uploaderName === 'Student Workspace' ||
                    (user?.fullName && mat.uploaderName === user.fullName) ||
                    !mat.uploaderName;

                  return (
                    <tr
                      key={mat.id}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => handleOpenPdfInNewTab(mat)}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-100 group-hover:text-blue-300 transition-colors">
                          {mat.title}
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{mat.description}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] border border-slate-700/60 font-medium">
                          {subjectLabel}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono uppercase text-[10px] text-blue-400">
                        {mat.fileType.replace('_', ' ')}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">{mat.fileSize || 'PDF'}</td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                        {mat.createdAt ? new Date(mat.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Saved'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleOpenPdfInNewTab(mat, e)}
                            className="px-2.5 py-1 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 text-[11px] font-medium border border-blue-500/30 transition-colors"
                          >
                            Open
                          </button>
                          <button
                            onClick={(e) => handleDownload(mat, e)}
                            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Download PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          {canDelete && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setMaterialToDelete(mat);
                              }}
                              className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Delete Material"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* Upload Material Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg glass-panel bg-slate-950 rounded-3xl border border-slate-800 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Upload Study Material</h2>
                  <p className="text-xs text-slate-400">Preserves original PDF for instant browser opening</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* Subject Name Input with quick suggestion list */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Subject Name <span className="text-blue-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customSubjectName}
                  onChange={(e) => setCustomSubjectName(e.target.value)}
                  placeholder="e.g. Operating Systems, Mathematics, DBMS..."
                  className="w-full py-2.5 px-3.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-blue-500 text-slate-100 placeholder-slate-500 text-xs focus:outline-none"
                />
                {/* Quick Subject Chips from DataStore */}
                {subjects.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {subjects.slice(0, 5).map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setCustomSubjectName(s.name)}
                        className="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 text-[10px] text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
                      >
                        + {s.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Document Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Document Title <span className="text-blue-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="e.g. Chapter 4 Concurrency & Deadlocks Notes"
                  className="w-full py-2.5 px-3.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-blue-500 text-slate-100 placeholder-slate-500 text-xs focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Short Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={docDescription}
                  onChange={(e) => setDocDescription(e.target.value)}
                  placeholder="Brief notes, key topics, or chapter reference..."
                  className="w-full py-2.5 px-3.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-blue-500 text-slate-100 placeholder-slate-500 text-xs focus:outline-none resize-none"
                />
              </div>

              {/* Material Type Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
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
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
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
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Choose PDF File <span className="text-blue-400">*</span>
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-800 hover:border-blue-500/50 rounded-2xl p-4 text-center cursor-pointer bg-slate-900/40 transition-colors"
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
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({formatFileSize(selectedFile.size)})
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="w-5 h-5 text-slate-500 mx-auto" />
                      <p className="text-xs text-slate-300 font-medium">Click to select original PDF</p>
                      <p className="text-[10px] text-slate-500">Supports PDF documents up to 50 MB</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md p-6 rounded-3xl glass-panel bg-slate-950 border border-rose-500/30 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Study Material?</h3>
                <p className="text-xs text-slate-400">This document will be permanently removed from storage.</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800 leading-relaxed">
              Are you sure you want to delete <strong className="text-white">"{materialToDelete.title}"</strong>?
              {materialToDelete.subjectName && (
                <span className="block mt-1 text-xs text-slate-400">
                  Subject: <span className="text-slate-300">{materialToDelete.subjectName}</span>
                </span>
              )}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMaterialToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteMaterial}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold border border-rose-400/30 cursor-pointer transition-colors shadow-lg shadow-rose-950/40"
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
