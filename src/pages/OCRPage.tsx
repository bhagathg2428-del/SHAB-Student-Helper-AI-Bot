import React, { useState, useRef } from 'react';
import {
  ScanText,
  Upload,
  Copy,
  Check,
  Trash2,
  MessageSquare,
  Sparkles,
  BookOpen,
  Image as ImageIcon,
  AlertCircle,
  Loader2,
  X,
  FileCode,
  Eye,
  Edit3,
} from 'lucide-react';
import { api } from '../services/api';
import { NavTab } from '../components/Sidebar';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

interface OCRPageProps {
  onNavigateToTab: (tab: NavTab, initialData?: { text?: string }) => void;
}

export const OCRPage: React.FC<OCRPageProps> = ({ onNavigateToTab }) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [savedNote, setSavedNote] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [viewMode, setViewMode] = useState<'formatted' | 'raw'>('formatted');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, JPEG, WEBP).');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('Image exceeds 20MB limit.');
      return;
    }

    setError(null);
    setSelectedImage(file);
    const url = URL.createObjectURL(file);
    setImagePreviewUrl(url);
    setExtractedText('');
  };

  const handleExtractText = async () => {
    if (!selectedImage) return;

    setError(null);
    setLoading(true);
    setCopied(false);
    setSavedNote(false);

    try {
      const res = await api.extractOCR(selectedImage);
      setExtractedText(res.extractedText);
    } catch (err: any) {
      setError(err.message || 'Failed to extract text from image.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setSelectedImage(null);
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(null);
    setExtractedText('');
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveAsNote = async () => {
    if (!extractedText || savedNote) return;
    try {
      await api.createNote({
        title: `OCR Notes: ${selectedImage?.name || 'Handwritten Scan'}`,
        content: extractedText,
      });
      setSavedNote(true);
      setTimeout(() => setSavedNote(false), 2500);
    } catch {
      setError('Failed to save as note.');
    }
  };

  const handleSendToChat = () => {
    onNavigateToTab('chat', { text: `Here is the extracted text from my study notes/image:\n\n${extractedText}` });
  };

  const handleSendToSummary = () => {
    onNavigateToTab('summary', { text: extractedText });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto bg-[#F8FAFC]">
      {/* Title */}
      <div className="bg-white p-6 rounded-3xl border border-[#E2E8F0] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <ScanText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
              Intelligent OCR & Handwritten Notes Reader
            </h1>
            <p className="text-sm text-[#64748B] mt-0.5 font-medium">
              Extract handwriting, complex LaTeX math formulas, equations, and diagrams directly from photos.
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

      {/* Two Panels Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel: Upload Handwritten Note / Diagram Image */}
        <div className="space-y-4">
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <span className="text-xs font-bold text-[#1D4ED8] uppercase tracking-wider">
                1. Upload Handwritten Note / Diagram Image
              </span>
              {imagePreviewUrl && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs text-red-600 hover:text-red-700 font-bold"
                >
                  Clear Image
                </button>
              )}
            </div>

            {!imagePreviewUrl ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileSelect(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`p-10 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center min-h-[320px] ${
                  isDragOver
                    ? 'bg-[#EFF6FF] border-[#2563EB]'
                    : 'bg-[#F8FAFF] border-blue-300 hover:border-[#2563EB] hover:bg-[#EFF6FF]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />

                <div className="w-14 h-14 rounded-2xl bg-white border border-blue-200 flex items-center justify-center text-[#2563EB] mb-3 shadow-sm">
                  <ImageIcon className="w-7 h-7 text-[#2563EB]" />
                </div>
                <p className="text-sm font-bold text-[#0F172A]">Click or drop handwritten page / diagram here</p>
                <p className="text-xs text-[#64748B] mt-1.5 max-w-xs font-medium">
                  PNG, JPG, JPEG (Max 20MB). Transcribes notebook equations, blackboard photos, and graphs.
                </p>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="mt-4 px-5 py-2 rounded-full text-xs font-bold text-[#2563EB] bg-white border border-blue-200 hover:bg-blue-50 shadow-sm"
                >
                  Browse Image
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden border border-[#E2E8F0] bg-[#F8FAFC] max-h-[380px] flex items-center justify-center p-2">
                  <img
                    src={imagePreviewUrl}
                    alt="Upload Preview"
                    className="max-h-[360px] w-auto object-contain rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={handleClear}
                    className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white backdrop-blur-sm shadow-sm"
                    title="Remove Image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleExtractText}
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-full text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-40 transition-all cursor-pointer hover:-translate-y-0.5"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Transcribing Handwriting & Math Formulas...</span>
                    </>
                  ) : (
                    <>
                      <ScanText className="w-4 h-4" />
                      <span>Transcribe & Extract Text</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: AI Extracted Text + LaTeX Math Formulas + Explanation */}
        <div className="space-y-4">
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col min-h-[460px]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-3">
              <span className="text-xs font-bold text-[#1D4ED8] uppercase tracking-wider">
                2. AI Extracted Text + LaTeX Math Formulas + Explanation
              </span>

              {extractedText && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setViewMode(viewMode === 'formatted' ? 'raw' : 'formatted')}
                    className="px-2.5 py-1 rounded-full text-[11px] font-bold text-[#2563EB] bg-[#EFF6FF] border border-blue-200 cursor-pointer"
                  >
                    {viewMode === 'formatted' ? 'View Raw' : 'View Formatted'}
                  </button>

                  <button
                    type="button"
                    onClick={handleCopy}
                    className="p-1.5 rounded-full text-[#64748B] hover:text-[#0F172A] bg-white hover:bg-slate-100 border border-[#E2E8F0] transition-colors shadow-sm cursor-pointer"
                    title="Copy text"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center text-xs text-[#64748B] py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-[#2563EB] mb-3" />
                  <span className="font-bold text-[#0F172A]">Reading notebook scan with Gemini Vision...</span>
                  <span className="text-[11px] text-slate-400 mt-1">Converting handwriting to LaTeX math symbols</span>
                </div>
              ) : extractedText ? (
                viewMode === 'formatted' ? (
                  <div className="p-5 rounded-2xl bg-[#F8FAFF] border border-blue-100 max-h-[380px] overflow-y-auto leading-relaxed">
                    <MarkdownRenderer content={extractedText} />
                  </div>
                ) : (
                  <textarea
                    value={extractedText}
                    onChange={(e) => setExtractedText(e.target.value)}
                    className="w-full h-full min-h-[340px] p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] text-xs sm:text-sm font-mono leading-relaxed resize-none focus:outline-none focus:border-[#2563EB] shadow-inner"
                  />
                )
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-xs text-[#64748B] py-20 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-[#2563EB] mb-3">
                    <ScanText className="w-6 h-6" />
                  </div>
                  <p className="font-bold text-[#0F172A]">No text extracted yet</p>
                  <p className="text-[11px] text-[#64748B] mt-0.5 max-w-xs">
                    Upload an image of your study notes or whiteboard to see transcribed text and LaTeX formulas here.
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons: Copy, Convert to Study Note, Ask in Chat */}
            {extractedText && (
              <div className="pt-4 border-t border-[#E2E8F0] grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={handleSaveAsNote}
                  className="py-2.5 px-2 rounded-full bg-[#EFF6FF] hover:bg-blue-100 border border-blue-200 text-xs font-bold text-[#2563EB] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {savedNote ? (
                    <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                  ) : (
                    <BookOpen className="w-3.5 h-3.5 text-[#2563EB]" />
                  )}
                  <span>{savedNote ? 'Converted!' : 'Convert to Note'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendToChat}
                  className="py-2.5 px-2 rounded-full bg-white hover:bg-slate-50 border border-[#E2E8F0] text-xs font-bold text-[#64748B] hover:text-[#0F172A] flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Ask in Chat</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendToSummary}
                  className="py-2.5 px-2 rounded-full bg-white hover:bg-slate-50 border border-[#E2E8F0] text-xs font-bold text-[#64748B] hover:text-[#0F172A] flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Summarize</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
