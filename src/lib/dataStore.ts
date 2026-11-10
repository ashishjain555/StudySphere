import {
  Subject,
  SubjectDocument,
  Topic,
  StudyMaterial,
  QuizQuestion,
  QuizAttempt,
  StudyPlanTask,
  WeakTopic,
  AIConversation,
  UserProfile,
  AnalyzedPDFRecord,
  TeacherNotification,
  UserFeedback,
} from '../types';
import { STORAGE_KEYS } from './supabase';
import { PDFStorage } from './pdfStorage';
import {
  syncSubjectToSupabase,
  deleteSubjectFromSupabase,
  syncMaterialToSupabase,
  deleteMaterialFromSupabase,
  fetchMaterialsFromSupabase,
  syncTaskToSupabase,
  deleteTaskFromSupabase,
  fetchTasksFromSupabase,
  syncQuizAttemptToSupabase,
  fetchQuizAttemptsFromSupabase,
  syncWeakTopicToSupabase,
  fetchWeakTopicsFromSupabase,
  syncAIMessageToSupabase,
  autoSeedCurriculumToSupabase,
  syncFeedbackToSupabase,
  fetchFeedbacksFromSupabase,
} from './supabaseSync';

function getStored<T>(key: string, defaultVal: T): T {
  try {
    const isExpectingArray = Array.isArray(defaultVal);
    const item = localStorage.getItem(key);

    if (item !== null) {
      try {
        const parsed = JSON.parse(item);
        if (isExpectingArray) {
          if (Array.isArray(parsed)) {
            return parsed as unknown as T;
          } else {
            // Self-healing: if an array was expected but corrupted object/primitive was stored, clear it!
            localStorage.removeItem(key);
          }
        } else if (parsed !== null && parsed !== undefined) {
          return parsed as unknown as T;
        }
      } catch {
        localStorage.removeItem(key);
      }
    }

    // Multi-tier Fallback & Auto-Migration for user-scoped keys
    const rawUser = localStorage.getItem(STORAGE_KEYS.USER);
    if (rawUser) {
      try {
        const u = JSON.parse(rawUser);
        if (u && u.id) {
          // Match against exact known STORAGE_KEYS
          for (const baseKey of Object.values(STORAGE_KEYS)) {
            if (key.startsWith(baseKey + '_')) {
              // 1. Check raw u.id fallback
              const altKey = `${baseKey}_${u.id}`;
              if (altKey !== key) {
                const altItem = localStorage.getItem(altKey);
                if (altItem !== null) {
                  try {
                    const altParsed = JSON.parse(altItem);
                    if (isExpectingArray) {
                      if (Array.isArray(altParsed)) {
                        localStorage.setItem(key, altItem);
                        return altParsed as unknown as T;
                      }
                    } else if (altParsed !== null && altParsed !== undefined) {
                      localStorage.setItem(key, altItem);
                      return altParsed as unknown as T;
                    }
                  } catch {}
                }
              }

              // 2. Check legacy un-scoped baseKey fallback
              const legacyItem = localStorage.getItem(baseKey);
              if (legacyItem !== null) {
                try {
                  const legacyParsed = JSON.parse(legacyItem);
                  if (isExpectingArray) {
                    if (Array.isArray(legacyParsed)) {
                      localStorage.setItem(key, legacyItem);
                      return legacyParsed as unknown as T;
                    }
                  } else if (legacyParsed !== null && legacyParsed !== undefined) {
                    localStorage.setItem(key, legacyItem);
                    return legacyParsed as unknown as T;
                  }
                } catch {}
              }
              break;
            }
          }
        }
      } catch {}
    }

    if (isExpectingArray) {
      return (Array.isArray(defaultVal) ? [...defaultVal] : []) as unknown as T;
    }
    return defaultVal;
  } catch (e) {
    console.error(`Error reading ${key} from localStorage`, e);
    return isExpectingArray ? ([] as unknown as T) : defaultVal;
  }
}

function setStored<T>(key: string, val: T): void {
  try {
    const serialized = JSON.stringify(val);
    localStorage.setItem(key, serialized);

    // Mirror to user.id if key is user-email scoped to guarantee 100% interoperability
    try {
      const rawUser = localStorage.getItem(STORAGE_KEYS.USER);
      if (rawUser) {
        const u = JSON.parse(rawUser);
        if (u && u.id) {
          for (const baseKey of Object.values(STORAGE_KEYS)) {
            if (key.startsWith(baseKey + '_')) {
              const altKey = `${baseKey}_${u.id}`;
              if (altKey !== key) {
                localStorage.setItem(altKey, serialized);
              }
              break;
            }
          }
        }
      }
    } catch {}
  } catch (e) {
    console.error(`Error saving ${key} to localStorage`, e);
  }
}

export const DEFAULT_USER: UserProfile = {
  id: 'usr_new',
  email: 'user@studysphere.ai',
  fullName: 'New Scholar',
  role: 'student',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  createdAt: new Date().toISOString(),
};

// Legacy dummy seed subject IDs to filter out and purge from storage
export const DUMMY_SEED_SUBJECT_IDS = new Set([
  'subj_ds',
  'subj_dbms',
  'subj_cn',
  'subj_os',
  'subj_ai',
  'subj_web',
  'subj_se',
]);

// Initial State - Clean & Empty so users configure their own curriculum
export const INITIAL_SUBJECTS: Subject[] = [];

export const formatChapterLabel = (rawName?: string, chapterNum?: number): string => {
  const num = chapterNum || 1;
  if (!rawName) return `Chapter ${num}`;
  if (/^unit\s*\d+\s*:/i.test(rawName)) {
    return rawName.replace(/^unit\s*(\d+)\s*:/i, 'Chapter $1:');
  }
  if (/^unit\s*\d+/i.test(rawName)) {
    return rawName.replace(/^unit\s*(\d+)/i, 'Chapter $1');
  }
  if (!/^chapter\s*\d+/i.test(rawName)) {
    return `Chapter ${num}: ${rawName}`;
  }
  return rawName;
};

export const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '1.2 MB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const INITIAL_TOPICS: Topic[] = [];

export const INITIAL_MATERIALS: StudyMaterial[] = [];

// Clean initial state for new users
export const INITIAL_TASKS: StudyPlanTask[] = [];
export const INITIAL_WEAK_TOPICS: WeakTopic[] = [];
export const INITIAL_QUIZ_ATTEMPTS: QuizAttempt[] = [];

export const SAMPLE_QUIZ_BANK: QuizQuestion[] = [
  {
    id: 'q1',
    questionText: 'What is the time complexity of searching an element in a balanced Binary Search Tree?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    correctOptionIndex: 1,
    explanation: 'In a balanced BST, the search space is halved at each step, yielding a logarithmic time complexity of O(log n).',
    difficulty: 'easy',
  },
  {
    id: 'q2',
    questionText: 'Which data structure is naturally used for Breadth-First Search (BFS) in a graph?',
    options: ['Stack', 'Queue', 'Priority Queue', 'Array'],
    correctOptionIndex: 1,
    explanation: 'BFS explores vertices level by level, requiring a FIFO Queue to process adjacent nodes in arrival order.',
    difficulty: 'easy',
  },
  {
    id: 'q3',
    questionText: 'What algorithm is best suited to find the single-source shortest path in a graph with non-negative edge weights?',
    options: ['Floyd-Warshall Algorithm', 'Dijkstra Algorithm', 'Bellman-Ford Algorithm', 'Kruskal Algorithm'],
    correctOptionIndex: 1,
    explanation: 'Dijkstra algorithm uses a greedy approach with a priority queue to find single-source shortest paths efficiently when all edge weights are non-negative.',
    difficulty: 'medium',
  },
  {
    id: 'q4',
    questionText: 'A relation is in Boyce-Codd Normal Form (BCNF) if for every non-trivial functional dependency X -> Y:',
    options: ['X is a prime attribute', 'Y is a candidate key', 'X is a super key', 'Y is a prime attribute'],
    correctOptionIndex: 2,
    explanation: 'BCNF requires that for any functional dependency X -> Y, X must be a super key for the relation schema.',
    difficulty: 'hard',
  },
  {
    id: 'q5',
    questionText: 'Which CPU scheduling algorithm guarantees freedom from starvation for all ready processes?',
    options: ['Shortest Job First (SJF)', 'Priority Scheduling', 'Round Robin (RR)', 'First-Come First-Served without time slicing'],
    correctOptionIndex: 2,
    explanation: 'Round Robin uses time-slicing (quantum), ensuring every process receives CPU time periodically, eliminating starvation.',
    difficulty: 'medium',
  },
];

export function getCurrentUserEmailKey(customIdentifier?: string): string {
  try {
    if (customIdentifier) {
      if (customIdentifier.includes('@')) {
        return customIdentifier.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
      }
      return customIdentifier.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');
    }
    const item = localStorage.getItem(STORAGE_KEYS.USER);
    if (item) {
      const u = JSON.parse(item);
      if (u && u.email) {
        return u.email.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
      }
      if (u && u.id) {
        return u.id.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');
      }
    }
  } catch (e) {}
  return 'default_user';
}

export function getCurrentUserId(): string {
  try {
    const item = localStorage.getItem(STORAGE_KEYS.USER);
    if (item) {
      const u = JSON.parse(item);
      if (u && u.email) return u.email;
      if (u && u.id) return u.id;
    }
  } catch (e) {}
  return 'default';
}

export function userKey(baseKey: string, customUserId?: string): string {
  const emailSlug = getCurrentUserEmailKey(customUserId);
  return `${baseKey}_${emailSlug}`;
}

export const DataStore = {
  getUser(): UserProfile | null {
    try {
      const item = localStorage.getItem(STORAGE_KEYS.USER);
      if (!item) return null;
      const u = JSON.parse(item);
      if (u && u.email) {
        const emailKey = u.email.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
        const emailProfile = localStorage.getItem(`studysphere_profile_${emailKey}`);
        if (emailProfile) {
          try {
            const ep = JSON.parse(emailProfile);
            return { ...u, ...ep };
          } catch {}
        }
      }
      return u;
    } catch (e) {
      return null;
    }
  },
  getActiveUser(): UserProfile {
    return this.getUser() || DEFAULT_USER;
  },
  setUser(user: UserProfile): void {
    setStored(STORAGE_KEYS.USER, user);
    if (user && user.email) {
      const emailKey = user.email.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
      try {
        localStorage.setItem(`studysphere_profile_${emailKey}`, JSON.stringify(user));
        const registered = getStored<Record<string, UserProfile>>('studysphere_registered_users', {});
        registered[emailKey] = user;
        registered[user.id] = user;
        setStored('studysphere_registered_users', registered);
      } catch {}
    }
  },
  clearActiveSession(): void {
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  initializeNewUser(profile: UserProfile): void {
    // 1. Set current user
    setStored(STORAGE_KEYS.USER, profile);

    // 2. Index in registered users directory
    const registered = getStored<Record<string, UserProfile>>('studysphere_registered_users', {});
    const emailKey = profile.email.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
    registered[profile.id] = profile;
    registered[emailKey] = profile;
    setStored('studysphere_registered_users', registered);

    const uid = profile.email || profile.id;

    // 3. Safeguard: Only initialize collections if NO previous data exists for this email!
    // This guarantees that an existing user's data is NEVER wiped or reset!
    const existingAttempts = getStored<QuizAttempt[]>(userKey(STORAGE_KEYS.QUIZ_ATTEMPTS, uid), []);
    if (existingAttempts.length === 0) {
      setStored(userKey(STORAGE_KEYS.QUIZ_ATTEMPTS, uid), []);
    }

    const existingSubjects = getStored<Subject[]>(userKey(STORAGE_KEYS.SUBJECTS, uid), []);
    const cleanSubjects = (Array.isArray(existingSubjects) ? existingSubjects : []).filter(
      (s) => s && s.id && !DUMMY_SEED_SUBJECT_IDS.has(s.id)
    );
    setStored(userKey(STORAGE_KEYS.SUBJECTS, uid), cleanSubjects);

    const existingTopics = getStored<Topic[]>(userKey(STORAGE_KEYS.TOPICS, uid), []);
    const cleanTopics = (Array.isArray(existingTopics) ? existingTopics : []).filter(
      (t) => t && t.subjectId && !DUMMY_SEED_SUBJECT_IDS.has(t.subjectId)
    );
    setStored(userKey(STORAGE_KEYS.TOPICS, uid), cleanTopics);

    const existingTasks = getStored<StudyPlanTask[]>(userKey(STORAGE_KEYS.STUDY_PLANS, uid), []);
    if (existingTasks.length === 0) {
      setStored(userKey(STORAGE_KEYS.STUDY_PLANS, uid), []);
    }

    const existingWeak = getStored<WeakTopic[]>(userKey(STORAGE_KEYS.WEAK_TOPICS, uid), []);
    if (existingWeak.length === 0) {
      setStored(userKey(STORAGE_KEYS.WEAK_TOPICS, uid), []);
    }

    const existingMaterials = getStored<StudyMaterial[]>(userKey(STORAGE_KEYS.MATERIALS, uid), []);
    if (existingMaterials.length === 0) {
      setStored(userKey(STORAGE_KEYS.MATERIALS, uid), []);
    }

    const existingPdfs = getStored<AnalyzedPDFRecord[]>(userKey(STORAGE_KEYS.ANALYZED_PDFS, uid), []);
    if (existingPdfs.length === 0) {
      setStored(userKey(STORAGE_KEYS.ANALYZED_PDFS, uid), []);
    }

    const existingProgress = getStored<Record<string, number>>(userKey('studysphere_user_progress', uid), {});
    if (Object.keys(existingProgress).length === 0) {
      setStored(userKey('studysphere_user_progress', uid), {});
    }

    // 4. AI Conversations
    const existingConvs = getStored<AIConversation[]>(userKey(STORAGE_KEYS.CONVERSATIONS, uid), []);
    if (existingConvs.length === 0) {
      const freshConv: AIConversation = {
        id: `conv_${emailKey}_${Date.now()}`,
        userId: profile.id,
        title: 'Study Assistant Session',
        updatedAt: new Date().toISOString(),
        messages: [],
      };
      setStored(userKey(STORAGE_KEYS.CONVERSATIONS, uid), [freshConv]);
    }
  },

  getSubjects(customUserId?: string): Subject[] {
    const uid = customUserId || getCurrentUserId();
    const rawSubjects = getStored<Subject[]>(userKey(STORAGE_KEYS.SUBJECTS, uid), []);
    const cleanSubjects = (Array.isArray(rawSubjects) ? rawSubjects : []).filter(
      (s) => s && s.id && !DUMMY_SEED_SUBJECT_IDS.has(s.id)
    );
    // Self-healing migration: If dummy seed subjects were present in user storage, overwrite with cleaned list
    if (Array.isArray(rawSubjects) && rawSubjects.length !== cleanSubjects.length) {
      setStored(userKey(STORAGE_KEYS.SUBJECTS, uid), cleanSubjects);
    }
    // Also clean up any un-scoped legacy subjects key in localStorage
    try {
      const legacyRaw = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
      if (legacyRaw) {
        const legacyParsed = JSON.parse(legacyRaw);
        if (Array.isArray(legacyParsed)) {
          const cleanedLegacy = legacyParsed.filter((s: any) => s && s.id && !DUMMY_SEED_SUBJECT_IDS.has(s.id));
          localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(cleanedLegacy));
        }
      }
    } catch {}

    const progressMap = getStored<Record<string, number>>(userKey('studysphere_user_progress', uid), {});
    const safeProgress = (progressMap && typeof progressMap === 'object') ? progressMap : {};
    return cleanSubjects.map((s) => ({
      ...s,
      progressPercentage: safeProgress[s.id] || 0,
    }));
  },
  addSubject(subject: Subject): void {
    const uid = getCurrentUserId();
    const list = this.getSubjects(uid);
    list.unshift(subject);
    setStored(userKey(STORAGE_KEYS.SUBJECTS, uid), list);
    syncSubjectToSupabase(subject).catch((e) => console.warn('Supabase subject sync:', e));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('studysphere:subjects_update'));
    }
  },
  updateSubject(subject: Subject): void {
    const uid = getCurrentUserId();
    const list = this.getSubjects(uid);
    const idx = list.findIndex((s) => s.id === subject.id);
    if (idx >= 0) {
      list[idx] = subject;
    } else {
      list.unshift(subject);
    }
    setStored(userKey(STORAGE_KEYS.SUBJECTS, uid), list);
    syncSubjectToSupabase(subject).catch((e) => console.warn('Supabase subject sync:', e));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('studysphere:subjects_update'));
    }
  },
  deleteSubject(subjectId: string): void {
    const uid = getCurrentUserId();
    const rawSubjects = this.getSubjects(uid);
    const subjects = (Array.isArray(rawSubjects) ? rawSubjects : []).filter((s) => s && s.id !== subjectId);
    setStored(userKey(STORAGE_KEYS.SUBJECTS, uid), subjects);

    const rawTopics = this.getTopics();
    const topics = (Array.isArray(rawTopics) ? rawTopics : []).filter((t) => t && t.subjectId !== subjectId);
    setStored(userKey(STORAGE_KEYS.TOPICS, uid), topics);

    const rawMaterials = this.getMaterials();
    const materials = (Array.isArray(rawMaterials) ? rawMaterials : []).filter((m) => m && m.subjectId !== subjectId);
    setStored(userKey(STORAGE_KEYS.MATERIALS, uid), materials);

    deleteSubjectFromSupabase(subjectId).catch((e) => console.warn('Supabase subject delete:', e));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('studysphere:subjects_update'));
    }
  },

  getTopics(subjectId?: string): Topic[] {
    const uid = getCurrentUserId();
    const rawList = getStored<Topic[]>(userKey(STORAGE_KEYS.TOPICS, uid), []);
    const cleanTopics = (Array.isArray(rawList) ? rawList : []).filter(
      (t) => t && t.subjectId && !DUMMY_SEED_SUBJECT_IDS.has(t.subjectId)
    );
    // Self-healing migration: If dummy seed topics were present in user storage, overwrite with cleaned list
    if (Array.isArray(rawList) && rawList.length !== cleanTopics.length) {
      setStored(userKey(STORAGE_KEYS.TOPICS, uid), cleanTopics);
    }
    // Also clean un-scoped legacy key if present
    try {
      const legacyRaw = localStorage.getItem(STORAGE_KEYS.TOPICS);
      if (legacyRaw) {
        const legacyParsed = JSON.parse(legacyRaw);
        if (Array.isArray(legacyParsed)) {
          const cleanedLegacy = legacyParsed.filter((t: any) => t && t.subjectId && !DUMMY_SEED_SUBJECT_IDS.has(t.subjectId));
          localStorage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify(cleanedLegacy));
        }
      }
    } catch {}

    const normalized = cleanTopics.map((t) => ({
      ...t,
      unitName: formatChapterLabel(t.unitName, t.unitNumber),
    }));
    return subjectId ? normalized.filter((t) => t.subjectId === subjectId) : normalized;
  },
  addTopics(newTopics: Topic[]): void {
    const uid = getCurrentUserId();
    const list = this.getTopics();
    setStored(userKey(STORAGE_KEYS.TOPICS, uid), [...newTopics, ...list]);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('studysphere:subjects_update'));
    }
  },
  deleteChapter(subjectId: string, chapterNumber: number, documentId?: string): void {
    const uid = getCurrentUserId();
    const rawTopics = this.getTopics();
    const updatedTopics = rawTopics.filter((t) => {
      if (t.subjectId !== subjectId) return true;
      if (Number(t.unitNumber) !== Number(chapterNumber)) return true;
      if (documentId && (t.documentId || 'core') !== documentId) return true;
      return false;
    });
    setStored(userKey(STORAGE_KEYS.TOPICS, uid), updatedTopics);

    // Update subject counts
    const remainingForSubject = updatedTopics.filter((t) => t.subjectId === subjectId);
    const remainingChapters = new Set(remainingForSubject.map((t) => `${t.documentId || 'core'}_${t.unitNumber}`));
    const subjects = this.getSubjects(uid);
    const idx = subjects.findIndex((s) => s.id === subjectId);
    if (idx >= 0) {
      subjects[idx].topicCount = remainingForSubject.length;
      subjects[idx].unitsCount = remainingChapters.size;
      setStored(userKey(STORAGE_KEYS.SUBJECTS, uid), subjects);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('studysphere:subjects_update'));
    }
  },
  deleteDocument(subjectId: string, documentId: string): void {
    const uid = getCurrentUserId();
    const rawTopics = this.getTopics();
    const updatedTopics = rawTopics.filter(
      (t) => !(t.subjectId === subjectId && (t.documentId === documentId || (!t.documentId && documentId === 'core')))
    );
    setStored(userKey(STORAGE_KEYS.TOPICS, uid), updatedTopics);

    const subjects = this.getSubjects(uid);
    const idx = subjects.findIndex((s) => s.id === subjectId);
    if (idx >= 0) {
      const remainingForSubject = updatedTopics.filter((t) => t.subjectId === subjectId);
      const remainingChapters = new Set(remainingForSubject.map((t) => `${t.documentId || 'core'}_${t.unitNumber}`));
      subjects[idx].topicCount = remainingForSubject.length;
      subjects[idx].unitsCount = remainingChapters.size;
      if (subjects[idx].documents) {
        subjects[idx].documents = subjects[idx].documents.filter((d) => d.id !== documentId);
      }
      setStored(userKey(STORAGE_KEYS.SUBJECTS, uid), subjects);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('studysphere:subjects_update'));
    }
  },
  deleteTopic(topicId: string): void {
    const uid = getCurrentUserId();
    const rawTopics = this.getTopics();
    const targetTopic = rawTopics.find((t) => t.id === topicId);
    const updatedTopics = rawTopics.filter((t) => t.id !== topicId);
    setStored(userKey(STORAGE_KEYS.TOPICS, uid), updatedTopics);

    if (targetTopic) {
      const remainingForSubject = updatedTopics.filter((t) => t.subjectId === targetTopic.subjectId);
      const remainingChapters = new Set(remainingForSubject.map((t) => `${t.documentId || 'core'}_${t.unitNumber}`));
      const subjects = this.getSubjects(uid);
      const idx = subjects.findIndex((s) => s.id === targetTopic.subjectId);
      if (idx >= 0) {
        subjects[idx].topicCount = remainingForSubject.length;
        subjects[idx].unitsCount = remainingChapters.size;
        setStored(userKey(STORAGE_KEYS.SUBJECTS, uid), subjects);
      }
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('studysphere:subjects_update'));
    }
  },

  getMaterials(): StudyMaterial[] {
    const uid = getCurrentUserId();
    const rawList = getStored<StudyMaterial[]>(userKey(STORAGE_KEYS.MATERIALS, uid), []);
    const userList = Array.isArray(rawList) ? rawList : [];
    const rawDeleted = getStored<string[]>('studysphere_deleted_materials', []);
    const deletedIds = new Set(Array.isArray(rawDeleted) ? rawDeleted : []);

    // Clear legacy global key so no old dummy materials leak across users
    try {
      localStorage.removeItem(STORAGE_KEYS.MATERIALS);
    } catch {}

    // Strictly user-private: only return materials uploaded by this user,
    // excluding any demo or dummy materials (mat_1, mat_2, demo_*)
    const sanitized = userList
      .filter((m) => {
        if (!m || !m.id) return false;
        if (deletedIds.has(m.id)) return false;
        if (m.id === 'mat_1' || m.id === 'mat_2' || m.id.startsWith('demo_')) return false;
        // If uploadedBy is tagged, verify it belongs to this user or current session
        if (m.uploadedBy && m.uploadedBy !== uid && m.uploadedBy !== 'self') return false;
        return true;
      })
      .map((m) => {
        // If legacy material has large Base64 in fileUrl, migrate to IndexedDB and sanitize
        if (m.fileUrl && m.fileUrl.startsWith('data:') && m.fileUrl.length > 500) {
          PDFStorage.savePDF({
            id: m.id,
            name: m.title,
            dataUrl: m.fileUrl,
            mimeType: 'application/pdf',
            size: m.fileUrl.length,
            uploadedAt: m.createdAt,
          }).catch(() => {});
          return {
            ...m,
            fileUrl: `#indexeddb_${m.id}`,
          };
        }
        return m;
      });

    setStored(userKey(STORAGE_KEYS.MATERIALS, uid), sanitized);
    return sanitized;
  },

  saveMaterials(materials: StudyMaterial[]): void {
    const uid = getCurrentUserId();
    setStored(userKey(STORAGE_KEYS.MATERIALS, uid), materials);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('studysphere:materials_update'));
      try {
        localStorage.setItem('studysphere_sync_tick', Date.now().toString());
      } catch {}
    }
  },

  addMaterial(mat: StudyMaterial): void {
    const uid = getCurrentUserId();
    // If it was marked as deleted previously, unmark it
    const deletedList = getStored<string[]>('studysphere_deleted_materials', []);
    if (deletedList.includes(mat.id)) {
      setStored('studysphere_deleted_materials', deletedList.filter((d) => d !== mat.id));
    }

    const list = this.getMaterials();
    // Guarantee no bloated base64 string in localStorage metadata & tag with user ID!
    const sanitizedMat: StudyMaterial = {
      ...mat,
      uploadedBy: uid, // Strictly private to this user
      fileUrl: mat.fileUrl && mat.fileUrl.startsWith('data:') ? `#indexeddb_${mat.id}` : mat.fileUrl,
    };
    const filtered = list.filter((m) => m.id !== sanitizedMat.id);
    const updated = [sanitizedMat, ...filtered];
    setStored(userKey(STORAGE_KEYS.MATERIALS, uid), updated);

    // Cloud sync to Supabase (study_materials table)
    syncMaterialToSupabase(sanitizedMat).catch((e) => console.warn('Supabase material sync error:', e));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('studysphere:materials_update', { detail: sanitizedMat }));
      try {
        localStorage.setItem('studysphere_sync_tick', Date.now().toString());
      } catch {}
    }
  },

  deleteMaterial(id: string): void {
    const uid = getCurrentUserId();
    // 1. Record ID in persistent deleted blacklist to prevent resurrection
    const deletedList = getStored<string[]>('studysphere_deleted_materials', []);
    if (!deletedList.includes(id)) {
      deletedList.push(id);
      setStored('studysphere_deleted_materials', deletedList);
    }

    // 2. Remove from user list
    const currentList = this.getMaterials();
    const updatedList = currentList.filter((m) => m.id !== id);
    setStored(userKey(STORAGE_KEYS.MATERIALS, uid), updatedList);

    // 3. Remove binary file from IndexedDB
    PDFStorage.deletePDF(id).catch(() => {});

    // 4. Also delete any notification associated with this PDF so students don't see a broken notice
    const notifs = getStored<TeacherNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const filteredNotifs = notifs.filter((n) => n.materialId !== id && n.id !== `notif_${id}`);
    setStored(STORAGE_KEYS.NOTIFICATIONS, filteredNotifs);

    // 5. Cloud sync deletion to Supabase (study_materials table)
    deleteMaterialFromSupabase(id).catch((e) => console.warn('Supabase material delete error:', e));

    // 6. Broadcast real-time events across windows & tabs
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('studysphere:materials_update', { detail: { id, deleted: true } }));
      window.dispatchEvent(new CustomEvent('studysphere:notification_update'));
      try {
        localStorage.setItem('studysphere_sync_tick', Date.now().toString());
      } catch {}
    }
  },

  getTasks(): StudyPlanTask[] {
    const raw = getStored<StudyPlanTask[]>(userKey(STORAGE_KEYS.STUDY_PLANS), INITIAL_TASKS);
    return Array.isArray(raw) ? raw : INITIAL_TASKS;
  },
  saveTask(task: StudyPlanTask): void {
    const tasks = this.getTasks();
    const index = tasks.findIndex((t) => t.id === task.id);
    if (index >= 0) {
      tasks[index] = task;
    } else {
      tasks.unshift(task);
    }
    setStored(userKey(STORAGE_KEYS.STUDY_PLANS), tasks);
    // Cloud sync to Supabase (study_plans table)
    syncTaskToSupabase(task).catch((e) => console.warn('Supabase task sync error:', e));
  },
  deleteTask(taskId: string): void {
    const rawTasks = this.getTasks();
    const tasks = (Array.isArray(rawTasks) ? rawTasks : []).filter((t) => t && t.id !== taskId);
    setStored(userKey(STORAGE_KEYS.STUDY_PLANS), tasks);
    // Cloud sync deletion to Supabase (study_plans table)
    deleteTaskFromSupabase(taskId).catch((e) => console.warn('Supabase task delete error:', e));
  },

  getWeakTopics(): WeakTopic[] {
    const raw = getStored<WeakTopic[]>(userKey(STORAGE_KEYS.WEAK_TOPICS), INITIAL_WEAK_TOPICS);
    return Array.isArray(raw) ? raw : INITIAL_WEAK_TOPICS;
  },
  recordWeakTopic(subjectId: string, subjectName: string, topicId: string, topicName: string, scorePct: number): void {
    const list = this.getWeakTopics();
    const existingIndex = list.findIndex((w) => w.topicName === topicName || w.topicId === topicId);
    
    if (scorePct < 60) {
      if (existingIndex >= 0) {
        list[existingIndex].accuracyPercentage = scorePct;
        list[existingIndex].errorCount += 1;
        list[existingIndex].lastAttempted = new Date().toISOString();
        list[existingIndex].status = scorePct < 50 ? 'critical' : 'moderate';
      } else {
        list.unshift({
          id: `wt_${Date.now()}`,
          userId: getCurrentUserId(),
          subjectId,
          subjectName,
          topicId: topicId || `top_${Date.now()}`,
          topicName,
          accuracyPercentage: scorePct,
          errorCount: 1,
          lastAttempted: new Date().toISOString(),
          status: scorePct < 50 ? 'critical' : 'moderate',
        });
      }
    } else if (existingIndex >= 0) {
      list[existingIndex].accuracyPercentage = scorePct;
      list[existingIndex].status = 'improved';
    }
    setStored(userKey(STORAGE_KEYS.WEAK_TOPICS), list);

    const updatedWeak = list.find((w) => w.topicName === topicName || w.topicId === topicId);
    if (updatedWeak) {
      syncWeakTopicToSupabase(updatedWeak).catch((e) => console.warn('Supabase weak topic sync error:', e));
    }
  },

  getQuizAttempts(): QuizAttempt[] {
    const raw = getStored<QuizAttempt[]>(userKey(STORAGE_KEYS.QUIZ_ATTEMPTS), INITIAL_QUIZ_ATTEMPTS);
    return Array.isArray(raw) ? raw : INITIAL_QUIZ_ATTEMPTS;
  },
  recordQuizAttempt(attempt: QuizAttempt): void {
    const list = this.getQuizAttempts();
    list.unshift(attempt);
    setStored(userKey(STORAGE_KEYS.QUIZ_ATTEMPTS), list);

    // Update user-scoped subject progress
    const progressMap = getStored<Record<string, number>>(userKey('studysphere_user_progress'), {});
    progressMap[attempt.subjectId] = Math.min(100, Math.max(progressMap[attempt.subjectId] || 0, attempt.scorePercentage));
    setStored(userKey('studysphere_user_progress'), progressMap);

    this.recordWeakTopic(
      attempt.subjectId,
      attempt.subjectName,
      attempt.topicId || '',
      attempt.topicTitle,
      attempt.scorePercentage
    );

    // Cloud sync to Supabase (quiz_attempts table)
    syncQuizAttemptToSupabase(attempt).catch((e) => console.warn('Supabase quiz attempt sync error:', e));
  },

  getConversations(): AIConversation[] {
    const uid = getCurrentUserId();
    const defaultConv: AIConversation = {
      id: `conv_${uid}_initial`,
      userId: uid,
      title: 'Study Assistant Session',
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    const raw = getStored<AIConversation[]>(userKey(STORAGE_KEYS.CONVERSATIONS), [defaultConv]);
    return Array.isArray(raw) ? raw : [defaultConv];
  },
  saveConversations(conversations: AIConversation[]): void {
    setStored(userKey(STORAGE_KEYS.CONVERSATIONS), conversations);
  },
  saveConversation(conv: AIConversation): void {
    const list = this.getConversations();
    const idx = list.findIndex((c) => c.id === conv.id);
    if (idx >= 0) {
      list[idx] = conv;
    } else {
      list.unshift(conv);
    }
    setStored(userKey(STORAGE_KEYS.CONVERSATIONS), list);

    // Cloud sync to Supabase (ai_conversations & ai_messages tables)
    if (conv.messages && conv.messages.length > 0) {
      const lastMsg = conv.messages[conv.messages.length - 1];
      syncAIMessageToSupabase(conv.id, conv.title, lastMsg).catch((e) => console.warn('Supabase AI message sync error:', e));
    }
  },

  /**
   * Bidirectional cloud sync with Supabase:
   * Pulls remote study materials, tasks, quiz attempts, and weak topics
   * and merges them into the active workspace.
   */
  async syncRemoteData(): Promise<void> {
    try {
      const uid = getCurrentUserId();

      // 1. Sync remote materials
      const remoteMats = await fetchMaterialsFromSupabase();
      if (remoteMats && remoteMats.length > 0) {
        const deletedList = new Set(getStored<string[]>('studysphere_deleted_materials', []));
        const currentList = this.getMaterials();
        const map = new Map<string, StudyMaterial>();

        currentList.forEach((m) => {
          if (!deletedList.has(m.id)) map.set(m.id, m);
        });

        let updated = false;
        remoteMats.forEach((rm: any) => {
          // Strictly only merge materials owned by this specific user
          const isOwner = rm.user_id === uid || rm.uploadedBy === uid;
          if (isOwner && !deletedList.has(rm.id) && rm.id !== 'mat_1' && rm.id !== 'mat_2' && !map.has(rm.id)) {
            map.set(rm.id, rm);
            updated = true;
          }
        });

        if (updated) {
          const merged = Array.from(map.values());
          setStored(userKey(STORAGE_KEYS.MATERIALS, uid), merged);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('studysphere:materials_update'));
          }
        }
      }

      // 2. Sync remote study plan tasks
      const remoteTasks = await fetchTasksFromSupabase();
      if (remoteTasks && remoteTasks.length > 0) {
        const localTasks = this.getTasks();
        const taskMap = new Map<string, StudyPlanTask>();
        localTasks.forEach((t) => taskMap.set(t.id, t));
        remoteTasks.forEach((rt) => {
          if (!taskMap.has(rt.id)) taskMap.set(rt.id, rt);
        });
        setStored(userKey(STORAGE_KEYS.STUDY_PLANS), Array.from(taskMap.values()));
      }

      // 3. Sync remote quiz attempts
      const remoteAttempts = await fetchQuizAttemptsFromSupabase();
      if (remoteAttempts && remoteAttempts.length > 0) {
        const localAttempts = this.getQuizAttempts();
        const attemptMap = new Map<string, QuizAttempt>();
        localAttempts.forEach((a) => attemptMap.set(a.id, a));
        remoteAttempts.forEach((ra) => {
          if (!attemptMap.has(ra.id)) attemptMap.set(ra.id, ra);
        });
        setStored(userKey(STORAGE_KEYS.QUIZ_ATTEMPTS), Array.from(attemptMap.values()));
      }

      // 4. Sync remote weak topics
      const remoteWeak = await fetchWeakTopicsFromSupabase();
      if (remoteWeak && remoteWeak.length > 0) {
        const localWeak = this.getWeakTopics();
        const weakMap = new Map<string, WeakTopic>();
        localWeak.forEach((w) => weakMap.set(w.id, w));
        remoteWeak.forEach((rw) => {
          if (!weakMap.has(rw.id)) weakMap.set(rw.id, rw);
        });
        setStored(userKey(STORAGE_KEYS.WEAK_TOPICS), Array.from(weakMap.values()));
      }
    } catch (err) {
      console.warn('DataStore remote sync notice:', err);
    }
  },


  getAnalyzedPDFs(): AnalyzedPDFRecord[] {
    return getStored<AnalyzedPDFRecord[]>(userKey(STORAGE_KEYS.ANALYZED_PDFS), []);
  },
  getLatestAnalyzedPDF(): AnalyzedPDFRecord | null {
    const list = this.getAnalyzedPDFs();
    return list.length > 0 ? list[0] : null;
  },
  saveAnalyzedPDF(doc: AnalyzedPDFRecord): void {
    const list = this.getAnalyzedPDFs();
    const idx = list.findIndex((d) => d.id === doc.id || d.filename === doc.filename);
    if (idx >= 0) {
      list[idx] = doc;
    } else {
      list.unshift(doc);
    }
    setStored(userKey(STORAGE_KEYS.ANALYZED_PDFS), list);
  },
  deleteAnalyzedPDF(id: string): void {
    const rawList = this.getAnalyzedPDFs();
    const list = (Array.isArray(rawList) ? rawList : []).filter((d) => d && d.id !== id);
    setStored(userKey(STORAGE_KEYS.ANALYZED_PDFS), list);
  },

  getStatsSummary() {
    const rawAttempts = this.getQuizAttempts();
    const attempts = Array.isArray(rawAttempts) ? rawAttempts : [];
    const rawTasks = this.getTasks();
    const tasks = Array.isArray(rawTasks) ? rawTasks : [];
    const rawSubjects = this.getSubjects();
    const subjects = Array.isArray(rawSubjects) ? rawSubjects : [];

    const taskHours = tasks.filter((t) => t && t.isCompleted).reduce((acc, t) => acc + ((t.durationMins || t.duration || 30) / 60), 0);
    const quizHours = attempts.reduce((acc, a) => acc + (a && a.timeTakenSeconds > 0 ? a.timeTakenSeconds / 3600 : 0.25), 0);
    const totalHours = Math.round((taskHours + quizHours) * 10) / 10;

    const activeStreak = attempts.length > 0 || tasks.some((t) => t && t.isCompleted) ? Math.min(14, Math.max(1, attempts.length)) : 0;
    const longestStreak = Math.max(activeStreak, attempts.length > 0 ? 14 : 0);

    const quizAccuracyAvg = attempts.length > 0
      ? Math.round(attempts.reduce((acc, a) => acc + (a ? (a.scorePercentage || (a as any).percentage || 0) : 0), 0) / attempts.length)
      : 0;

    const completedTasksCount = tasks.filter((t) => t && t.isCompleted).length;
    const masteredTopicsCount = new Set(attempts.filter((a) => a && (a.scorePercentage || (a as any).percentage || 0) >= 60).map((a) => a.topicTitle)).size;
    const totalTopicsCount = subjects.reduce((acc, s) => acc + ((s && s.topicCount) || 10), 0);
    const topicsCompleted = Math.min(totalTopicsCount, completedTasksCount + masteredTopicsCount);

    return {
      weeklyStudyHours: totalHours > 0 ? totalHours : 0,
      totalHours: totalHours > 0 ? totalHours : 0,
      activeStreak,
      longestStreak,
      quizAccuracyAvg,
      topicsCompleted,
      totalTopicsCount: totalTopicsCount || 85,
    };
  },

  getNotifications(): TeacherNotification[] {
    const rawList = getStored<TeacherNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const safeList = Array.isArray(rawList) ? rawList : [];
    const list = safeList.filter((n) => n && n.materialId !== 'mat_1' && n.materialId !== 'mat_2' && n.id !== 'notif_mat_1' && n.id !== 'notif_mat_2');
    return list;
  },

  addNotification(notif: TeacherNotification): void {
    const rawList = getStored<TeacherNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const safeList = Array.isArray(rawList) ? rawList : [];
    const filtered = safeList.filter((n) => n && n.id !== notif.id);
    const updated = [notif, ...filtered];
    setStored(STORAGE_KEYS.NOTIFICATIONS, updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('studysphere:notification', { detail: notif }));
    }
  },

  markNotificationAsRead(id: string): void {
    const list = this.getNotifications();
    const updated = list.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    setStored(STORAGE_KEYS.NOTIFICATIONS, updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('studysphere:notification_update'));
    }
  },

  markAllNotificationsAsRead(): void {
    const list = this.getNotifications();
    const updated = list.map((n) => ({ ...n, isRead: true }));
    setStored(STORAGE_KEYS.NOTIFICATIONS, updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('studysphere:notification_update'));
    }
  },

  clearNotifications(): void {
    setStored(STORAGE_KEYS.NOTIFICATIONS, []);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('studysphere:notification_update'));
    }
  },

  getFeedbackList(): UserFeedback[] {
    return getStored<UserFeedback[]>('studysphere_user_feedback', []);
  },

  saveFeedback(feedback: UserFeedback): void {
    const list = this.getFeedbackList();
    const updated = [feedback, ...list];
    setStored('studysphere_user_feedback', updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('studysphere:feedback_submitted', { detail: feedback }));
    }
    // Asynchronously synchronize directly to Supabase table
    syncFeedbackToSupabase(feedback).catch((err) => {
      console.warn('DataStore Supabase feedback sync note:', err);
    });
  },

  async syncFeedbacksFromSupabase(): Promise<UserFeedback[]> {
    try {
      const remote = await fetchFeedbacksFromSupabase();
      if (remote && remote.length > 0) {
        setStored('studysphere_user_feedback', remote);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('studysphere:feedback_update'));
        }
        return remote;
      }
    } catch {}
    return this.getFeedbackList();
  },
};
