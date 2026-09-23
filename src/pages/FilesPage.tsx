import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  FolderOpen,
  FileText,
  Trash2,
  Download,
  Eye,
  MessageSquare,
  Sparkles,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  FileSpreadsheet,
  FileCode,
  File,
} from 'lucide-react';
import { api } from '../services/api';
import { FileRecord } from '../types';
import { NavTab } from '../components/Sidebar';

interface FilesPageProps {
  onNavigateToTab?: (tab: NavTab) => void;
}

export const FilesPage: React.FC<FilesPageProps> = ({ onNavigateToTab }) => {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Preview modal
  const [previewFile, setPreviewFile] = useState<FileRecord | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const list = await api.getFiles();
      setFiles(list);
    } catch (err: any) {
      setError(err.message || 'Failed to load files.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setError(null);
    setSuccess(null);
    setUploading(true);
    setUploadProgress(20);

    const validExtensions = ['.pdf', '.docx', '.pptx', '.txt', '.png', '.jpg', '.jpeg', '.webp'];
    const filesToUpload: File[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!validExtensions.includes(ext)) {
        setError(`File "${file.name}" has an unsupported format. Supported: PDF, DOCX, PPTX, TXT, PNG, JPG.`);
        setUploading(false);
        setUploadProgress(null);
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        setError(`File "${file.name}" exceeds the 50MB size limit.`);
        setUploading(false);
        setUploadProgress(null);
        return;
      }
      filesToUpload.push(file);
    }

    setUploadProgress(50);
    try {
      const newFiles = await api.uploadFiles(filesToUpload);
      setUploadProgress(90);
      setFiles((prev) => [...newFiles, ...prev]);
      setSuccess(`Successfully uploaded and processed ${filesToUpload.length} document(s).`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'File processing failed. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteFile = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await api.deleteFile(id);
      setFiles((prev) => prev.filter((f) => f.id !== id));
      if (previewFile?.id === id) setPreviewFile(null);
      setSuccess(`File "${name}" removed.`);
      setTimeout(() => setSuccess(null), 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to delete file.');
    }
  };

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="w-5 h-5 text-red-500" />;
    if (ext === 'docx' || ext === 'doc') return <FileText className="w-5 h-5 text-[#2563EB]" />;
    if (ext === 'pptx') return <FileSpreadsheet className="w-5 h-5 text-orange-500" />;
    return <File className="w-5 h-5 text-[#2563EB]" />;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto bg-[#F8FAFC] min-h-full">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#E2E8F0] shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <FolderOpen className="w-5 h-5" />
            </div>
            <span>My Files & Study Materials</span>
          </h1>
          <p className="text-sm text-[#64748B] mt-1 font-medium">
            Upload course PDFs, notes, slides, and exam papers to ground your AI answers.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md shadow-blue-500/25 flex items-center gap-2 transition-all hover:-translate-y-0.5 cursor-pointer self-start sm:self-auto"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Files</span>
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-xs text-[#DC2626] font-medium">
          <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-[#16A34A] font-medium">
          <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Beautiful Drag & Drop Upload Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          handleFileUpload(e.dataTransfer.files);
        }}
        className={`p-10 rounded-3xl border-2 border-dashed transition-all duration-300 text-center flex flex-col items-center justify-center bg-white shadow-sm hover:shadow-md ${
          isDragOver
            ? 'bg-[#EFF6FF] border-[#2563EB] scale-[1.01]'
            : 'border-blue-300 hover:border-[#2563EB] hover:bg-[#F8FAFF]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.pptx,.txt,.png,.jpg,.jpeg,.webp"
          onChange={(e) => handleFileUpload(e.target.files)}
          className="hidden"
        />

        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-500/25">
          {uploading ? (
            <Loader2 className="w-8 h-8 animate-spin text-white" />
          ) : (
            <Upload className="w-8 h-8 text-white" />
          )}
        </div>

        <h3 className="text-lg font-black text-[#0F172A] tracking-tight">
          {uploading ? 'Processing & Indexing Material...' : 'Drop your files here'}
        </h3>
        <p className="text-xs sm:text-sm text-[#64748B] mt-1.5 font-medium">
          PDF, DOCX, PPTX, TXT and images
        </p>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-5 px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-[#2563EB] bg-white hover:bg-blue-50 border-2 border-[#2563EB] transition-all shadow-sm cursor-pointer hover:scale-105"
        >
          Browse Files
        </button>

        {uploadProgress !== null && (
          <div className="w-full max-w-sm mt-5">
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-[#E2E8F0]">
              <div
                className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-300 shadow-sm"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <div className="text-[11px] text-[#64748B] font-mono mt-1.5 text-center font-medium">
              Extracting text & formatting for AI study...
            </div>
          </div>
        )}
      </div>

      {/* Files Table / List with White Cards and Blue Icons */}
      <div className="rounded-3xl bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between bg-gradient-to-r from-white to-[#F8FAFC]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
              Uploaded Documents ({files.length})
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#EFF6FF] border border-blue-100 text-[10px] font-bold text-[#2563EB]">
              SQLite Database
            </span>
          </div>
          <button
            type="button"
            onClick={loadFiles}
            className="text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] transition-colors cursor-pointer"
          >
            Refresh List
          </button>
        </div>

        {loading ? (
          <div className="py-16 flex items-center justify-center text-xs text-[#64748B]">
            <Loader2 className="w-5 h-5 animate-spin text-[#2563EB] mr-2" />
            Loading study documents...
          </div>
        ) : files.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#EFF6FF] flex items-center justify-center text-[#2563EB] mx-auto mb-3 shadow-sm">
              <FolderOpen className="w-7 h-7" />
            </div>
            <p className="text-base font-bold text-[#0F172A]">No files uploaded yet</p>
            <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
              Upload your lecture slides or syllabus to start asking targeted exam questions.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-bold text-[#64748B] uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Document Name</th>
                  <th className="px-6 py-3.5">Format</th>
                  <th className="px-6 py-3.5">File Size</th>
                  <th className="px-6 py-3.5">Uploaded</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] bg-white">
                {files.map((file) => (
                  <tr key={file.id} className="hover:bg-[#F8FAFF] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB] shrink-0 shadow-sm">
                          {getFileIcon(file.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-bold text-[#0F172A] truncate max-w-[240px] sm:max-w-md">
                            {file.name}
                          </div>
                          <div className="text-[11px] text-[#64748B] mt-0.5 flex items-center gap-2">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                            <span>
                              {file.extracted_text ? `${file.extracted_text.length.toLocaleString()} characters indexed` : 'Indexed'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700">
                        {file.type || 'FILE'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-xs text-[#64748B] font-mono font-medium">
                      {(file.size / 1024).toFixed(1)} KB
                    </td>

                    <td className="px-6 py-4 text-xs text-[#64748B]">
                      {new Date(file.upload_date).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewFile(file)}
                          className="p-2 rounded-xl text-[#64748B] hover:text-[#2563EB] hover:bg-[#EFF6FF] border border-transparent hover:border-blue-200 transition-all cursor-pointer"
                          title="Preview document text"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onNavigateToTab && onNavigateToTab('chat')}
                          className="p-2 rounded-xl text-[#64748B] hover:text-[#2563EB] hover:bg-[#EFF6FF] border border-transparent hover:border-blue-200 transition-all cursor-pointer"
                          title="Ask questions about this file"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteFile(file.id, file.name)}
                          className="p-2 rounded-xl text-[#64748B] hover:text-[#DC2626] hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer"
                          title="Delete file"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Document Text Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-[#2563EB]" />
                <h3 className="text-sm font-bold text-[#0F172A] truncate max-w-md">{previewFile.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 text-xs sm:text-sm text-[#334155] leading-relaxed whitespace-pre-wrap font-mono bg-white">
              {previewFile.extracted_text || (
                <div className="text-center py-12 text-[#64748B]">No extracted text available for this file.</div>
              )}
            </div>

            <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setPreviewFile(null);
                  if (onNavigateToTab) onNavigateToTab('chat');
                }}
                className="px-5 py-2.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Ask SHAB About Document</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="px-5 py-2.5 rounded-full text-xs font-semibold text-[#64748B] hover:text-[#0F172A] bg-white border border-[#E2E8F0] transition-colors shadow-sm cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
