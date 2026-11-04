export type UserRole = 'student' | 'teacher';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
  institution?: string;
  semester?: string;
  major?: string;
  targetGoal?: string;
  phone?: string;
}

export interface SubjectDocument {
  id: string;
  subjectId: string;
  name: string;
  uploadedAt: string;
  chaptersCount: number;
  topicCount: number;
  fileSize?: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description: string;
  icon: string;
  progressPercentage: number;
  topicCount: number;
  unitsCount: number;
  color: string;
  documents?: SubjectDocument[];
}

export interface TopicUnit {
  unitNumber: number;
  unitName: string;
  topics: Topic[];
}

export interface SubTopic {
  id?: string;
  title: string;
  concept: string; // Real, natural explanation & concepts extracted from PDF
  keyPoints?: string[];
}

export interface Topic {
  id: string;
  subjectId: string;
  documentId?: string;
  documentName?: string;
  unitNumber: number;
  unitName: string;
  title: string;
  description: string;
  notesContent: string;
  subtopics?: SubTopic[];
  durationMins: number;
  difficulty: 'easy' | 'medium' | 'hard';
  questionsCount: number;
  diagramSvg?: string;
  diagramCaption?: string;
}

export type MaterialFileType = 'pdf' | 'notes' | 'question_paper' | 'assignment' | 'reference';

export interface StudyMaterial {
  id: string;
  subjectId: string;
  subjectName?: string;
  unitNumber?: number;
  topicId?: string;
  title: string;
  description: string;
  fileType: MaterialFileType;
  fileUrl: string;
  fileSize?: string;
  isPublished: boolean;
  uploaderName: string;
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  subjectId?: string;
  topicId?: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface QuizAttempt {
  id: string;
  userId: string;
  subjectId: string;
  subjectName: string;
  topicId?: string;
  topicTitle: string;
  scorePercentage: number;
  totalQuestions: number;
  correctCount: number;
  timeTakenSeconds: number;
  completedAt: string;
}

export type TaskPriority = 'high' | 'medium' | 'low';

export interface StudyPlanTask {
  id: string;
  userId: string;
  subjectId?: string;
  subjectName?: string;
  title: string;
  priority: TaskPriority;
  durationMins: number;
  dueDate: string; // YYYY-MM-DD
  isCompleted: boolean;
  createdAt: string;
}

export interface WeakTopic {
  id: string;
  userId: string;
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicName: string;
  accuracyPercentage: number;
  errorCount: number;
  lastAttempted: string;
  status: 'critical' | 'moderate' | 'improved';
}

export type LearningLevel = 'beginner' | 'intermediate' | 'exam_focused';

export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: 'user' | 'ai';
  content: string;
  learningLevel?: LearningLevel;
  timestamp: string;
}

export interface AIConversation {
  id: string;
  userId: string;
  title: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface PDFAnalysisResult {
  summary: string;
  keyTopics: string[];
  keyInsights: string[];
  practiceQuestions: QuizQuestion[];
}

export interface SearchResultItem {
  id: string;
  type: 'subject' | 'topic' | 'note' | 'pdf' | 'question';
  title: string;
  subtitle: string;
  link: string;
  extraInfo?: string;
}

export interface TopicExplanation {
  topicTitle: string;
  englishExplanation: string;
  hinglishExplanation: string;
  keyPoints?: string[];
  keyPointsHinglish?: string[];
  originalEnglishExplanation?: string;
  originalHinglishExplanation?: string;
  deepenedEnglishExplanation?: string;
  deepenedHinglishExplanation?: string;
  isDeepenedActive?: boolean;
}

export interface AnalyzedPDFRecord {
  id: string;
  filename: string;
  fileSize: number;
  summary: string;
  summaryHinglish?: string;
  topicWiseAnalysis?: TopicExplanation[];
  importantTopics: string[];
  keyInsights: string[];
  keyInsightsHinglish?: string[];
  extractedText: string;
  chatHistory: { q: string; a: string }[];
  analyzedAt: string;
}

export interface TeacherNotification {
  id: string;
  title: string;
  description: string;
  subjectName?: string;
  materialId?: string;
  fileType?: string;
  fileSize?: string;
  uploaderName?: string;
  createdAt: string;
  isRead: boolean;
}

