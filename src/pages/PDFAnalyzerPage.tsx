import React, { useState } from 'react';
import {
  Upload,
  FileText,
  HelpCircle,
  MessageSquare,
  AlertCircle,
  BookOpen,
  Send,
  ListChecks,
  CheckCircle2,
  Cpu,
  Plus,
  Trash2,
  Languages,
  ChevronDown,
  ChevronUp,
  Maximize2,
  RotateCcw,
  X,
  XCircle,
  ArrowRight,
  Award,
  Loader2,
  Layers,
  Search,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DataStore } from '../lib/dataStore';
import { AnalyzedPDFRecord, TopicExplanation, QuizQuestion, QuizAttempt } from '../types';

interface PDFAnalyzerPageProps {
  onNavigate: (path: string) => void;
  onGenerateQuizFromPDF: (text: string, title: string) => void;
}

const renderFormattedText = (text: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-semibold text-slate-100">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={idx} className="px-1.5 py-0.5 rounded bg-slate-800 text-blue-300 font-mono text-xs">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
};

const renderSectionContent = (content: string) => {
  if (!content) return null;

  // 1. Clean robotic template prefixes:
  let cleaned = content
    .replace(/^(\s*[-*•]?\s*)\*\*(?:Core Principle|Operational Mechanics|System Significance|System Behavior|Working Mechanics|Rules & Flow|Rules & Formulas|Trade-offs|Performance & Trade-offs|Real-World Systems Behavior|Theoretical Foundation|State Lifecycle|Fault Containment)\*\*:\s*/gmi, (match, prefix) => {
      return prefix && prefix.trim() ? prefix : '- ';
    })
    .replace(/^(\s*[-*•]?\s*)(?:Core Principle|Operational Mechanics|System Significance|System Behavior|Working Mechanics|Rules & Flow|Rules & Formulas|Trade-offs|Performance & Trade-offs|Real-World Systems Behavior|Theoretical Foundation|State Lifecycle|Fault Containment):\s*/gmi, (match, prefix) => {
      return prefix && prefix.trim() ? prefix : '- ';
    });

  const rawLines = cleaned.split('\n');
  const elements: React.ReactNode[] = [];

  let currentBullets: string[] = [];
  let currentParagraphLines: string[] = [];

  const flushParagraph = () => {
    if (currentParagraphLines.length > 0) {
      const pText = currentParagraphLines.join(' ').trim();
      if (pText) {
        elements.push(
          <p key={`p-${elements.length}`} className="text-sm leading-relaxed text-slate-200 font-sans">
            {renderFormattedText(pText)}
          </p>
        );
      }
      currentParagraphLines = [];
    }
  };

  const flushBullets = () => {
    if (currentBullets.length > 0) {
      const listItems = [...currentBullets];
      elements.push(
        <ul key={`ul-${elements.length}`} className="space-y-2.5 my-2.5 pl-0.5">
          {listItems.map((item, bIdx) => (
            <li key={bIdx} className="text-sm text-slate-300 flex items-start gap-2.5 leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-2" />
              <div className="flex-1">{renderFormattedText(item)}</div>
            </li>
          ))}
        </ul>
      );
      currentBullets = [];
    }
  };

  for (let i = 0; i < rawLines.length; i++) {
    const rawLine = rawLines[i].trim();
    if (!rawLine) {
      flushParagraph();
      flushBullets();
      continue;
    }

    // Clean any residual buzzwords or auto-generated labels like "Point 1:", "Key Exam Facts", "a) Introductory Paragraph:", etc.
    let line = rawLine
      .replace(/^(###\s*)?(Point\s*[12]\s*:\s*|Key\s*Exam\s*Facts\s*:?\s*|Exam\s*(Points|Strategy|Facts|Focus)\s*:?\s*|[a-z]\)\s*Introductory\s*Paragraph\s*:?\s*|Introductory\s*Paragraph\s*:?\s*)/i, '$1')
      .trim();

    if (!line) continue;

    // Subtopic Heading (### Subtopic or standalone era/phase/title like "The Gestation and Birth of AI (1943–1956)")
    const isHeading = line.startsWith('#') ||
      (!line.match(/^[-*•\d]/) && line.length < 90 && !line.endsWith('.') && !line.endsWith(':') && (
        /\(\d{4}[–—-]\d{4}\)/.test(line) ||
        /^(?:The\s+[A-Z]|Era\s+of|Introduction\s+to|Birth\s+of|Rise\s+of|Early\s+[A-Z]|Phase\s+\d+|Chapter\s+\d+|Unit\s+\d+)/i.test(line)
      ));

    if (isHeading) {
      flushParagraph();
      flushBullets();
      const heading = line.replace(/^#+\s*/, '').trim();
      elements.push(
        <div key={`h-${elements.length}`} className="pt-2.5 pb-0.5 border-t border-slate-800/60 first:border-0 first:pt-0">
          <h5 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
            <span>{renderFormattedText(heading)}</span>
          </h5>
        </div>
      );
      continue;
    }

    // Bullet or Numbered List item
    const bulletMatch = line.match(/^([-*•]|\d+[\.\)])\s+(.*)/);
    if (bulletMatch) {
      flushParagraph();
      currentBullets.push(bulletMatch[2]);
      continue;
    }

    // Regular line of prose text
    if (currentBullets.length > 0) {
      flushBullets();
    }
    currentParagraphLines.push(line);
  }

  flushParagraph();
  flushBullets();

  return <div className="space-y-3">{elements}</div>;
};

export const PDFAnalyzerPage: React.FC<PDFAnalyzerPageProps> = ({
  onNavigate,
  onGenerateQuizFromPDF,
}) => {
  const [analyzedList, setAnalyzedList] = useState<AnalyzedPDFRecord[]>(() => DataStore.getAnalyzedPDFs());
  const [activeRecord, setActiveRecord] = useState<AnalyzedPDFRecord | null>(() => DataStore.getLatestAnalyzedPDF());
  const [showUploader, setShowUploader] = useState<boolean>(() => !DataStore.getLatestAnalyzedPDF());
  const [docToDelete, setDocToDelete] = useState<AnalyzedPDFRecord | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Analysis & Dual-Language state
  const [activeTab, setActiveTab] = useState<'summary' | 'topics' | 'chat'>('summary');
  const [selectedLang, setSelectedLang] = useState<'english' | 'hinglish'>('english');
  const [cardLangOverrides, setCardLangOverrides] = useState<Record<number, 'english' | 'hinglish'>>({});
  const [collapsedTopics, setCollapsedTopics] = useState<Record<number, boolean>>({});
  const [pdfChatQuery, setPdfChatQuery] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [deepeningTopicIdx, setDeepeningTopicIdx] = useState<number | null>(null);
  const [deepenedTopics, setDeepenedTopics] = useState<Record<number, boolean>>({});
  const [isReanalyzingDeep, setIsReanalyzingDeep] = useState(false);

  // In-page Topic Quiz State
  const [quizModalTopic, setQuizModalTopic] = useState<string | null>(null);
  const [topicQuizQuestions, setTopicQuizQuestions] = useState<QuizQuestion[]>([]);
  const [isGeneratingTopicQuiz, setIsGeneratingTopicQuiz] = useState<boolean>(false);
  const [topicQuizCurrentIdx, setTopicQuizCurrentIdx] = useState<number>(0);
  const [topicQuizSelectedAnswers, setTopicQuizSelectedAnswers] = useState<Record<number, number>>({});
  const [topicQuizFinished, setTopicQuizFinished] = useState<boolean>(false);
  const [topicQuizError, setTopicQuizError] = useState<string>('');

  const handleStartTopicQuiz = async (topicTitle: string, explanationText?: string) => {
    setQuizModalTopic(topicTitle);
    setTopicQuizQuestions([]);
    setTopicQuizCurrentIdx(0);
    setTopicQuizSelectedAnswers({});
    setTopicQuizFinished(false);
    setTopicQuizError('');
    setIsGeneratingTopicQuiz(true);

    try {
      const res = await fetch('/api/ai/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: activeRecord?.filename ? activeRecord.filename.replace(/\.pdf$/i, '') : 'Study Document',
          topic: topicTitle,
          difficulty: 'medium',
          questionCount: 5,
          pdfText: `FOCUS TOPIC: ${topicTitle}\n\nTOPIC EXPLANATION & CONCEPTS:\n${explanationText || ''}\n\nDOCUMENT CONTEXT:\n${activeRecord?.extractedText || ''}`.substring(0, 30000)
        })
      });

      if (!res.ok) {
        throw new Error('Failed to generate quiz for this topic.');
      }

      const data = await res.json();
      if (Array.isArray(data.questions) && data.questions.length > 0) {
        setTopicQuizQuestions(data.questions);
      } else {
        throw new Error('No questions returned for this topic.');
      }
    } catch (err: any) {
      console.error('Topic quiz generation error:', err);
      setTopicQuizError(err.message || 'Could not generate quiz right now. Please try again.');
    } finally {
      setIsGeneratingTopicQuiz(false);
    }
  };

  const handleSelectTopicQuizOption = (optIdx: number) => {
    if (topicQuizSelectedAnswers[topicQuizCurrentIdx] !== undefined) return;
    setTopicQuizSelectedAnswers(prev => ({ ...prev, [topicQuizCurrentIdx]: optIdx }));
  };

  const handleFinishTopicQuiz = () => {
    let correctCount = 0;
    topicQuizQuestions.forEach((q, idx) => {
      if (topicQuizSelectedAnswers[idx] === q.correctOptionIndex) correctCount++;
    });
    const scorePct = Math.round((correctCount / topicQuizQuestions.length) * 100);

    if (scorePct >= 80) {
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
    }

    if (quizModalTopic && activeRecord) {
      const attempt: QuizAttempt = {
        id: `attempt_${Date.now()}`,
        userId: DataStore.getActiveUser().id,
        subjectId: 'subj_pdf',
        subjectName: activeRecord.filename.replace(/\.pdf$/i, ''),
        topicId: `topic_${quizModalTopic.slice(0, 10)}`,
        topicTitle: quizModalTopic,
        scorePercentage: scorePct,
        totalQuestions: topicQuizQuestions.length,
        correctCount,
        timeTakenSeconds: 60,
        completedAt: new Date().toISOString(),
      };
      DataStore.recordQuizAttempt(attempt);
    }

    setTopicQuizFinished(true);
  };



  const readFileAsBase64 = (fileToRead: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(fileToRead);
    });
  };

  const handleFileUpload = async (uploadedFile: File) => {
    if (uploadedFile.type !== 'application/pdf') {
      setErrorMessage('Invalid file format. Please upload a valid PDF document.');
      return;
    }

    if (uploadedFile.size > 25 * 1024 * 1024) {
      setErrorMessage('File size exceeds maximum limit of 25 MB.');
      return;
    }

    setErrorMessage('');
    setIsProcessing(true);
    setProgress(15);
    setProgressStatus('Reading PDF document into memory...');

    try {
      // 1. Read PDF file as Base64 for reliable server-side extraction
      const base64Data = await readFileAsBase64(uploadedFile);
      setProgress(40);
      setProgressStatus('Extracting document text and layout hierarchy...');

      // 2. Call Backend Deep AI Analyzer
      setProgress(65);
      setProgressStatus('Synthesizing core concepts and extracting high-yield exam topics...');

      const res = await fetch('/api/ai/analyze-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfBase64: base64Data,
          filename: uploadedFile.name,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Server failed to analyze PDF.');
      }

      const data = await res.json();
      setProgress(95);

      const newRecord: AnalyzedPDFRecord = {
        id: `pdf_${Date.now()}`,
        filename: uploadedFile.name,
        fileSize: uploadedFile.size,
        summary: data.summary || 'Summary generated successfully.',
        summaryHinglish: data.summaryHinglish || '',
        topicWiseAnalysis: Array.isArray(data.topicWiseAnalysis) ? data.topicWiseAnalysis : [],
        importantTopics: Array.isArray(data.importantTopics) ? data.importantTopics : [],
        keyInsights: Array.isArray(data.keyInsights) ? data.keyInsights : [],
        keyInsightsHinglish: Array.isArray(data.keyInsightsHinglish) ? data.keyInsightsHinglish : [],
        extractedText: data.extractedText || '',
        chatHistory: [],
        analyzedAt: new Date().toISOString(),
      };

      DataStore.saveAnalyzedPDF(newRecord);
      const updatedList = DataStore.getAnalyzedPDFs();
      setAnalyzedList(updatedList);
      setActiveRecord(newRecord);
      setShowUploader(false);

      setProgress(100);
      setProgressStatus('Complete!');
    } catch (err: any) {
      console.error('PDF Analysis failed:', err);
      setErrorMessage(err.message || 'Failed to analyze PDF. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getRecordTopics = (record: AnalyzedPDFRecord): TopicExplanation[] => {
    if (record.topicWiseAnalysis && record.topicWiseAnalysis.length > 0) {
      return record.topicWiseAnalysis;
    }
    // Backward compatibility fallback for documents analyzed prior to dual-language topic upgrade
    if (record.importantTopics && record.importantTopics.length > 0) {
      return record.importantTopics.map((top, idx) => {
        const parts = top.split(':');
        const title = parts.length > 1 ? parts[0].trim() : `Topic ${idx + 1}`;
        const desc = parts.length > 1 ? parts.slice(1).join(':').trim() : top;
        return {
          topicTitle: title,
          englishExplanation: `${title} is a core subject concept extracted from the document.\n\n- **Core Principle**: ${desc}\n- **Operational Mechanics**: Executes deterministic state transitions and handles runtime resources reliably.\n- **System Significance**: Provides the foundational architecture required for stable execution and error handling.`,
          hinglishExplanation: `${title} syllabus ka ek zaroori concept hai jo is document me cover kiya gaya hai.\n\n- **Core Principle**: ${desc}\n- **Kaise Kaam Karta Hai**: System me fixed rules ke mutabiq processing hoti hai taaki operations bina kisi error ke run ho sakein.\n- **Zaroori Baat**: Yeh pure system ki stability aur accurate execution ke liye foundational role play karta hai.`,
        };
      });
    }
    return [];
  };

  const handleDeepenTopic = async (idx: number, topicTitle: string) => {
    if (!activeRecord || deepeningTopicIdx !== null) return;
    setDeepeningTopicIdx(idx);
    // Auto-expand the card so user sees the in-depth masterclass immediately
    setCollapsedTopics(prev => ({ ...prev, [idx]: false }));

    const currentTopics = getRecordTopics(activeRecord);
    const currentTopic = currentTopics[idx];
    const prevEng = currentTopic?.englishExplanation || '';
    const prevHin = currentTopic?.hinglishExplanation || '';
    // Preserve original summary so user can restore it anytime
    const originalEng = currentTopic?.originalEnglishExplanation || prevEng;
    const originalHin = currentTopic?.originalHinglishExplanation || prevHin;

    try {
      const res = await fetch('/api/ai/deepen-topic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicTitle,
          pdfText: activeRecord.extractedText,
          filename: activeRecord.filename,
          currentExplanation: prevEng,
          currentExplanationHinglish: prevHin,
          documentSummary: activeRecord.summary || '',
        }),
      });

      if (!res.ok) throw new Error('Failed to deepen topic.');
      const data = await res.json();

      const newEng = data.englishExplanation || prevEng;
      const newHin = data.hinglishExplanation || prevHin;

      const updatedTopics = [...currentTopics];
      updatedTopics[idx] = {
        ...currentTopic,
        topicTitle: data.topicTitle || topicTitle,
        originalEnglishExplanation: originalEng,
        originalHinglishExplanation: originalHin,
        deepenedEnglishExplanation: newEng,
        deepenedHinglishExplanation: newHin,
        englishExplanation: newEng,
        hinglishExplanation: newHin,
        keyPoints: data.keyPoints || currentTopic?.keyPoints,
        keyPointsHinglish: data.keyPointsHinglish || currentTopic?.keyPointsHinglish,
        isDeepenedActive: true,
      };

      const updatedRecord: AnalyzedPDFRecord = {
        ...activeRecord,
        topicWiseAnalysis: updatedTopics,
      };

      setActiveRecord(updatedRecord);
      DataStore.saveAnalyzedPDF(updatedRecord);
      setAnalyzedList(DataStore.getAnalyzedPDFs());
      setDeepenedTopics(prev => ({ ...prev, [idx]: true }));
    } catch (err) {
      console.error('Failed to deepen topic:', err);
    } finally {
      setDeepeningTopicIdx(null);
    }
  };

  const handleToggleTopicVersion = (idx: number) => {
    if (!activeRecord) return;
    const currentTopics = getRecordTopics(activeRecord);
    const currentTopic = currentTopics[idx];
    if (!currentTopic) return;

    const isCurrentlyDeep = Boolean(deepenedTopics[idx] ?? currentTopic.isDeepenedActive);
    const updatedTopics = [...currentTopics];

    if (isCurrentlyDeep) {
      // Revert to original / previous standard summary
      updatedTopics[idx] = {
        ...currentTopic,
        englishExplanation: currentTopic.originalEnglishExplanation || currentTopic.englishExplanation,
        hinglishExplanation: currentTopic.originalHinglishExplanation || currentTopic.hinglishExplanation,
        isDeepenedActive: false,
      };
      setDeepenedTopics(prev => ({ ...prev, [idx]: false }));
    } else {
      // Switch back to deepened masterclass version
      updatedTopics[idx] = {
        ...currentTopic,
        englishExplanation: currentTopic.deepenedEnglishExplanation || currentTopic.englishExplanation,
        hinglishExplanation: currentTopic.deepenedHinglishExplanation || currentTopic.hinglishExplanation,
        isDeepenedActive: true,
      };
      setDeepenedTopics(prev => ({ ...prev, [idx]: true }));
    }

    const updatedRecord: AnalyzedPDFRecord = {
      ...activeRecord,
      topicWiseAnalysis: updatedTopics,
    };
    setActiveRecord(updatedRecord);
    DataStore.saveAnalyzedPDF(updatedRecord);
    setAnalyzedList(DataStore.getAnalyzedPDFs());
  };

  const handleReanalyzeDeep = async () => {
    if (!activeRecord || isReanalyzingDeep) return;
    setIsReanalyzingDeep(true);

    try {
      const res = await fetch('/api/ai/analyze-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfText: activeRecord.extractedText,
          filename: activeRecord.filename,
        }),
      });

      if (!res.ok) throw new Error('Re-analysis failed');
      const data = await res.json();

      const updatedRecord: AnalyzedPDFRecord = {
        ...activeRecord,
        summary: data.summary || activeRecord.summary,
        summaryHinglish: data.summaryHinglish || activeRecord.summaryHinglish,
        topicWiseAnalysis: Array.isArray(data.topicWiseAnalysis) && data.topicWiseAnalysis.length > 0
          ? data.topicWiseAnalysis
          : activeRecord.topicWiseAnalysis,
        importantTopics: data.importantTopics || activeRecord.importantTopics,
        keyInsights: data.keyInsights || activeRecord.keyInsights,
        keyInsightsHinglish: data.keyInsightsHinglish || activeRecord.keyInsightsHinglish,
      };

      setActiveRecord(updatedRecord);
      DataStore.saveAnalyzedPDF(updatedRecord);
      setAnalyzedList(DataStore.getAnalyzedPDFs());
    } catch (err) {
      console.error('Re-analysis error:', err);
    } finally {
      setIsReanalyzingDeep(false);
    }
  };

  const handleAskAboutTopic = (topicTitle: string) => {
    setActiveTab('chat');
    setPdfChatQuery(`Please explain the topic "${topicTitle}" in detail based on this PDF, with practical examples and key exam tips.`);
  };

  const toggleAllTopics = (collapse: boolean, totalTopics: number) => {
    const newState: Record<number, boolean> = {};
    for (let i = 0; i < totalTopics; i++) {
      newState[i] = collapse;
    }
    setCollapsedTopics(newState);
  };

  const handleAskPdfQuestion = async () => {
    if (!pdfChatQuery.trim() || isAsking || !activeRecord) return;
    const q = pdfChatQuery;
    setPdfChatQuery('');
    setIsAsking(true);

    try {
      const res = await fetch('/api/ai/pdf-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          pdfText: activeRecord.extractedText,
          filename: activeRecord.filename,
        }),
      });

      const data = await res.json();
      const newAnswer = data.answer || 'Response generated based on PDF text.';
      const updatedHistory = [...(activeRecord.chatHistory || []), { q, a: newAnswer }];
      
      const updatedRecord = { ...activeRecord, chatHistory: updatedHistory };
      setActiveRecord(updatedRecord);
      DataStore.saveAnalyzedPDF(updatedRecord);
      setAnalyzedList(DataStore.getAnalyzedPDFs());
    } catch (err) {
      console.error('Error during document Q&A:', err);
      const fallbackAns = `Based on your document "${activeRecord.filename}": The text addresses "${q}". Review the relevant section for complete details.`;
      const updatedHistory = [...(activeRecord.chatHistory || []), { q, a: fallbackAns }];
      const updatedRecord = { ...activeRecord, chatHistory: updatedHistory };
      setActiveRecord(updatedRecord);
      DataStore.saveAnalyzedPDF(updatedRecord);
      setAnalyzedList(DataStore.getAnalyzedPDFs());
    } finally {
      setIsAsking(false);
    }
  };

  const confirmDeleteDocument = () => {
    if (!docToDelete) return;
    const id = docToDelete.id;
    DataStore.deleteAnalyzedPDF(id);
    const updated = DataStore.getAnalyzedPDFs();
    setAnalyzedList(updated);
    if (activeRecord?.id === id) {
      if (updated.length > 0) {
        setActiveRecord(updated[0]);
      } else {
        setActiveRecord(null);
        setShowUploader(true);
      }
    }
    setDocToDelete(null);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-500 dark:text-blue-400" />
            Smart PDF Analyzer
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Upload study documents for deep AI content extraction, topic identification, & document Q&A.
          </p>
        </div>

        {analyzedList.length > 0 && !showUploader && (
          <button
            onClick={() => setShowUploader(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs border border-blue-400/30 flex items-center gap-2 transition-all self-start md:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Upload Another PDF
          </button>
        )}
      </div>

      {/* Previously Analyzed Documents Switcher */}
      {analyzedList.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-gray-400 font-medium shrink-0">Saved Documents:</span>
          {analyzedList.map((doc) => (
            <div
              key={doc.id}
              onClick={() => {
                setActiveRecord(doc);
                setShowUploader(false);
              }}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all shrink-0 ${
                activeRecord?.id === doc.id && !showUploader
                  ? 'bg-blue-50 dark:bg-blue-600/30 border-blue-300 dark:border-blue-500 text-blue-700 dark:text-blue-200 shadow-md font-semibold'
                  : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:text-gray-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
              <span className="max-w-[140px] truncate">{doc.filename}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDocToDelete(doc);
                }}
                className="hover:text-rose-400 transition-colors ml-1 cursor-pointer"
                title="Delete saved document"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
          {showUploader && (
            <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400 px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 shrink-0">
              + New Document Mode
            </span>
          )}
        </div>
      )}

      {/* Upload Zone */}
      {(!activeRecord || showUploader) ? (
        <div className="p-8 sm:p-12 rounded-3xl glass-panel border-2 border-dashed border-gray-800 hover:border-blue-500/50 transition-all text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto shadow-sm">
            {isProcessing ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : (
              <Upload className="w-8 h-8" />
            )}
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-xl font-bold text-gray-100">Upload Your Study PDF</h2>
            <p className="text-xs text-gray-400">
              Supports textbooks, lecture slides, research papers, or syllabus documents up to 25 MB.
            </p>
          </div>

          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-center gap-2 max-w-md mx-auto">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs border border-blue-400/30 cursor-pointer inline-flex items-center gap-2 transition-all">
              <Upload className="w-4 h-4" />
              Browse Files
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                }}
              />
            </label>
          </div>

          {activeRecord && (
            <button
              onClick={() => setShowUploader(false)}
              className="text-xs text-gray-400 hover:text-white underline block mx-auto pt-2"
            >
              Return to current document ({activeRecord.filename})
            </button>
          )}

          {/* Progress Bar with 3D Scanner */}
          {isProcessing && (
            <div className="p-6 rounded-2xl glass-card space-y-4 text-center max-w-xl mx-auto mt-4">
              <div className="flex justify-between text-xs text-blue-600 dark:text-blue-300 font-semibold">
                <span>{progressStatus || 'Analyzing PDF document with StudySphere Neural Engine...'}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(37,99,235,0.6)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Workspace when PDF is loaded */
        <div className="space-y-6">
          {/* File Header Bar */}
          <div className="p-5 rounded-2xl glass-panel border border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-600/20 border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-gray-100 flex items-center gap-2">
                  {activeRecord.filename}
                  <span className="text-[10px] font-mono bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-500/30">
                    StudySphere Neural Engine
                  </span>
                </div>
                <div className="text-xs text-gray-400 font-mono">
                  {(activeRecord.fileSize / (1024 * 1024)).toFixed(2)} MB • {activeRecord.extractedText ? `${activeRecord.extractedText.length.toLocaleString()} characters analyzed` : 'Analyzed'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => onGenerateQuizFromPDF(activeRecord.extractedText, activeRecord.filename)}
                disabled={!activeRecord.extractedText || isProcessing}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs border border-blue-400/30 flex items-center gap-2 transition-all disabled:opacity-40"
              >
                <HelpCircle className="w-4 h-4" />
                Generate Quiz from PDF
              </button>

              <button
                onClick={() => setShowUploader(true)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium text-xs transition-colors"
              >
                Upload Different PDF
              </button>
            </div>
          </div>

          {/* Analysis View Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all ${
                activeTab === 'summary'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <FileText className="w-4 h-4 text-blue-400" />
              Executive Summary & Breakdown
            </button>
            <button
              onClick={() => setActiveTab('topics')}
              className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all ${
                activeTab === 'topics'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <BookOpen className="w-4 h-4 text-slate-400" />
              Important Topics ({activeRecord.importantTopics?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all ${
                activeTab === 'chat'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-slate-400" />
              Ask Questions About PDF ({activeRecord.chatHistory?.length || 0})
            </button>
          </div>

          {/* Tab Content Panels */}
          {activeTab === 'summary' && (() => {
            const topics = getRecordTopics(activeRecord);
            const allCollapsed = topics.length > 0 && topics.every((_, idx) => collapsedTopics[idx]);

            return (
              <div className="space-y-6">
                {/* Header & Language Switcher Bar */}
                <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                    <div>
                      <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-400" />
                        Executive Summary & Topic Breakdown
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Deep curriculum analysis extracted directly from {activeRecord.filename}
                      </p>
                    </div>

                    {/* Dual-Language Toggle Pill */}
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800 shrink-0 self-start sm:self-auto">
                      <div className="text-[11px] font-medium text-slate-400 px-2 flex items-center gap-1">
                        <Languages className="w-3.5 h-3.5 text-slate-400" />
                        Language:
                      </div>
                      <button
                        onClick={() => {
                          setSelectedLang('english');
                          setCardLangOverrides({});
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                          selectedLang === 'english'
                            ? 'bg-slate-800 text-white font-semibold shadow-sm border border-slate-700'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span>English</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedLang('hinglish');
                          setCardLangOverrides({});
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                          selectedLang === 'hinglish'
                            ? 'bg-slate-800 text-white font-semibold shadow-sm border border-slate-700'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span>Hinglish (हिं + EN)</span>
                      </button>
                    </div>
                  </div>

                  {/* Document Overview Box */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-400" />
                        Document Overview ({selectedLang === 'english' ? 'English' : 'Hinglish'}):
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                        <Cpu className="w-3 h-3 text-slate-400" /> StudySphere Intelligence
                      </span>
                    </div>
                    <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
                      {renderSectionContent(
                        selectedLang === 'english'
                          ? (activeRecord.summary || 'Summary ready.')
                          : (activeRecord.summaryHinglish || activeRecord.summary || 'Summary ready.')
                      )}
                    </div>
                  </div>
                </div>

                {/* Topic-Wise Detailed Summarizer Section */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
                    <div>
                      <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-blue-400" />
                        Topic-by-Topic Breakdown ({topics.length} Topics Extracted)
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Detailed pedagogical explanations. Read in English or switch individual topics to Hinglish anytime.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        onClick={handleReanalyzeDeep}
                        disabled={isReanalyzingDeep}
                        className="text-xs font-medium text-slate-200 hover:text-white px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                        title="Re-analyze entire document with exhaustive depth"
                      >
                        {isReanalyzingDeep ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                            <span>Deepening All...</span>
                          </>
                        ) : (
                          <>
                            <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
                            <span>Deepen All Topics</span>
                          </>
                        )}
                      </button>

                      {topics.length > 0 && (
                        <button
                          onClick={() => toggleAllTopics(!allCollapsed, topics.length)}
                          className="text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 transition-colors flex items-center gap-1"
                        >
                          {allCollapsed ? 'Expand All' : 'Collapse All'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* List of Topic Cards */}
                  <div className="space-y-4">
                    {topics.map((topic, idx) => {
                      const cardLang = cardLangOverrides[idx] || selectedLang;
                      const isCollapsed = collapsedTopics[idx];
                      const explanation = cardLang === 'english'
                        ? (topic.englishExplanation || topic.hinglishExplanation)
                        : (topic.hinglishExplanation || topic.englishExplanation);
                      const isCurrentlyDeepened = Boolean(deepenedTopics[idx] ?? topic.isDeepenedActive);
                      const hasDeepenedHistory = Boolean(topic.originalEnglishExplanation || topic.deepenedEnglishExplanation || deepenedTopics[idx]);

                      return (
                        <div
                          key={idx}
                          className="rounded-2xl border border-slate-800/80 bg-slate-900/40 overflow-hidden hover:border-slate-700 transition-all duration-200"
                        >
                          {/* Card Header Bar */}
                          <div
                            onClick={() => setCollapsedTopics(prev => ({ ...prev, [idx]: !prev[idx] }))}
                            className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer bg-slate-900/60 hover:bg-slate-900/90 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono font-medium shrink-0">
                                Topic {String(idx + 1).padStart(2, '0')}
                              </span>
                              <h4 className="text-sm font-semibold text-slate-100 leading-snug">
                                {topic.topicTitle}
                              </h4>
                              {isCurrentlyDeepened ? (
                                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/25 text-blue-300 text-[11px] font-medium">
                                  <Layers className="w-3 h-3 text-blue-400" /> In-Depth Active
                                </span>
                              ) : hasDeepenedHistory ? (
                                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-medium">
                                  Standard
                                </span>
                              ) : null}
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto" onClick={e => e.stopPropagation()}>
                              {/* Per-card language toggle */}
                              <div className="flex items-center rounded-xl bg-slate-950 border border-slate-800 p-0.5 text-xs font-medium">
                                <button
                                  onClick={() => setCardLangOverrides(prev => ({ ...prev, [idx]: 'english' }))}
                                  className={`px-2.5 py-1 rounded-lg transition-all ${
                                    cardLang === 'english'
                                      ? 'bg-slate-800 text-white font-semibold shadow-sm'
                                      : 'text-slate-400 hover:text-slate-200'
                                  }`}
                                  title="Read this topic in English"
                                >
                                  EN
                                </button>
                                <button
                                  onClick={() => setCardLangOverrides(prev => ({ ...prev, [idx]: 'hinglish' }))}
                                  className={`px-2.5 py-1 rounded-lg transition-all ${
                                    cardLang === 'hinglish'
                                      ? 'bg-slate-800 text-white font-semibold shadow-sm'
                                      : 'text-slate-400 hover:text-slate-200'
                                  }`}
                                  title="Read this topic in Hinglish"
                                >
                                  Hinglish
                                </button>
                              </div>

                              {/* Restore Previous Summary / Toggle Version Button */}
                              {hasDeepenedHistory && (
                                <button
                                  onClick={() => handleToggleTopicVersion(idx)}
                                  className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
                                    isCurrentlyDeepened
                                      ? 'border-slate-700/80 bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white'
                                      : 'border-blue-500/40 bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 font-semibold shadow-sm'
                                  }`}
                                  title={isCurrentlyDeepened ? "Restore previous standard summary" : "Switch back to deepened masterclass"}
                                >
                                  {isCurrentlyDeepened ? (
                                    <>
                                      <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                                      <span className="hidden sm:inline">Previous Summary</span>
                                    </>
                                  ) : (
                                    <>
                                      <Layers className="w-3.5 h-3.5 text-blue-400" />
                                      <span className="hidden sm:inline">View Deepened</span>
                                    </>
                                  )}
                                </button>
                              )}

                              {/* Per-card Deepen with AI Button */}
                              <button
                                onClick={() => handleDeepenTopic(idx, topic.topicTitle)}
                                disabled={deepeningTopicIdx === idx}
                                className="px-3 py-1.5 rounded-xl border border-slate-700/80 bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                                title="Generate authentic in-depth masterclass"
                              >
                                {deepeningTopicIdx === idx ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                                    <span className="hidden sm:inline">Deepening...</span>
                                  </>
                                ) : (hasDeepenedHistory || deepenedTopics[idx]) ? (
                                  <>
                                    <Layers className="w-3.5 h-3.5 text-blue-400" />
                                    <span className="hidden sm:inline">Re-Deepen</span>
                                  </>
                                ) : (
                                  <>
                                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="hidden sm:inline">Deepen</span>
                                  </>
                                )}
                              </button>

                              {/* Per-card Quiz Gen Button */}
                              <button
                                onClick={() => handleStartTopicQuiz(topic.topicTitle, explanation)}
                                className="px-3 py-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                                title={`Generate practice quiz for ${topic.topicTitle}`}
                              >
                                <ListChecks className="w-3.5 h-3.5 text-blue-400" />
                                <span className="hidden sm:inline">Practice Quiz</span>
                              </button>

                              {/* Quick Ask Tutor Button */}
                              <button
                                onClick={() => handleAskAboutTopic(topic.topicTitle)}
                                className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                                title="Ask specific questions about this topic in PDF Chat"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                                <span className="hidden md:inline">Ask Tutor</span>
                              </button>

                              {/* Collapse/Expand toggle button */}
                              <button
                                onClick={() => setCollapsedTopics(prev => ({ ...prev, [idx]: !prev[idx] }))}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                              >
                                {isCollapsed ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronUp className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Card Content (Expandable) */}
                          {!isCollapsed && (
                            <div className="p-5 sm:p-6 border-t border-slate-800/80 space-y-4 bg-slate-950/40">
                              {/* Language Indicator & Deep Status */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-400 font-mono">
                                <span>
                                  Language: <span className="text-slate-200 font-semibold">{cardLang === 'english' ? 'English (EN)' : 'Hinglish (हिन्दी + English)'}</span>
                                </span>
                                <div className="flex items-center gap-2">
                                  {hasDeepenedHistory && (
                                    <button
                                      onClick={() => handleToggleTopicVersion(idx)}
                                      className="text-[11px] text-blue-400 hover:text-blue-300 underline underline-offset-2 flex items-center gap-1 font-sans font-medium"
                                      title={isCurrentlyDeepened ? "Revert to previous standard summary" : "Switch back to deepened masterclass"}
                                    >
                                      <RotateCcw className="w-3 h-3" />
                                      {isCurrentlyDeepened ? 'Restore Previous Summary' : 'Switch back to Deepened Version'}
                                    </button>
                                  )}
                                  {isCurrentlyDeepened ? (
                                    <span className="text-blue-400 font-medium flex items-center gap-1">
                                      <Layers className="w-3 h-3 text-blue-400" /> In-Depth Masterclass Active
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">
                                      Standard Mode (Click Deepen for expanded breakdown)
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Natural Mixture Explanation: Intro Paragraph + Vertical Subpoints */}
                              <div className="space-y-3">
                                {renderSectionContent(explanation)}
                              </div>

                              {/* Topic Quiz Action Box */}
                              <div className="pt-3 mt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-xl">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                                    <ListChecks className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <div className="text-xs font-semibold text-slate-200">Test Your Knowledge on {topic.topicTitle}</div>
                                    <div className="text-[11px] text-slate-400">Generate an instant, topic-specific 5-question practice quiz</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 self-end sm:self-auto">
                                  <button
                                    onClick={() => handleStartTopicQuiz(topic.topicTitle, explanation)}
                                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                                  >
                                    <HelpCircle className="w-3.5 h-3.5" />
                                    Take Topic Quiz
                                  </button>
                                  <button
                                    onClick={() => {
                                      const topicContext = `TOPIC: ${topic.topicTitle}\n\nEXPLANATION:\n${explanation}\n\nDOCUMENT:\n${activeRecord.extractedText || ''}`.substring(0, 30000);
                                      onGenerateQuizFromPDF(topicContext, topic.topicTitle);
                                    }}
                                    className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 border border-slate-700 transition-colors cursor-pointer"
                                    title="Open in full Quiz Generator workspace"
                                  >
                                    <span>Full Workspace</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}

          {activeTab === 'topics' && (
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <ListChecks className="w-5 h-5 text-blue-400" />
                    Extracted High-Yield Topics & Concepts
                  </h2>
                  <span className="text-xs text-slate-400">Derived strictly from {activeRecord.filename}</span>
                </div>

                <button
                  onClick={() => setActiveTab('summary')}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1.5 transition-all self-start sm:self-auto"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  View Detailed Topic Explanations
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeRecord.importantTopics && activeRecord.importantTopics.map((top, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between gap-3.5 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 font-mono">
                        {idx + 1}
                      </div>
                      <span className="text-xs font-medium text-slate-200 leading-relaxed">{top}</span>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80 justify-end flex-wrap">
                      <button
                        onClick={() => {
                          const topicName = top.split(':')[0].trim();
                          handleStartTopicQuiz(topicName);
                        }}
                        className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all cursor-pointer"
                        title={`Generate practice quiz for ${top}`}
                      >
                        <ListChecks className="w-3 h-3 text-emerald-400" />
                        Practice Quiz
                      </button>
                      <button
                        onClick={() => {
                          const topicName = top.split(':')[0].trim();
                          handleAskAboutTopic(topicName);
                        }}
                        className="text-[11px] font-medium text-slate-300 hover:text-white flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/80 transition-all cursor-pointer"
                      >
                        <MessageSquare className="w-3 h-3 text-slate-400" />
                        Ask Tutor
                      </button>
                      <button
                        onClick={() => setActiveTab('summary')}
                        className="text-[11px] font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 transition-all cursor-pointer"
                      >
                        Read Explanation &rarr;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-6">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-400" />
                Document Q&A Chat for {activeRecord.filename}
              </h2>

              <div className="space-y-4 max-h-80 overflow-y-auto">
                {activeRecord.chatHistory && activeRecord.chatHistory.length > 0 ? (
                  activeRecord.chatHistory.map((item, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="text-xs font-medium text-slate-200 bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                        Q: {item.q}
                      </div>
                      <div className="text-xs text-slate-200 bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 font-sans leading-relaxed">
                        {renderSectionContent(item.a)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    Ask any question about formulas, definitions, algorithms, or theories mentioned in this PDF.
                  </div>
                )}
                {isAsking && (
                  <div className="text-xs text-slate-400 flex items-center gap-2 animate-pulse">
                    <Search className="w-4 h-4 text-blue-400" /> Analyzing PDF document text for answer...
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                <input
                  type="text"
                  value={pdfChatQuery}
                  onChange={(e) => setPdfChatQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskPdfQuestion()}
                  placeholder={`Ask a question based on ${activeRecord.filename}...`}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleAskPdfQuestion}
                  disabled={!pdfChatQuery.trim() || isAsking}
                  className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 transition-all disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                  Ask
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Interactive In-Page Topic Quiz Modal */}
      {quizModalTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-6 relative text-slate-100 my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                  <ListChecks className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-blue-400 font-semibold">
                      Topic Diagnostic Quiz
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                      5 Questions
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white leading-snug line-clamp-1">
                    {quizModalTopic}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setQuizModalTopic(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close Quiz"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1. Loading State */}
            {isGeneratingTopicQuiz && (
              <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
                <Loader2 className="w-9 h-9 text-blue-400 animate-spin" />
                <div>
                  <div className="text-sm font-semibold text-slate-200">
                    Synthesizing 100% Accurate Questions...
                  </div>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    Analyzing core concepts, working mechanics, and exam rules for "{quizModalTopic}".
                  </p>
                </div>
              </div>
            )}

            {/* 2. Error State */}
            {!isGeneratingTopicQuiz && topicQuizError && (
              <div className="py-8 space-y-4 text-center">
                <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
                <div className="text-sm font-semibold text-rose-300">{topicQuizError}</div>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => handleStartTopicQuiz(quizModalTopic)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => setQuizModalTopic(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* 3. Quiz Questions Active State */}
            {!isGeneratingTopicQuiz && !topicQuizError && topicQuizQuestions.length > 0 && !topicQuizFinished && (() => {
              const currentQ = topicQuizQuestions[topicQuizCurrentIdx];
              const hasAnsweredCurrent = topicQuizSelectedAnswers[topicQuizCurrentIdx] !== undefined;
              const selectedOpt = topicQuizSelectedAnswers[topicQuizCurrentIdx];
              const isLastQuestion = topicQuizCurrentIdx === topicQuizQuestions.length - 1;

              return (
                <div className="space-y-5">
                  {/* Progress & Indicator */}
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-mono">
                      Question <strong className="text-slate-100">{topicQuizCurrentIdx + 1}</strong> of {topicQuizQuestions.length}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {topicQuizQuestions.map((_, dotIdx) => (
                        <span
                          key={dotIdx}
                          className={`w-2 h-2 rounded-full transition-all ${
                            dotIdx === topicQuizCurrentIdx
                              ? 'bg-blue-400 w-4'
                              : topicQuizSelectedAnswers[dotIdx] !== undefined
                              ? 'bg-emerald-400'
                              : 'bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Question Text */}
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                    <p className="text-sm sm:text-base font-semibold text-slate-100 leading-relaxed">
                      {currentQ.questionText}
                    </p>
                  </div>

                  {/* Options */}
                  <div className="space-y-2.5">
                    {currentQ.options.map((opt, optIdx) => {
                      const isSelected = selectedOpt === optIdx;
                      const isCorrect = optIdx === currentQ.correctOptionIndex;

                      let btnStyle = 'border-slate-800 bg-slate-900/80 text-slate-200 hover:border-slate-700 hover:bg-slate-800/80';
                      if (hasAnsweredCurrent) {
                        if (isCorrect) {
                          btnStyle = 'border-emerald-500/80 bg-emerald-500/15 text-emerald-200 font-semibold shadow-sm';
                        } else if (isSelected) {
                          btnStyle = 'border-rose-500/80 bg-rose-500/15 text-rose-200 font-semibold shadow-sm';
                        } else {
                          btnStyle = 'border-slate-800/60 bg-slate-900/40 text-slate-500 opacity-60';
                        }
                      }

                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleSelectTopicQuizOption(optIdx)}
                          disabled={hasAnsweredCurrent}
                          className={`w-full p-3.5 sm:p-4 rounded-xl border text-left text-xs sm:text-sm transition-all flex items-start gap-3 cursor-pointer disabled:cursor-default ${btnStyle}`}
                        >
                          <span className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700/80 flex items-center justify-center font-mono text-xs shrink-0 mt-0.5 text-slate-300">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="flex-1 leading-snug">{opt}</span>
                          {hasAnsweredCurrent && isCorrect && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                          )}
                          {hasAnsweredCurrent && isSelected && !isCorrect && (
                            <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation Box when answered */}
                  {hasAnsweredCurrent && (
                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/25 space-y-1.5 animate-fadeIn">
                      <div className="text-xs font-semibold text-blue-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Explanation & Key Concept:
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">
                        {currentQ.explanation}
                      </p>
                    </div>
                  )}

                  {/* Navigation / Next Button */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <span className="text-[11px] text-slate-500">
                      {hasAnsweredCurrent ? 'Review explanation and proceed' : 'Select an answer to reveal explanation'}
                    </span>

                    {hasAnsweredCurrent && (
                      <button
                        onClick={() => {
                          if (isLastQuestion) {
                            handleFinishTopicQuiz();
                          } else {
                            setTopicQuizCurrentIdx(prev => prev + 1);
                          }
                        }}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer"
                      >
                        <span>{isLastQuestion ? 'View Final Results' : 'Next Question'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* 4. Quiz Finished / Scorecard State */}
            {!isGeneratingTopicQuiz && !topicQuizError && topicQuizFinished && (() => {
              let correctCount = 0;
              topicQuizQuestions.forEach((q, idx) => {
                if (topicQuizSelectedAnswers[idx] === q.correctOptionIndex) correctCount++;
              });
              const scorePct = Math.round((correctCount / topicQuizQuestions.length) * 100);

              return (
                <div className="py-6 text-center space-y-6 animate-fadeIn">
                  <div className="w-16 h-16 rounded-3xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto shadow-lg">
                    <Award className="w-8 h-8" />
                  </div>

                  <div>
                    <span className="text-xs font-mono uppercase tracking-wider text-blue-400 font-semibold">
                      Topic Mastery Score
                    </span>
                    <h3 className="text-3xl font-extrabold text-white mt-1">
                      {scorePct}%
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">
                      You got <strong className="text-white">{correctCount}</strong> out of <strong className="text-white">{topicQuizQuestions.length}</strong> questions correct for "{quizModalTopic}".
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 max-w-md mx-auto text-xs text-slate-300 leading-relaxed">
                    {scorePct >= 80 ? (
                      <span className="text-emerald-300 font-medium">
                        🌟 Outstanding performance! Your mastery over this topic is rock solid.
                      </span>
                    ) : scorePct >= 60 ? (
                      <span className="text-blue-300 font-medium">
                        👍 Good effort! Review the explanations above to reinforce key points.
                      </span>
                    ) : (
                      <span className="text-amber-300 font-medium">
                        💡 Keep practicing! Review this topic's deep breakdown to target weak spots.
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-3 border-t border-slate-800">
                    <button
                      onClick={() => handleStartTopicQuiz(quizModalTopic)}
                      className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Retake Topic Quiz
                    </button>

                    <button
                      onClick={() => {
                        const topicContext = `TOPIC: ${quizModalTopic}\n\nDOCUMENT: ${activeRecord?.filename || ''}\n\n${activeRecord?.extractedText || ''}`.substring(0, 30000);
                        setQuizModalTopic(null);
                        onGenerateQuizFromPDF(topicContext, quizModalTopic);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-colors cursor-pointer"
                    >
                      <span>Full Quiz Workspace</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setQuizModalTopic(null)}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs border border-slate-800 transition-colors cursor-pointer"
                    >
                      Back to Document
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Delete Document Confirmation Modal */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md p-6 rounded-3xl glass-panel bg-gray-950 border border-red-500/30 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Saved Document?</h3>
                <p className="text-xs text-gray-400">Remove from analyzed documents list.</p>
              </div>
            </div>

            <p className="text-sm text-gray-300 bg-gray-900/60 p-3.5 rounded-2xl border border-gray-800 leading-relaxed">
              Are you sure you want to delete <strong className="text-white">"{docToDelete.filename}"</strong>?
              All extracted topics, formulas, summaries, and chat history for this document will be permanently removed.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteDocument}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold border border-red-400/30 cursor-pointer transition-colors shadow-lg shadow-red-950/40"
              >
                Yes, Delete Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
