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

// Initial Seed Subjects (Available to all users)
export const INITIAL_SUBJECTS: Subject[] = [
  {
    id: 'subj_ds',
    name: 'Data Structures',
    code: 'CS-201',
    description: 'Fundamental data organization, linear & non-linear structures, algorithmic efficiency.',
    icon: 'Network',
    progressPercentage: 0,
    topicCount: 16,
    unitsCount: 4,
    color: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'subj_dbms',
    name: 'Database Management',
    code: 'CS-202',
    description: 'Relational databases, SQL, ER modeling, normalization, transaction processing, and indexing.',
    icon: 'Database',
    progressPercentage: 0,
    topicCount: 14,
    unitsCount: 4,
    color: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'subj_cn',
    name: 'Computer Networks',
    code: 'CS-301',
    description: 'OSI model, TCP/IP stack, routing protocols, wireless networking, and network security.',
    icon: 'Wifi',
    progressPercentage: 0,
    topicCount: 12,
    unitsCount: 4,
    color: 'from-blue-600 to-indigo-700',
  },
  {
    id: 'subj_os',
    name: 'Operating Systems',
    code: 'CS-302',
    description: 'Process management, memory allocation, deadlocks, file systems, and concurrency primitives.',
    icon: 'Cpu',
    progressPercentage: 0,
    topicCount: 15,
    unitsCount: 4,
    color: 'from-amber-500 to-orange-600',
  },
  {
    id: 'subj_ai',
    name: 'Artificial Intelligence',
    code: 'CS-401',
    description: 'Search algorithms, knowledge representation, machine learning basics, neural networks, and NLP.',
    icon: 'Bot',
    progressPercentage: 0,
    topicCount: 18,
    unitsCount: 4,
    color: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'subj_web',
    name: 'Web Development',
    code: 'CS-205',
    description: 'Modern full-stack web architectures, REST APIs, asynchronous UI frameworks, and state management.',
    icon: 'Globe',
    progressPercentage: 0,
    topicCount: 14,
    unitsCount: 4,
    color: 'from-pink-500 to-rose-600',
  },
  {
    id: 'subj_se',
    name: 'Software Engineering',
    code: 'CS-305',
    description: 'Agile methodologies, software architecture patterns, CI/CD, testing paradigms, and design patterns.',
    icon: 'Layers',
    progressPercentage: 0,
    topicCount: 12,
    unitsCount: 4,
    color: 'from-slate-600 to-blue-700',
  },
];

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

export const INITIAL_TOPICS: Topic[] = [
  {
    id: 'top_ds_1',
    subjectId: 'subj_ds',
    unitNumber: 1,
    unitName: 'Chapter 1: Linear Data Structures',
    title: 'Arrays & Singly Linked Lists',
    description: 'Memory representation, traversal, insertion, deletion, and time complexity comparisons.',
    notesContent: '### Arrays vs Linked Lists\n- **Arrays**: Contiguous memory allocation, O(1) random access, O(n) insertion/deletion.\n- **Linked Lists**: Dynamic memory nodes connected by pointers, O(n) access, O(1) insertion at pointer.\n\n```python\nclass Node:\n    def __init__(self, val):\n        self.val = val\n        self.next = None\n```',
    durationMins: 45,
    difficulty: 'easy',
    questionsCount: 5,
    diagramSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 220" width="100%" height="100%"><rect width="680" height="220" rx="16" fill="#0b0f19"/><text x="30" y="35" fill="#38bdf8" font-size="13" font-weight="bold" font-family="sans-serif">ARRAY: Contiguous Memory Blocks [O(1) Random Access]</text><g transform="translate(30, 48)"><rect x="0" y="0" width="85" height="48" rx="8" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5"/><text x="42" y="27" fill="#f8fafc" font-size="12" font-weight="bold" text-anchor="middle">Val: 10</text><text x="42" y="42" fill="#94a3b8" font-size="10" text-anchor="middle">Idx: 0</text><rect x="90" y="0" width="85" height="48" rx="8" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5"/><text x="132" y="27" fill="#f8fafc" font-size="12" font-weight="bold" text-anchor="middle">Val: 20</text><text x="132" y="42" fill="#94a3b8" font-size="10" text-anchor="middle">Idx: 1</text><rect x="180" y="0" width="85" height="48" rx="8" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5"/><text x="222" y="27" fill="#f8fafc" font-size="12" font-weight="bold" text-anchor="middle">Val: 30</text><text x="222" y="42" fill="#94a3b8" font-size="10" text-anchor="middle">Idx: 2</text><rect x="270" y="0" width="85" height="48" rx="8" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5"/><text x="312" y="27" fill="#f8fafc" font-size="12" font-weight="bold" text-anchor="middle">Val: 40</text><text x="312" y="42" fill="#94a3b8" font-size="10" text-anchor="middle">Idx: 3</text></g><text x="30" y="135" fill="#a855f7" font-size="13" font-weight="bold" font-family="sans-serif">LINKED LIST: Pointer-Chained Heap Nodes [O(1) Insertion at Pointer]</text><g transform="translate(30, 148)"><rect x="0" y="0" width="70" height="44" rx="8" fill="#1e293b" stroke="#a855f7" stroke-width="1.5"/><text x="35" y="26" fill="#f8fafc" font-size="12" font-weight="bold" text-anchor="middle">10 | •</text><line x1="70" y1="22" x2="112" y2="22" stroke="#a855f7" stroke-width="2" marker-end="url(#arr-p)"/><rect x="115" y="0" width="70" height="44" rx="8" fill="#1e293b" stroke="#a855f7" stroke-width="1.5"/><text x="150" y="26" fill="#f8fafc" font-size="12" font-weight="bold" text-anchor="middle">20 | •</text><line x1="185" y1="22" x2="227" y2="22" stroke="#a855f7" stroke-width="2" marker-end="url(#arr-p)"/><rect x="230" y="0" width="70" height="44" rx="8" fill="#1e293b" stroke="#a855f7" stroke-width="1.5"/><text x="265" y="26" fill="#f8fafc" font-size="12" font-weight="bold" text-anchor="middle">30 | •</text><line x1="300" y1="22" x2="342" y2="22" stroke="#a855f7" stroke-width="2" marker-end="url(#arr-p)"/><rect x="345" y="0" width="85" height="44" rx="8" fill="#1e293b" stroke="#ef4444" stroke-width="1.5"/><text x="387" y="26" fill="#fca5a5" font-size="11" font-weight="bold" text-anchor="middle">40 | NULL</text></g><defs><marker id="arr-p" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1 L 10 5 L 0 9 z" fill="#a855f7"/></marker></defs></svg>`,
    diagramCaption: 'Direct comparison: Contiguous sequential memory indices vs Dynamic pointer-linked nodes',
  },
  {
    id: 'top_ds_2',
    subjectId: 'subj_ds',
    unitNumber: 1,
    unitName: 'Chapter 1: Linear Data Structures',
    title: 'Stacks & Queues Applications',
    description: 'LIFO & FIFO operations, expression evaluation, infix to postfix conversion, circular queues.',
    notesContent: '### Stacks (LIFO)\nOperations: push(), pop(), peek(). Used in function call stacks, undo mechanisms, and expression parsing.\n\n### Queues (FIFO)\nOperations: enqueue(), dequeue(). Used in CPU scheduling and BFS tree traversals.',
    durationMins: 50,
    difficulty: 'medium',
    questionsCount: 5,
  },
  {
    id: 'top_ds_3',
    subjectId: 'subj_ds',
    unitNumber: 2,
    unitName: 'Chapter 2: Trees & Binary Search Trees',
    title: 'Tree Traversals & BST Operations',
    description: 'Inorder, Preorder, Postorder traversals, BST insertion, searching, and deletion edge cases.',
    notesContent: '### Binary Search Tree Invariant\nFor every node N: left subtree values < N.val < right subtree values.\n\nInorder traversal of a BST yields elements in strictly sorted ascending order.',
    durationMins: 60,
    difficulty: 'medium',
    questionsCount: 5,
  },
  {
    id: 'top_ds_4',
    subjectId: 'subj_ds',
    unitNumber: 3,
    unitName: 'Chapter 3: Graphs & Shortest Paths',
    title: 'Graph Traversal: BFS, DFS & Dijkstra',
    description: 'Adjacency list representation, Breadth-First Search, Depth-First Search, and shortest path greedy algorithms.',
    notesContent: '### Graph Representation\n- **Adjacency Matrix**: Space O(V^2), lookup O(1)\n- **Adjacency List**: Space O(V + E), lookup O(deg(V))\n\n### Dijkstra Algorithm\nFinds single-source shortest path in graphs with non-negative edge weights using a Min-Priority Queue in O((V + E) log V) time.',
    durationMins: 75,
    difficulty: 'hard',
    questionsCount: 5,
  },
  {
    id: 'top_dbms_1',
    subjectId: 'subj_dbms',
    unitNumber: 1,
    unitName: 'Chapter 1: Relational Model & ER Diagrams',
    title: 'Entity-Relationship Diagrams & Mapping',
    description: 'Entities, attributes, relationships, cardinalities, weak entities, and converting ERD to relational schema.',
    notesContent: '### ER Components\n- **Entity**: Rectangle (e.g. Student, Course)\n- **Attribute**: Oval (e.g. StudentID, Name)\n- **Relationship**: Diamond (e.g. Enrolls_In)\n- **Primary Key**: Underlined attribute',
    durationMins: 40,
    difficulty: 'easy',
    questionsCount: 5,
  },
  {
    id: 'top_dbms_2',
    subjectId: 'subj_dbms',
    unitNumber: 2,
    unitName: 'Chapter 2: SQL & Relational Algebra',
    title: 'Advanced SQL Joins & Aggregations',
    description: 'INNER, LEFT, RIGHT, FULL OUTER joins, GROUP BY, HAVING, subqueries, and window functions.',
    notesContent: '### SQL Join Types\n- `INNER JOIN`: Matching records in both tables\n- `LEFT JOIN`: All records from left table + matched right\n- `GROUP BY`: Aggregates rows sharing column values',
    durationMins: 55,
    difficulty: 'medium',
    questionsCount: 5,
  },
  {
    id: 'top_dbms_3',
    subjectId: 'subj_dbms',
    unitNumber: 3,
    unitName: 'Chapter 3: Database Normalization',
    title: 'Functional Dependencies & 1NF to BCNF',
    description: 'Identifying anomalies, Armstrong axioms, 1NF, 2NF, 3NF, and Boyce-Codd Normal Form decomposition.',
    notesContent: '### Normal Forms Summary\n- **1NF**: Atomic attribute values\n- **2NF**: 1NF + no partial dependency on composite key\n- **3NF**: 2NF + no transitive dependency\n- **BCNF**: For every X -> Y, X must be a super key',
    durationMins: 70,
    difficulty: 'hard',
    questionsCount: 5,
  },
  {
    id: 'top_os_1',
    subjectId: 'subj_os',
    unitNumber: 1,
    unitName: 'Chapter 1: Process Management & CPU Scheduling',
    title: 'CPU Scheduling Algorithms',
    description: 'FCFS, SJF, Priority, Round Robin, Gantt charts, waiting time and turnaround time calculations.',
    notesContent: '### Scheduling Metrics\n- **Turnaround Time** = Completion Time - Arrival Time\n- **Waiting Time** = Turnaround Time - Burst Time\n\n### Round Robin (RR)\nPreemptive scheduling using fixed time quantum (Q). Prevents starvation.',
    durationMins: 50,
    difficulty: 'medium',
    questionsCount: 5,
    diagramSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 200" width="100%" height="100%"><rect width="680" height="200" rx="16" fill="#0b0f19"/><text x="340" y="30" fill="#f8fafc" font-size="13" font-weight="bold" font-family="sans-serif" text-anchor="middle">5-State Process Lifecycle & CPU Scheduling Flow</text><rect x="30" y="70" width="90" height="50" rx="10" fill="#1e293b" stroke="#94a3b8" stroke-width="1.5"/><text x="75" y="100" fill="#f8fafc" font-size="12" font-weight="bold" text-anchor="middle">NEW</text><line x1="120" y1="95" x2="165" y2="95" stroke="#94a3b8" stroke-width="2" marker-end="url(#os-arr)"/><rect x="170" y="70" width="110" height="50" rx="10" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/><text x="225" y="100" fill="#38bdf8" font-size="12" font-weight="bold" text-anchor="middle">READY QUEUE</text><line x1="280" y1="95" x2="330" y2="95" stroke="#38bdf8" stroke-width="2" marker-end="url(#os-arr)"/><rect x="335" y="70" width="115" height="50" rx="10" fill="#1e293b" stroke="#6366f1" stroke-width="2"/><text x="392" y="100" fill="#c7d2fe" font-size="12" font-weight="bold" text-anchor="middle">RUNNING (CPU)</text><path d="M 392 70 C 392 40, 225 40, 225 70" fill="none" stroke="#eab308" stroke-width="1.5" stroke-dasharray="4" marker-end="url(#os-arr-y)"/><text x="308" y="44" fill="#fef08a" font-size="10" text-anchor="middle">Quantum Expired</text><line x1="450" y1="95" x2="520" y2="95" stroke="#10b981" stroke-width="2" marker-end="url(#os-arr-g)"/><rect x="525" y="70" width="125" height="50" rx="10" fill="#1e293b" stroke="#10b981" stroke-width="2"/><text x="587" y="100" fill="#6ee7b7" font-size="12" font-weight="bold" text-anchor="middle">TERMINATED</text><path d="M 392 120 C 392 165, 310 165, 310 165" fill="none" stroke="#f43f5e" stroke-width="1.5" marker-end="url(#os-arr-r)"/><rect x="250" y="145" width="125" height="40" rx="8" fill="#1e293b" stroke="#f43f5e" stroke-width="1.5"/><text x="312" y="170" fill="#fda4af" font-size="11" font-weight="bold" text-anchor="middle">WAITING / I/O</text><path d="M 250 165 C 190 165, 190 135, 190 120" fill="none" stroke="#38bdf8" stroke-width="1.5" marker-end="url(#os-arr)"/><defs><marker id="os-arr" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8"/></marker><marker id="os-arr-g" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981"/></marker><marker id="os-arr-y" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1 L 10 5 L 0 9 z" fill="#eab308"/></marker><marker id="os-arr-r" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1 L 10 5 L 0 9 z" fill="#f43f5e"/></marker></defs></svg>`,
    diagramCaption: 'Process lifecycle transitions: Admission, CPU Dispatching, Quantum Expiry, and I/O Wait',
  },
  {
    id: 'top_os_2',
    subjectId: 'subj_os',
    unitNumber: 2,
    unitName: 'Chapter 2: Concurrency & Deadlocks',
    title: 'Deadlock Detection & Bankers Algorithm',
    description: 'Four deadlock conditions, Resource Allocation Graphs, Bankers algorithm for safety state inspection.',
    notesContent: '### 4 Coffman Conditions for Deadlock\n1. Mutual Exclusion\n2. Hold and Wait\n3. No Preemption\n4. Circular Wait',
    durationMins: 65,
    difficulty: 'hard',
    questionsCount: 5,
  },
];

export const INITIAL_MATERIALS: StudyMaterial[] = [];

// Clean initial state for new users
export const INITIAL_TASKS: StudyPlanTask[] = [];
export const INITIAL_WEAK_TOPICS: WeakTopic[] = [];
export const INITIAL_QUIZ_ATTEMPTS: QuizAttempt[] = [];

export const SAMPLE_QUIZ_BANK: QuizQuestion[] = [
  {
    id: 'q1',
    subjectId: 'subj_ds',
    topicId: 'top_ds_1',
    questionText: 'What is the time complexity of searching an element in a balanced Binary Search Tree?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    correctOptionIndex: 1,
    explanation: 'In a balanced BST, the search space is halved at each step, yielding a logarithmic time complexity of O(log n).',
    difficulty: 'easy',
  },
  {
    id: 'q2',
    subjectId: 'subj_ds',
    topicId: 'top_ds_1',
    questionText: 'Which data structure is naturally used for Breadth-First Search (BFS) in a graph?',
    options: ['Stack', 'Queue', 'Priority Queue', 'Array'],
    correctOptionIndex: 1,
    explanation: 'BFS explores vertices level by level, requiring a FIFO Queue to process adjacent nodes in arrival order.',
    difficulty: 'easy',
  },
  {
    id: 'q3',
    subjectId: 'subj_ds',
    topicId: 'top_ds_4',
    questionText: 'What algorithm is best suited to find the single-source shortest path in a graph with non-negative edge weights?',
    options: ['Floyd-Warshall Algorithm', 'Dijkstra Algorithm', 'Bellman-Ford Algorithm', 'Kruskal Algorithm'],
    correctOptionIndex: 1,
    explanation: 'Dijkstra algorithm uses a greedy approach with a priority queue to find single-source shortest paths efficiently when all edge weights are non-negative.',
    difficulty: 'medium',
  },
  {
    id: 'q4',
    subjectId: 'subj_dbms',
    topicId: 'top_dbms_3',
    questionText: 'A relation is in Boyce-Codd Normal Form (BCNF) if for every non-trivial functional dependency X -> Y:',
    options: ['X is a prime attribute', 'Y is a candidate key', 'X is a super key', 'Y is a prime attribute'],
    correctOptionIndex: 2,
    explanation: 'BCNF requires that for any functional dependency X -> Y, X must be a super key for the relation schema.',
    difficulty: 'hard',
  },
  {
    id: 'q5',
    subjectId: 'subj_os',
    topicId: 'top_os_1',
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
    if (existingSubjects.length === 0) {
      setStored(userKey(STORAGE_KEYS.SUBJECTS, uid), INITIAL_SUBJECTS);
      setStored(userKey(STORAGE_KEYS.TOPICS, uid), INITIAL_TOPICS);
    }

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
    const rawSubjects = getStored<Subject[]>(userKey(STORAGE_KEYS.SUBJECTS, uid), INITIAL_SUBJECTS);
    const baseSubjects = Array.isArray(rawSubjects) && rawSubjects.length > 0 ? rawSubjects : INITIAL_SUBJECTS;
    const progressMap = getStored<Record<string, number>>(userKey('studysphere_user_progress', uid), {});
    const safeProgress = (progressMap && typeof progressMap === 'object') ? progressMap : {};
    return baseSubjects.map((s) => ({
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
  },
  deleteSubject(subjectId: string): void {
    const uid = getCurrentUserId();
    const subjects = this.getSubjects(uid).filter((s) => s.id !== subjectId);
    setStored(userKey(STORAGE_KEYS.SUBJECTS, uid), subjects);

    const topics = this.getTopics().filter((t) => t.subjectId !== subjectId);
    setStored(userKey(STORAGE_KEYS.TOPICS, uid), topics);

    const materials = this.getMaterials().filter((m) => m.subjectId !== subjectId);
    setStored(userKey(STORAGE_KEYS.MATERIALS, uid), materials);

    deleteSubjectFromSupabase(subjectId).catch((e) => console.warn('Supabase subject delete:', e));
  },

  getTopics(subjectId?: string): Topic[] {
    const uid = getCurrentUserId();
    const rawList = getStored<Topic[]>(userKey(STORAGE_KEYS.TOPICS, uid), INITIAL_TOPICS);
    const list = Array.isArray(rawList) && rawList.length > 0 ? rawList : INITIAL_TOPICS;
    const normalized = list.map((t) => ({
      ...t,
      unitName: formatChapterLabel(t.unitName, t.unitNumber),
    }));
    return subjectId ? normalized.filter((t) => t.subjectId === subjectId) : normalized;
  },
  addTopics(newTopics: Topic[]): void {
    const uid = getCurrentUserId();
    const list = this.getTopics();
    setStored(userKey(STORAGE_KEYS.TOPICS, uid), [...newTopics, ...list]);
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
    const tasks = this.getTasks().filter((t) => t.id !== taskId);
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
    const list = this.getAnalyzedPDFs().filter((d) => d.id !== id);
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
