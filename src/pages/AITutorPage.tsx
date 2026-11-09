import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  RotateCcw,
  Copy,
  Check,
  Plus,
  Trash2,
  GraduationCap,
  Layers,
  Target,
  BookOpen,
  MessageSquare,
  ArrowRight,
  Brain,
  Sparkles,
  Bot,
  User,
  X,
} from 'lucide-react';
import { LearningLevel, ChatMessage, AIConversation } from '../types';
import { DataStore } from '../lib/dataStore';
import { syncAIMessageToSupabase, deleteConversationFromSupabase } from '../lib/supabaseSync';

interface AITutorPageProps {
  initialQuery?: string;
  onClearInitialQuery?: () => void;
}

const formatInline = (text: string): React.ReactNode => {
  if (!text) return null;
  const tokens = text.split(/(\*\*.*?\*\*|`.*?`|\$\$.*?\$\$|\$.*?\$)/g);

  return tokens.map((token, idx) => {
    if (token.startsWith('**') && token.endsWith('**') && token.length >= 4) {
      return (
        <strong key={idx} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith('`') && token.endsWith('`') && token.length >= 2) {
      return (
        <code key={idx} className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-xs">
          {token.slice(1, -1)}
        </code>
      );
    }
    if (token.startsWith('$$') && token.endsWith('$$') && token.length >= 4) {
      return (
        <span key={idx} className="font-mono text-amber-300 font-semibold px-1">
          {token.slice(2, -2)}
        </span>
      );
    }
    if (token.startsWith('$') && token.endsWith('$') && token.length >= 2) {
      return (
        <span key={idx} className="font-mono text-amber-300 font-semibold px-0.5">
          {token.slice(1, -1)}
        </span>
      );
    }
    return token;
  });
};

const renderFormattedContent = (content: string) => {
  if (!content) return null;
  const parts = content.split(/(```[\s\S]*?```)/g);

  return parts.map((part, pIdx) => {
    if (part.startsWith('```')) {
      const match = part.match(/^```(\w+)?\n?([\s\S]*?)```$/);
      const language = match ? match[1] || '' : '';
      const code = match ? match[2] : part.slice(3, -3);
      return (
        <div key={pIdx} className="my-2.5 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden font-mono text-xs">
          {language && (
            <div className="px-3 py-1 bg-slate-900 border-b border-slate-800 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {language}
            </div>
          )}
          <pre className="p-3 text-cyan-300 overflow-x-auto whitespace-pre">{code.trim()}</pre>
        </div>
      );
    }

    const lines = part.split('\n');
    const elements: React.ReactNode[] = [];
    let tableBuffer: string[] = [];

    const flushTable = (keyPrefix: string) => {
      if (tableBuffer.length === 0) return;
      const rows = tableBuffer
        .map((r) => r.trim())
        .filter((r) => r.startsWith('|') && r.endsWith('|'))
        .map((r) =>
          r
            .slice(1, -1)
            .split('|')
            .map((c) => c.trim())
        );

      if (rows.length > 0) {
        const isSeparator = (row: string[]) => row.every((c) => /^[-:]+$/.test(c));
        const headerRow = rows[0];
        const dataRows = rows.slice(1).filter((r) => !isSeparator(r));

        elements.push(
          <div key={`tbl_${keyPrefix}`} className="my-3 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/90 text-slate-200 border-b border-slate-800">
                  {headerRow.map((col, cIdx) => (
                    <th key={cIdx} className="p-2.5 font-bold">
                      {formatInline(col)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {dataRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-800/30">
                    {row.map((col, cIdx) => (
                      <td key={cIdx} className="p-2.5 text-slate-300">
                        {formatInline(col)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      tableBuffer = [];
    };

    lines.forEach((line, lIdx) => {
      const trimmed = line.trim();

      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        tableBuffer.push(trimmed);
        return;
      } else if (tableBuffer.length > 0) {
        flushTable(`${pIdx}_${lIdx}`);
      }

      if (!trimmed) {
        elements.push(<div key={`sp_${lIdx}`} className="h-1.5" />);
        return;
      }

      if (trimmed.startsWith('### ')) {
        elements.push(
          <h4 key={`h3_${lIdx}`} className="text-sm font-bold text-blue-400 mt-3 mb-1">
            {formatInline(trimmed.replace(/^###\s+/, ''))}
          </h4>
        );
        return;
      }
      if (trimmed.startsWith('## ')) {
        elements.push(
          <h3 key={`h2_${lIdx}`} className="text-base font-bold text-white mt-3.5 mb-1.5">
            {formatInline(trimmed.replace(/^##\s+/, ''))}
          </h3>
        );
        return;
      }

      if (/^[-*•]\s+/.test(trimmed)) {
        const itemContent = trimmed.replace(/^[-*•]\s+/, '');
        elements.push(
          <div key={`li_${lIdx}`} className="flex items-start gap-2.5 my-1 text-slate-300 text-xs sm:text-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
            <span className="flex-1 leading-relaxed">{formatInline(itemContent)}</span>
          </div>
        );
        return;
      }

      const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
      if (numMatch) {
        elements.push(
          <div key={`num_${lIdx}`} className="flex items-start gap-2.5 my-1 text-slate-300 text-xs sm:text-sm">
            <span className="text-xs font-mono font-bold text-blue-400 shrink-0 mt-0.5">{numMatch[1]}.</span>
            <span className="flex-1 leading-relaxed">{formatInline(numMatch[2])}</span>
          </div>
        );
        return;
      }

      elements.push(
        <p key={`p_${lIdx}`} className="my-1.5 text-slate-200 text-xs sm:text-sm leading-relaxed">
          {formatInline(line)}
        </p>
      );
    });

    flushTable(`${pIdx}_end`);
    return <div key={pIdx}>{elements}</div>;
  });
};

export const AITutorPage: React.FC<AITutorPageProps> = ({ initialQuery, onClearInitialQuery }) => {
  const [learningLevel, setLearningLevel] = useState<LearningLevel>('intermediate');
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [conversations, setConversations] = useState<AIConversation[]>(() => {
    const saved = DataStore.getConversations();
    if (saved && saved.length > 0) return saved;
    return [
      {
        id: `conv_${Date.now()}`,
        userId: DataStore.getActiveUser().id,
        title: 'Study Assistant Session',
        updatedAt: new Date().toISOString(),
        messages: [],
      },
    ];
  });

  const [activeConvId, setActiveConvId] = useState<string>(() => {
    const saved = DataStore.getConversations();
    return saved && saved.length > 0 ? saved[0].id : '';
  });
  const [convToDelete, setConvToDelete] = useState<AIConversation | null>(null);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  const currentConv = conversations.find((c) => c.id === activeConvId) || conversations[0];

  useEffect(() => {
    if (conversations.length > 0) {
      DataStore.saveConversations(conversations);
    }
  }, [conversations]);

  useEffect(() => {
    if (!activeConvId && conversations.length > 0) {
      setActiveConvId(conversations[0].id);
    }
  }, [conversations, activeConvId]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConv?.messages, isLoading]);

  useEffect(() => {
    if (initialQuery) {
      handleSendMessage(initialQuery);
      if (onClearInitialQuery) onClearInitialQuery();
    }
  }, [initialQuery]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      conversationId: activeConvId,
      sender: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const convTitle = currentConv?.messages.length === 0 ? query.slice(0, 30) + '...' : (currentConv?.title || 'Study Session');

    // Update messages locally
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConvId
          ? {
              ...c,
              title: convTitle,
              messages: [...c.messages, userMsg],
            }
          : c
      )
    );

    // Sync user message to Supabase
    syncAIMessageToSupabase(activeConvId, convTitle, userMsg).catch((e) => console.warn('Supabase AI user msg sync:', e));

    if (!textToSend) setInputQuery('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          learningLevel,
          conversationHistory: currentConv?.messages || [],
        }),
      });

      const data = await res.json();
      const aiResponseContent = data.response || 'I processed your query. Let me know if you need further clarification!';

      const aiMsg: ChatMessage = {
        id: `msg_ai_${Date.now()}`,
        conversationId: activeConvId,
        sender: 'ai',
        content: aiResponseContent,
        learningLevel,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setConversations((prev) =>
        prev.map((c) => (c.id === activeConvId ? { ...c, messages: [...c.messages, aiMsg] } : c))
      );

      // Sync AI reply to Supabase
      syncAIMessageToSupabase(activeConvId, convTitle, aiMsg).catch((e) => console.warn('Supabase AI reply sync:', e));
    } catch (error) {
      console.error('Error contacting AI backend:', error);
      const lower = query.toLowerCase().trim();
      let fallbackText = `I couldn't reach the server right now. Please verify that the local server is running and try again!`;
      if (lower === 'hi' || lower === 'hello' || lower === 'hey' || lower === 'hii' || lower === 'namaste' || lower === 'kaise ho') {
        fallbackText = `Hello! How can I help you with your studies or questions today?`;
      }
      const fallbackMsg: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        conversationId: activeConvId,
        sender: 'ai',
        content: fallbackText,
        learningLevel,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setConversations((prev) =>
        prev.map((c) => (c.id === activeConvId ? { ...c, messages: [...c.messages, fallbackMsg] } : c))
      );

      // Sync fallback to Supabase
      syncAIMessageToSupabase(activeConvId, convTitle, fallbackMsg).catch((e) => console.warn('Supabase AI fallback sync:', e));
    } finally {
      setIsLoading(false);
    }
  };

  const createNewConversation = () => {
    const newConv: AIConversation = {
      id: `conv_${Date.now()}`,
      userId: DataStore.getActiveUser().id,
      title: 'New Conversation',
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConvId(newConv.id);
  };

  const deleteConversation = (convId: string) => {
    setConversations((prev) => {
      const remaining = prev.filter((c) => c.id !== convId);
      if (remaining.length === 0) {
        const fresh: AIConversation = {
          id: `conv_${Date.now()}`,
          userId: DataStore.getActiveUser().id,
          title: 'Study Assistant Session',
          updatedAt: new Date().toISOString(),
          messages: [],
        };
        setActiveConvId(fresh.id);
        return [fresh];
      }
      if (activeConvId === convId) {
        setActiveConvId(remaining[0].id);
      }
      deleteConversationFromSupabase(convId).catch((e) => console.warn('Delete conv Supabase:', e));
      return remaining;
    });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="h-[calc(100vh-125px)] grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn pb-2">
      {/* Left Sidebar: Conversations History */}
      <div className="hidden lg:flex lg:col-span-3 glass-panel bg-slate-950/80 rounded-3xl border border-slate-800 p-4 flex-col justify-between">
        <div className="space-y-3">
          <button
            onClick={createNewConversation}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center justify-center gap-2 border border-blue-400/30 transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat Session</span>
          </button>

          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 pt-2">
            History ({conversations.length})
          </div>

          <div className="space-y-1 overflow-y-auto max-h-[50vh] pr-1">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group w-full p-2.5 rounded-xl text-left text-xs font-medium flex items-center justify-between transition-all ${
                  activeConvId === conv.id
                    ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <button
                  onClick={() => setActiveConvId(conv.id)}
                  className="flex items-center gap-2.5 truncate flex-1 text-left min-w-0 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 shrink-0 text-blue-400" />
                  <span className="truncate">{conv.title || 'Conversation'}</span>
                </button>
                {conversations.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConvToDelete(conv);
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:text-rose-400 p-1 text-slate-500 transition-opacity ml-1 shrink-0 cursor-pointer"
                    title="Delete conversation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
          💡 <strong className="text-white">Tip:</strong> Switch to <span className="text-amber-400 font-semibold">Exam Focused</span> level above for step-by-step marking schemes and model answers!
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="lg:col-span-9 glass-panel bg-slate-950/90 rounded-3xl border border-slate-800 flex flex-col justify-between overflow-hidden shadow-2xl">
        {/* Top Control Bar: Learning Level Selector */}
        <div className="px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Study Tutor AI
                <span className="text-[10px] font-mono bg-blue-500/15 text-blue-300 px-2 py-0.5 rounded-full font-bold border border-blue-500/25">
                  Academic Engine
                </span>
              </h2>
              <p className="text-xs text-slate-400">Concept breakdowns, exam proofs, code analysis, and Q&A</p>
            </div>
          </div>

          {/* Level Switcher */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <button
              onClick={() => setLearningLevel('beginner')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                learningLevel === 'beginner'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Beginner</span>
            </button>
            <button
              onClick={() => setLearningLevel('intermediate')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                learningLevel === 'intermediate'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Intermediate</span>
            </button>
            <button
              onClick={() => setLearningLevel('exam_focused')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                learningLevel === 'exam_focused'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Exam Focused</span>
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {(!currentConv || currentConv.messages.length === 0) && (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-6 my-auto">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 shadow-inner">
                <Brain className="w-8 h-8" />
              </div>
              <div className="max-w-md space-y-2">
                <h3 className="text-xl font-bold text-white">How can I assist your study session?</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ask any question across computer science, engineering, or mathematics. Choose your explanation depth above.
                </p>
              </div>

              {/* Starter Question Chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-lg w-full text-left">
                {[
                  'Explain QuickSort partition logic',
                  'Difference between Process and Thread',
                  'Explain B-Trees and indexing in DBMS',
                  'How does TCP 3-way handshake work?'
                ].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => {
                      setInputQuery(q);
                      handleSendMessage(q);
                    }}
                    className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-blue-500/40 text-slate-300 hover:text-white text-xs text-left transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <span>{q}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentConv?.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-400 shrink-0 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none shadow-md'
                    : 'bg-slate-900/80 border border-slate-800 text-slate-200 rounded-tl-none shadow-sm'
                }`}
              >
                {msg.sender === 'ai' ? (
                  <div className="space-y-2">
                    {renderFormattedContent(msg.content)}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                      <span>{msg.timestamp || 'Just now'}</span>
                      <button
                        onClick={() => copyToClipboard(msg.content, msg.id)}
                        className="flex items-center gap-1 hover:text-slate-300 transition-colors cursor-pointer"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Answer</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <div className="text-[10px] text-blue-200/80 text-right mt-1">{msg.timestamp || 'Sent'}</div>
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-3.5 justify-start">
              <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-400 shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 rounded-tl-none flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:0.4s]" />
                <span className="text-xs text-slate-400 ml-1">Analyzing concept & formulating explanation...</span>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/40">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-3"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask about formulas, algorithms, exam questions, or concept derivations..."
              className="flex-1 py-3 px-4 rounded-2xl bg-slate-950/80 border border-slate-800 focus:border-blue-500 text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none transition-all shadow-inner"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isLoading}
              className="p-3 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white transition-all cursor-pointer shadow-sm shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Delete Conversation Confirmation Modal */}
      {convToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md p-6 rounded-3xl glass-panel bg-slate-950 border border-rose-500/30 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Chat Session?</h3>
                <p className="text-xs text-slate-400">This conversation will be cleared from your history.</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
              Are you sure you want to delete <strong className="text-white">"{convToDelete.title}"</strong>?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConvToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteConversation(convToDelete.id);
                  setConvToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold border border-rose-400/30 cursor-pointer transition-colors"
              >
                Yes, Delete Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
