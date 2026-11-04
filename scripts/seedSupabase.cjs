require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in your .env file.');
  process.exit(1);
}

const client = createClient(url, key);

const INITIAL_SUBJECTS = [
  {
    id: 'subj_ds',
    name: 'Data Structures',
    code: 'CS-201',
    description: 'Fundamental data organization, linear & non-linear structures, algorithmic efficiency.',
    icon: 'Network',
    progress_percentage: 0,
    topic_count: 16,
    units_count: 4,
    color: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'subj_dbms',
    name: 'Database Management',
    code: 'CS-202',
    description: 'Relational databases, SQL, ER modeling, normalization, transaction processing, and indexing.',
    icon: 'Database',
    progress_percentage: 0,
    topic_count: 14,
    units_count: 4,
    color: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'subj_cn',
    name: 'Computer Networks',
    code: 'CS-301',
    description: 'OSI model, TCP/IP stack, routing protocols, wireless networking, and network security.',
    icon: 'Wifi',
    progress_percentage: 0,
    topic_count: 12,
    units_count: 4,
    color: 'from-blue-600 to-indigo-700',
  },
  {
    id: 'subj_os',
    name: 'Operating Systems',
    code: 'CS-302',
    description: 'Process management, memory allocation, deadlocks, file systems, and concurrency primitives.',
    icon: 'Cpu',
    progress_percentage: 0,
    topic_count: 15,
    units_count: 4,
    color: 'from-amber-500 to-orange-600',
  },
  {
    id: 'subj_ai',
    name: 'Artificial Intelligence',
    code: 'CS-401',
    description: 'Search algorithms, knowledge representation, machine learning basics, neural networks, and NLP.',
    icon: 'Bot',
    progress_percentage: 0,
    topic_count: 18,
    units_count: 4,
    color: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'subj_web',
    name: 'Web Development',
    code: 'CS-205',
    description: 'Modern full-stack web architectures, REST APIs, asynchronous UI frameworks, and state management.',
    icon: 'Globe',
    progress_percentage: 0,
    topic_count: 14,
    units_count: 4,
    color: 'from-pink-500 to-rose-600',
  },
  {
    id: 'subj_se',
    name: 'Software Engineering',
    code: 'CS-305',
    description: 'Agile methodologies, software architecture patterns, CI/CD, testing paradigms, and design patterns.',
    icon: 'Layers',
    progress_percentage: 0,
    topic_count: 12,
    units_count: 4,
    color: 'from-slate-600 to-blue-700',
  },
];

const INITIAL_TOPICS = [
  {
    id: 'top_ds_1',
    subject_id: 'subj_ds',
    unit_number: 1,
    unit_name: 'Chapter 1: Linear Data Structures',
    title: 'Arrays & Singly Linked Lists',
    description: 'Memory representation, traversal, insertion, deletion, and time complexity comparisons.',
    notes_content: '### Arrays vs Linked Lists\n- Contiguous memory vs Dynamic heap pointers.',
    duration_mins: 45,
    difficulty: 'easy',
    questions_count: 5,
  },
  {
    id: 'top_ds_2',
    subject_id: 'subj_ds',
    unit_number: 1,
    unit_name: 'Chapter 1: Linear Data Structures',
    title: 'Stacks & Queues Applications',
    description: 'LIFO & FIFO operations, expression evaluation, infix to postfix conversion, circular queues.',
    notes_content: '### Stacks (LIFO) and Queues (FIFO)\nUsed in parsing, scheduling, and graph traversals.',
    duration_mins: 50,
    difficulty: 'medium',
    questions_count: 5,
  },
  {
    id: 'top_ds_3',
    subject_id: 'subj_ds',
    unit_number: 2,
    unit_name: 'Chapter 2: Trees & Binary Search Trees',
    title: 'Tree Traversals & BST Operations',
    description: 'Inorder, Preorder, Postorder traversals, BST insertion, searching, and deletion edge cases.',
    notes_content: '### Binary Search Tree Invariant\nFor every node N: left < N < right.',
    duration_mins: 60,
    difficulty: 'medium',
    questions_count: 5,
  },
  {
    id: 'top_ds_4',
    subject_id: 'subj_ds',
    unit_number: 3,
    unit_name: 'Chapter 3: Graphs & Shortest Paths',
    title: 'Graph Traversal: BFS, DFS & Dijkstra',
    description: 'Adjacency list representation, Breadth-First Search, Depth-First Search, and shortest path greedy algorithms.',
    notes_content: '### Graph Algorithms\nDijkstra algorithm finds single-source shortest path.',
    duration_mins: 75,
    difficulty: 'hard',
    questions_count: 5,
  },
  {
    id: 'top_dbms_1',
    subject_id: 'subj_dbms',
    unit_number: 1,
    unit_name: 'Chapter 1: Relational Model & ER Diagrams',
    title: 'Entity-Relationship Diagrams & Mapping',
    description: 'Entities, attributes, relationships, cardinalities, weak entities, and converting ERD to relational schema.',
    notes_content: '### ER Components\nEntities, attributes, relationships and primary keys.',
    duration_mins: 40,
    difficulty: 'easy',
    questions_count: 5,
  },
  {
    id: 'top_dbms_2',
    subject_id: 'subj_dbms',
    unit_number: 2,
    unit_name: 'Chapter 2: SQL & Relational Algebra',
    title: 'Advanced SQL Joins & Aggregations',
    description: 'INNER, LEFT, RIGHT, FULL OUTER joins, GROUP BY, HAVING, subqueries, and window functions.',
    notes_content: '### SQL Queries\nMastering joins and groupings.',
    duration_mins: 55,
    difficulty: 'medium',
    questions_count: 5,
  },
  {
    id: 'top_dbms_3',
    subject_id: 'subj_dbms',
    unit_number: 3,
    unit_name: 'Chapter 3: Database Normalization',
    title: 'Functional Dependencies & 1NF to BCNF',
    description: 'Identifying anomalies, Armstrong axioms, 1NF, 2NF, 3NF, and Boyce-Codd Normal Form decomposition.',
    notes_content: '### Normal Forms\n1NF, 2NF, 3NF, and BCNF normalization.',
    duration_mins: 70,
    difficulty: 'hard',
    questions_count: 5,
  },
  {
    id: 'top_os_1',
    subject_id: 'subj_os',
    unit_number: 1,
    unit_name: 'Chapter 1: Process Management & CPU Scheduling',
    title: 'CPU Scheduling Algorithms',
    description: 'FCFS, SJF, Priority, Round Robin, Gantt charts, waiting time and turnaround time calculations.',
    notes_content: '### Process Scheduling\nTurnaround time and waiting time formulas.',
    duration_mins: 50,
    difficulty: 'medium',
    questions_count: 5,
  },
  {
    id: 'top_os_2',
    subject_id: 'subj_os',
    unit_number: 2,
    unit_name: 'Chapter 2: Concurrency & Deadlocks',
    title: 'Deadlock Detection & Bankers Algorithm',
    description: 'Four deadlock conditions, Resource Allocation Graphs, Bankers algorithm for safety state inspection.',
    notes_content: '### Deadlock Conditions\nMutual exclusion, hold & wait, no preemption, circular wait.',
    duration_mins: 65,
    difficulty: 'hard',
    questions_count: 5,
  },
];

const INITIAL_MATERIALS = [
  {
    id: 'mat_1',
    subject_id: 'subj_ds',
    unit_number: 1,
    topic_id: 'top_ds_1',
    title: 'Complete Guide to Linear Data Structures & Algorithmic Complexity',
    description: 'Comprehensive lecture reference covering Arrays, Linked Lists, Stacks, Queues, and Big-O notation.',
    file_type: 'pdf',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_size: '2.4 MB',
    is_published: true,
    uploader_name: 'Prof. Marcus Vance',
  },
  {
    id: 'mat_2',
    subject_id: 'subj_dbms',
    unit_number: 3,
    topic_id: 'top_dbms_3',
    title: 'Database Normalization Masterclass & Solved Examples',
    description: 'Step-by-step walkthrough of 1NF, 2NF, 3NF, and BCNF with real schema decomposition problems.',
    file_type: 'notes',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_size: '1.1 MB',
    is_published: true,
    uploader_name: 'Dr. Elena Rostova',
  },
];

const SAMPLE_QUIZ_BANK = [
  {
    id: 'q1',
    subject_id: 'subj_ds',
    topic_id: 'top_ds_1',
    question_text: 'What is the time complexity of searching an element in a balanced Binary Search Tree?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    correct_option_index: 1,
    explanation: 'In a balanced BST, the search space is halved at each step, yielding a logarithmic time complexity of O(log n).',
    difficulty: 'easy',
  },
  {
    id: 'q2',
    subject_id: 'subj_ds',
    topic_id: 'top_ds_1',
    question_text: 'Which data structure is naturally used for Breadth-First Search (BFS) in a graph?',
    options: ['Stack', 'Queue', 'Priority Queue', 'Array'],
    correct_option_index: 1,
    explanation: 'BFS explores vertices level by level, requiring a FIFO Queue to process adjacent nodes in arrival order.',
    difficulty: 'easy',
  },
  {
    id: 'q3',
    subject_id: 'subj_ds',
    topic_id: 'top_ds_4',
    question_text: 'What algorithm is best suited to find the single-source shortest path in a graph with non-negative edge weights?',
    options: ['Floyd-Warshall Algorithm', 'Dijkstra Algorithm', 'Bellman-Ford Algorithm', 'Kruskal Algorithm'],
    correct_option_index: 1,
    explanation: 'Dijkstra algorithm uses a greedy approach with a priority queue to find single-source shortest paths efficiently when all edge weights are non-negative.',
    difficulty: 'medium',
  },
  {
    id: 'q4',
    subject_id: 'subj_dbms',
    topic_id: 'top_dbms_3',
    question_text: 'A relation is in Boyce-Codd Normal Form (BCNF) if for every non-trivial functional dependency X -> Y:',
    options: ['X is a prime attribute', 'Y is a candidate key', 'X is a super key', 'Y is a prime attribute'],
    correct_option_index: 2,
    explanation: 'For BCNF, every determinant X in non-trivial functional dependencies must be a super key of the relation.',
    difficulty: 'medium',
  },
];

async function seedAll() {
  console.log('--- SEEDING SUPABASE TABLES ---');

  // 1. Subjects
  for (const s of INITIAL_SUBJECTS) {
    const { error } = await client.from('subjects').upsert(s, { onConflict: 'id' });
    if (error) console.error('Subject error (' + s.id + '):', error.message);
    else console.log('✓ Subject:', s.name);
  }

  // 2. Topics
  for (const t of INITIAL_TOPICS) {
    const { error } = await client.from('topics').upsert(t, { onConflict: 'id' });
    if (error) console.error('Topic error (' + t.id + '):', error.message);
    else console.log('✓ Topic:', t.title);
  }

  // 3. Quiz Questions
  for (const q of SAMPLE_QUIZ_BANK) {
    const { error } = await client.from('quiz_questions').upsert(q, { onConflict: 'id' });
    if (error) console.error('Question error (' + q.id + '):', error.message);
    else console.log('✓ Question:', q.id);
  }

  // 4. Study Materials
  for (const m of INITIAL_MATERIALS) {
    const { error } = await client.from('study_materials').upsert(m, { onConflict: 'id' });
    if (error) console.error('Material error (' + m.id + '):', error.message);
    else console.log('✓ Material:', m.title);
  }

  console.log('--- COMPLETED ---');
}

seedAll();
