import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Copy,
  Check,
  Trash2,
  Plus,
  FileText,
  Volume2,
  VolumeX,
  Sparkles,
  Loader2,
  AlertCircle,
  Paperclip,
  X,
  Bot,
  User as UserIcon,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ChatMessage, FileRecord } from '../types';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

export const ChatPage: React.FC = () => {
  const { language } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Document attachment
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<FileRecord | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  // Voice recording
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Speech synthesis
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    loadChatHistory();
    loadFiles();

    // Check for Web Speech API recognition
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsRecording(false);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const loadChatHistory = async () => {
    try {
      setInitialLoading(true);
      const history = await api.getChatHistory();
      setMessages(history);
    } catch {
      // ignore
    } finally {
      setInitialLoading(false);
    }
  };

  const loadFiles = async () => {
    try {
      const fileList = await api.getFiles();
      setFiles(fileList);
    } catch {
      // ignore
    }
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputMessage;
    if (!textToSend.trim() || loading) return;

    setError(null);
    const userMsg: ChatMessage = {
      id: 'temp-' + Date.now(),
      role: 'user',
      content: textToSend.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await api.sendMessage({
        message: textToSend.trim(),
        language,
        documentId: selectedDocument?.id,
      });

      const aiMsg: ChatMessage = {
        id: response.id || 'ai-' + Date.now(),
        role: 'model',
        content: response.content,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setError(err.message || 'Failed to get answer from SHAB.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to clear your chat conversation?')) return;
    try {
      await api.clearChatHistory();
      setMessages([]);
    } catch {
      setError('Failed to clear conversation history.');
    }
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Chrome/Edge.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.lang =
          language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : 'en-US';
        recognitionRef.current.start();
        setIsRecording(true);
      } catch {
        setIsRecording(false);
      }
    }
  };

  const toggleSpeech = (id: string, text: string) => {
    if (speakingMessageId === id) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#`_>-]/g, ' ');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : 'en-US';
    utterance.rate = 1.0;

    utterance.onend = () => {
      setSpeakingMessageId(null);
    };
    utterance.onerror = () => {
      setSpeakingMessageId(null);
    };

    setSpeakingMessageId(id);
    window.speechSynthesis.speak(utterance);
  };

  const copyResponse = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const examShortcuts = [
    { label: '2 Marks Definition', prompt: 'Define and explain the core concept in 2 marks exam format with key point.' },
    { label: '5 Marks Answer', prompt: 'Explain this topic in 5 marks format with definition, 4 bullet points, and an example.' },
    { label: '10 Marks Breakdown', prompt: 'Provide a comprehensive 10-mark semester answer with introduction, architecture/components, step-by-step working, advantages, disadvantages, and conclusion.' },
    { label: 'Comparison Table', prompt: 'Create a clear comparison table contrasting the key features, differences, and parameters.' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-white">
      {/* Top Header & Context Bar */}
      <div className="px-5 py-3.5 bg-white/90 backdrop-blur-md border-b border-[#E2E8F0] shadow-sm flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
              <span>SHAB AI Tutor</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] border border-blue-200 font-bold">
                Gemini 2.5
              </span>
            </div>
            <div className="text-xs text-[#64748B]">
              Ask doubts, university exam answers, or document queries
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Document Attachment Indicator / Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm ${
                selectedDocument
                  ? 'bg-blue-50 text-[#2563EB] border border-blue-200'
                  : 'bg-white hover:bg-slate-50 text-[#64748B] border border-[#E2E8F0]'
              }`}
            >
              <Paperclip className="w-3.5 h-3.5 text-[#2563EB]" />
              <span className="truncate max-w-[140px]">
                {selectedDocument ? selectedDocument.name : 'Attach Document'}
              </span>
            </button>

            {showAttachMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowAttachMenu(false)} />
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-[#E2E8F0] p-2 shadow-2xl z-20">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider border-b border-slate-100">
                    Select Context Document
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDocument(null);
                      setShowAttachMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                      !selectedDocument ? 'bg-blue-50 text-[#2563EB] font-bold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    No document (Global Knowledge)
                  </button>
                  {files.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-slate-400">No uploaded files found.</div>
                  ) : (
                    files.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          setSelectedDocument(f);
                          setShowAttachMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium truncate flex items-center gap-2 transition-colors ${
                          selectedDocument?.id === f.id ? 'bg-blue-50 text-[#2563EB] font-bold' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                        <span className="truncate">{f.name}</span>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          {selectedDocument && (
            <button
              type="button"
              onClick={() => setSelectedDocument(null)}
              className="p-1.5 text-[#64748B] hover:text-[#0F172A] bg-white rounded-full border border-[#E2E8F0] shadow-sm"
              title="Remove document context"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setMessages([])}
            className="px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-50 border border-[#E2E8F0] text-xs font-semibold text-[#64748B] hover:text-[#0F172A] flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            title="New Chat session"
          >
            <Plus className="w-3.5 h-3.5 text-[#2563EB]" />
            <span className="hidden sm:inline">New Chat</span>
          </button>

          <button
            type="button"
            onClick={handleClearHistory}
            className="p-2 rounded-full bg-white hover:bg-red-50 border border-[#E2E8F0] hover:border-red-200 text-[#64748B] hover:text-[#DC2626] transition-colors shadow-sm cursor-pointer"
            title="Clear Chat History"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Exam Format Quick Filters */}
      <div className="px-5 py-2.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
        <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[#2563EB]" />
          Format:
        </span>
        {examShortcuts.map((sc, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setInputMessage(sc.prompt)}
            className="px-3 py-1 rounded-full text-xs font-medium text-[#64748B] hover:text-[#2563EB] bg-white hover:bg-[#EFF6FF] border border-[#E2E8F0] hover:border-blue-200 shrink-0 transition-all shadow-sm cursor-pointer"
          >
            {sc.label}
          </button>
        ))}
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6 bg-gradient-to-b from-[#F8FAFC] via-white to-[#F8FAFC]">
        {initialLoading ? (
          <div className="flex items-center justify-center h-full text-[#64748B] text-xs">
            <Loader2 className="w-5 h-5 animate-spin text-[#2563EB] mr-2" />
            Loading conversations...
          </div>
        ) : messages.length === 0 ? (
          <div className="max-w-xl mx-auto my-auto text-center py-12 px-4">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-500/20 text-white animate-float-slow">
              <Bot className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
              Ask SHAB anything about your studies
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] mt-2 leading-relaxed">
              I can explain difficult topics, craft 2/5/10 marks exam answers, summarize textbooks, or quiz your knowledge.
            </p>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              <button
                type="button"
                onClick={() =>
                  handleSendMessage('Explain the 5 V\'s of Big Data in 5 points.')
                }
                className="p-4 rounded-2xl bg-white hover:bg-blue-50/40 border border-[#E2E8F0] hover:border-blue-300 text-xs text-[#64748B] hover:text-[#0F172A] transition-all text-left shadow-sm hover:shadow-md cursor-pointer"
              >
                <div className="font-bold text-[#0F172A] mb-0.5">Big Data Exam Question</div>
                <div className="text-[11px] text-[#64748B]">"Explain the 5 V's of Big Data in 5 points"</div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleSendMessage('What is database normalization? Explain 1NF, 2NF, and 3NF in 5 marks format.')
                }
                className="p-4 rounded-2xl bg-white hover:bg-blue-50/40 border border-[#E2E8F0] hover:border-blue-300 text-xs text-[#64748B] hover:text-[#0F172A] transition-all text-left shadow-sm hover:shadow-md cursor-pointer"
              >
                <div className="font-bold text-[#0F172A] mb-0.5">DBMS 5 Marks</div>
                <div className="text-[11px] text-[#64748B]">"What is normalization? Explain 1NF, 2NF, 3NF"</div>
              </button>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id || index}
                className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 text-xs font-bold shadow-sm ${
                    isUser
                      ? 'bg-blue-100 text-[#1D4ED8] border border-blue-200'
                      : 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-blue-500/25'
                  }`}
                >
                  {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Body */}
                <div
                  className={`rounded-3xl p-5 border transition-all ${
                    isUser
                      ? 'bg-[#EFF6FF] text-[#1D4ED8] border-blue-200/80 rounded-tr-none shadow-sm'
                      : 'bg-[#FFFFFF] text-[#0F172A] border-[#E2E8F0] rounded-tl-none shadow-md shadow-blue-500/5'
                  }`}
                >
                  {isUser ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{msg.content}</p>
                  ) : (
                    <>
                      <MarkdownRenderer content={msg.content} />

                      {/* AI Toolbar: Copy & Read Aloud */}
                      <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-xs text-[#64748B]">
                        <span className="text-[11px] font-mono">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => toggleSpeech(msg.id, msg.content)}
                            className="flex items-center gap-1.5 hover:text-[#2563EB] transition-colors cursor-pointer"
                            title="Read response aloud"
                          >
                            {speakingMessageId === msg.id ? (
                              <>
                                <VolumeX className="w-3.5 h-3.5 text-[#2563EB]" />
                                <span className="text-[#2563EB] font-bold">Stop</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3.5 h-3.5" />
                                <span>Listen</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => copyResponse(msg.id, msg.content)}
                            className="flex items-center gap-1.5 hover:text-[#2563EB] transition-colors cursor-pointer"
                            title="Copy response"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                                <span className="text-[#16A34A] font-bold">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* AI Thinking State with Subtle Blue Glow & Animated Dots */}
        {loading && (
          <div className="flex gap-3 max-w-xl mr-auto">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 text-white shadow-md shadow-blue-500/25">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="p-4 rounded-3xl rounded-tl-none bg-[#FFFFFF] border border-blue-200/80 shadow-lg shadow-blue-500/15 flex items-center gap-3 text-xs text-[#1D4ED8]">
              <Sparkles className="w-4 h-4 text-[#2563EB] animate-spin" />
              <span className="font-semibold">SHAB is thinking</span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-xs text-[#DC2626] max-w-xl">
            <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area with Rounded Pill Design */}
      <div className="p-4 sm:p-5 bg-white border-t border-[#E2E8F0] shrink-0 shadow-lg">
        <div className="max-w-4xl mx-auto">
          {selectedDocument && (
            <div className="mb-2.5 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EFF6FF] border border-blue-200 text-xs text-[#2563EB]">
              <FileText className="w-3.5 h-3.5 text-[#2563EB]" />
              <span className="text-[#64748B]">Context active:</span>
              <span className="font-bold text-[#0F172A] truncate">{selectedDocument.name}</span>
              <button
                type="button"
                onClick={() => setSelectedDocument(null)}
                className="ml-auto text-[#64748B] hover:text-[#0F172A] p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="relative flex items-center bg-[#F8FAFC] border border-[#E2E8F0] focus-within:border-[#2563EB] focus-within:ring-4 focus-within:ring-blue-100 rounded-full p-1.5 pl-4 transition-all shadow-sm"
          >
            {/* Attach button */}
            <button
              type="button"
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              className="p-2 rounded-full text-[#64748B] hover:text-[#2563EB] hover:bg-white transition-colors"
              title="Attach document"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Input field */}
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask SHAB anything about your studies..."
              disabled={loading}
              className="flex-1 bg-transparent border-0 px-3 py-2 text-sm text-[#0F172A] placeholder-slate-400 focus:outline-none focus:ring-0"
            />

            {/* Mic button */}
            <button
              type="button"
              onClick={toggleRecording}
              className={`p-2 rounded-full transition-all mr-1 ${
                isRecording
                  ? 'bg-red-100 text-[#DC2626] border border-red-300 animate-pulse'
                  : 'text-[#64748B] hover:text-[#2563EB] hover:bg-white'
              }`}
              title={isRecording ? 'Listening... click to stop' : 'Speech-to-text'}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Send circular blue button */}
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md shadow-blue-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center shrink-0 cursor-pointer hover:scale-105"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
