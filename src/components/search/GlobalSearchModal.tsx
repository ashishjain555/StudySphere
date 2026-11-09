import React, { useState, useEffect } from 'react';
import { Search, X, BookOpen, FileText, HelpCircle, MessageSquare, ArrowRight, CornerDownLeft } from 'lucide-react';
import { DataStore } from '../../lib/dataStore';
import { SearchResultItem } from '../../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
  onAskAI: (query: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onAskAI,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open search trigger handled externally or here
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const q = query.toLowerCase();
    const items: SearchResultItem[] = [];

    // Search Subjects
    (DataStore.getSubjects() || []).forEach((s) => {
      if (!s) return;
      if (
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.code && s.code.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q))
      ) {
        items.push({
          id: s.id,
          type: 'subject',
          title: `${s.code}: ${s.name}`,
          subtitle: s.description,
          link: `/app/subjects/${s.id}`,
          extraInfo: `${s.topicCount} Topics • ${s.progressPercentage}% Complete`,
        });
      }
    });

    // Search Topics & Notes
    (DataStore.getTopics() || []).forEach((t) => {
      if (!t) return;
      if (
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.unitName && t.unitName.toLowerCase().includes(q))
      ) {
        items.push({
          id: t.id,
          type: 'topic',
          title: t.title,
          subtitle: `${t.unitName} — ${t.description}`,
          link: `/app/subjects/${t.subjectId}?topic=${t.id}`,
          extraInfo: `${t.durationMins} mins • ${t.difficulty.toUpperCase()}`,
        });
      }
    });

    // Search Study Materials
    (DataStore.getMaterials() || []).forEach((m) => {
      if (!m) return;
      if (
        (m.title && m.title.toLowerCase().includes(q)) ||
        (m.description && m.description.toLowerCase().includes(q))
      ) {
        items.push({
          id: m.id,
          type: 'pdf',
          title: m.title,
          subtitle: m.description,
          link: `/app/materials?id=${m.id}`,
          extraInfo: `${m.fileType.toUpperCase()} • ${m.fileSize || 'PDF'}`,
        });
      }
    });

    setResults(items);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl glass-panel bg-gray-900/90 rounded-2xl border border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-modalPop">
        {/* Top Search Bar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-gray-800">
          <Search className="w-5 h-5 text-gray-400 mr-3 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search subjects, topics, notes, materials, questions..."
            className="w-full bg-transparent text-gray-100 placeholder-gray-500 text-base focus:outline-none"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-gray-200 transition-colors mr-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-mono bg-gray-800 border border-gray-700 rounded text-gray-400">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="overflow-y-auto p-4 space-y-2 flex-1">
          {query.trim().length > 0 && (
            <div
              onClick={() => {
                onAskAI(query);
                onClose();
              }}
              className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-blue-500/50 cursor-pointer flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-100 flex items-center gap-2">
                    Ask Study Tutor about "{query}"
                    <span className="text-[10px] bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded-full font-mono">
                      Study Assistant
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">Generate a custom explanation, exam tips, and code examples</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-transform" />
            </div>
          )}

          {results.length > 0 ? (
            results.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onNavigate(item.link);
                  onClose();
                }}
                className="p-3.5 rounded-xl bg-gray-800/40 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 cursor-pointer flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-700/50 flex items-center justify-center text-gray-300">
                    {item.type === 'subject' && <BookOpen className="w-4 h-4 text-indigo-400" />}
                    {item.type === 'topic' && <FileText className="w-4 h-4 text-emerald-400" />}
                    {item.type === 'pdf' && <FileText className="w-4 h-4 text-rose-400" />}
                    {item.type === 'question' && <HelpCircle className="w-4 h-4 text-amber-400" />}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-200">{item.title}</div>
                    <div className="text-xs text-gray-400 line-clamp-1">{item.subtitle}</div>
                  </div>
                </div>
                {item.extraInfo && (
                  <span className="text-[11px] font-mono text-gray-400 bg-gray-900/60 px-2.5 py-1 rounded-md border border-gray-800">
                    {item.extraInfo}
                  </span>
                )}
              </div>
            ))
          ) : query.trim().length > 0 ? (
            <div className="py-12 text-center text-gray-400">
              <Search className="w-8 h-8 mx-auto mb-2 text-gray-600" />
              <p className="text-sm">No exact matches found for "{query}"</p>
              <p className="text-xs text-gray-500 mt-1">Try asking the AI Tutor above for custom explanations!</p>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500 text-xs">
              Type keywords like <span className="text-indigo-400">"Data Structures"</span>, <span className="text-indigo-400">"Linked List"</span>, or <span className="text-indigo-400">"SQL"</span>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-gray-950/80 border-t border-gray-800 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <CornerDownLeft className="w-3 h-3" /> Select item
            </span>
            <span>ESC to close</span>
          </div>
          <span>StudySphere Intelligent Search</span>
        </div>
      </div>
    </div>
  );
};
