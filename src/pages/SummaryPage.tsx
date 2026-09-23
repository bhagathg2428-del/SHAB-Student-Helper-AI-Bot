import React, { useState, useEffect } from 'react';
import {
  FileText,
  Sparkles,
  Copy,
  Check,
  BookmarkPlus,
  Download,
  AlertCircle,
  Loader2,
  FileCheck2,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FileRecord } from '../types';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

export const SummaryPage: React.FC = () => {
  const { language } = useAuth();
  const [inputText, setInputText] = useState('');
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [summaryType, setSummaryType] = useState<string>('quick');
  const [answerLength, setAnswerLength] = useState<string>('5_marks');
  const [loading, setLoading] = useState(false);
  const [generatedSummary, setGeneratedSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [savedAsNote, setSavedAsNote] = useState(false);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      const list = await api.getFiles();
      setFiles(list);
    } catch {
      // ignore
    }
  };

  const handleGenerate = async () => {
    if (!inputText.trim() && !selectedFileId) {
      setError('Please either paste study text or select an uploaded document.');
      return;
    }

    setError(null);
    setLoading(true);
    setGeneratedSummary(null);
    setSavedAsNote(false);

    try {
      const res = await api.generateSummary({
        text: inputText.trim() || undefined,
        fileId: selectedFileId || undefined,
        summaryType,
        answerLength,
        language,
      });
      setGeneratedSummary(res.summary);
    } catch (err: any) {
      setError(err.message || 'Failed to generate summary.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedSummary) return;
    navigator.clipboard.writeText(generatedSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveAsNote = async () => {
    if (!generatedSummary || savedAsNote) return;
    try {
      const selectedFile = files.find((f) => f.id === selectedFileId);
      const noteTitle = selectedFile
        ? `Summary: ${selectedFile.name}`
        : `Summary: ${inputText.slice(0, 30)}...`;

      await api.createNote({
        title: noteTitle,
        content: generatedSummary,
      });
      setSavedAsNote(true);
      setTimeout(() => setSavedAsNote(false), 3000);
    } catch {
      setError('Failed to save summary as note.');
    }
  };

  const handleDownload = () => {
    if (!generatedSummary) return;
    const blob = new Blob([generatedSummary], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shab-summary-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto bg-[#F8FAFC]">
      {/* Title */}
      <div className="bg-white p-6 rounded-3xl border border-[#E2E8F0] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
              Smart Academic Summary
            </h1>
            <p className="text-sm text-[#64748B] mt-0.5 font-medium">
              Transform dense textbooks and documents into exam-ready revision breakdowns.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-xs text-[#DC2626] font-medium">
          <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Input Selection */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm space-y-5">
            {/* Document Select */}
            <div>
              <label className="block text-xs font-bold text-[#1D4ED8] mb-2 uppercase tracking-wider">
                Option 1: Choose from Uploaded Documents
              </label>
              <select
                value={selectedFileId}
                onChange={(e) => {
                  setSelectedFileId(e.target.value);
                  if (e.target.value) setInputText('');
                }}
                className="w-full px-4 py-3 rounded-2xl bg-white border border-[#E2E8F0] text-[#0F172A] text-xs sm:text-sm focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 focus:outline-none shadow-sm transition-all"
              >
                <option value="">-- Select an uploaded syllabus or lecture file --</option>
                {files.map((file) => (
                  <option key={file.id} value={file.id}>
                    📄 {file.name} ({(file.size / 1024).toFixed(0)} KB)
                  </option>
                ))}
              </select>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-[#E2E8F0]" />
              <span className="flex-shrink mx-4 text-xs font-mono font-bold text-slate-400 uppercase">OR</span>
              <div className="flex-grow border-t border-[#E2E8F0]" />
            </div>

            {/* Paste Text */}
            <div>
              <label className="block text-xs font-bold text-[#1D4ED8] mb-2 uppercase tracking-wider">
                Option 2: Paste Textbook Excerpt or Notes
              </label>
              <textarea
                rows={7}
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  if (e.target.value) setSelectedFileId('');
                }}
                placeholder="Paste paragraph, syllabus topic, lecture transcripts, or textbook excerpt here..."
                className="w-full p-4 rounded-2xl bg-white border border-[#E2E8F0] text-[#0F172A] text-xs sm:text-sm placeholder-slate-400 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 focus:outline-none resize-none shadow-sm transition-all"
              />
            </div>
          </div>
        </div>

        {/* Right: Summary Options */}
        <div className="space-y-4">
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm space-y-5">
            <div>
              <label className="block text-xs font-bold text-[#1D4ED8] mb-3 uppercase tracking-wider">
                Summary Type
              </label>
              <div className="space-y-2.5">
                {[
                  { id: 'quick', label: 'Quick Summary', desc: 'Fast, high-impact key concepts' },
                  { id: 'detailed', label: 'Detailed Summary', desc: 'Comprehensive breakdown' },
                  { id: 'important_points', label: 'Important Points', desc: 'Numbered exam formulas & takeaways' },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSummaryType(type.id)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer shadow-sm ${
                      summaryType === type.id
                        ? 'bg-[#EFF6FF] border-blue-400 text-[#2563EB] shadow-blue-500/10'
                        : 'bg-white border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFF]'
                    }`}
                  >
                    <div className="text-xs font-bold text-[#0F172A]">{type.label}</div>
                    <div className="text-[11px] text-[#64748B] mt-0.5">{type.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1D4ED8] mb-2 uppercase tracking-wider">
                Exam Marks Format
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: '2_marks', label: '2 Marks' },
                  { id: '5_marks', label: '5 Marks' },
                  { id: '10_marks', label: '10 Marks' },
                ].map((len) => (
                  <button
                    key={len.id}
                    type="button"
                    onClick={() => setAnswerLength(len.id)}
                    className={`py-2 px-1 text-center rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-sm ${
                      answerLength === len.id
                        ? 'bg-[#EFF6FF] border-blue-600 text-[#2563EB]'
                        : 'bg-white border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A]'
                    }`}
                  >
                    {len.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading || (!inputText.trim() && !selectedFileId)}
              className="w-full py-3.5 px-4 rounded-full text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer hover:-translate-y-0.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Synthesizing Summary...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Summary</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Result Display Area */}
      {generatedSummary && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E2E8F0] shadow-xl shadow-blue-500/5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#2563EB]" />
              <h2 className="text-base font-bold text-[#1D4ED8]">Generated Academic Summary</h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveAsNote}
                disabled={savedAsNote}
                className="px-4 py-2 rounded-full bg-[#EFF6FF] hover:bg-blue-100 text-xs font-bold text-[#2563EB] border border-blue-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Save into study notes"
              >
                {savedAsNote ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                    <span className="text-[#16A34A]">Saved to Notes</span>
                  </>
                ) : (
                  <>
                    <BookmarkPlus className="w-3.5 h-3.5" />
                    <span>Save to Notes</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="p-2 rounded-full text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 border border-[#E2E8F0] transition-colors shadow-sm cursor-pointer"
                title="Copy to clipboard"
              >
                {copied ? <Check className="w-4 h-4 text-[#16A34A]" /> : <Copy className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="p-2 rounded-full text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 border border-[#E2E8F0] transition-colors shadow-sm cursor-pointer"
                title="Download as Markdown"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-6 sm:p-7 rounded-2xl bg-[#F8FAFF] border border-blue-100">
            <MarkdownRenderer content={generatedSummary} />
          </div>
        </div>
      )}
    </div>
  );
};
