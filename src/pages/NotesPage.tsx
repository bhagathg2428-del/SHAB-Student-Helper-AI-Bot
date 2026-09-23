import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Trash2,
  Edit3,
  Save,
  Clock,
  Eye,
  Check,
  AlertCircle,
  Loader2,
  X,
  FileEdit,
} from 'lucide-react';
import { api } from '../services/api';
import { Note } from '../types';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

export const NotesPage: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [contentInput, setContentInput] = useState('');
  const [previewMarkdown, setPreviewMarkdown] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const list = await api.getNotes();
      setNotes(list);
      if (list.length > 0 && !activeNote) {
        setActiveNote(list[0]);
        setTitleInput(list[0].title);
        setContentInput(list[0].content);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load notes.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewNote = () => {
    const newNoteTemplate: Note = {
      id: '',
      title: 'New Study Note',
      content: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setActiveNote(newNoteTemplate);
    setTitleInput('New Study Note');
    setContentInput('');
    setIsEditing(true);
    setPreviewMarkdown(false);
  };

  const handleSelectNote = (note: Note) => {
    setActiveNote(note);
    setTitleInput(note.title);
    setContentInput(note.content);
    setIsEditing(false);
    setPreviewMarkdown(false);
  };

  const handleSaveNote = async () => {
    if (!titleInput.trim()) {
      setError('Note title cannot be blank.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (activeNote?.id) {
        // Update
        const updated = await api.updateNote(activeNote.id, {
          title: titleInput.trim(),
          content: contentInput,
        });
        setNotes((prev) =>
          prev.map((n) => (n.id === activeNote.id ? { ...n, ...updated } : n))
        );
        setActiveNote((prev) => (prev ? { ...prev, ...updated } : null));
      } else {
        // Create
        const created = await api.createNote({
          title: titleInput.trim(),
          content: contentInput,
        });
        setNotes((prev) => [created, ...prev]);
        setActiveNote(created);
      }
      setIsEditing(false);
      setSuccess('Note saved successfully.');
      setTimeout(() => setSuccess(null), 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to save note.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('Are you sure you want to delete this study note?')) return;

    try {
      await api.deleteNote(id);
      const remaining = notes.filter((n) => n.id !== id);
      setNotes(remaining);
      if (activeNote?.id === id) {
        if (remaining.length > 0) {
          setActiveNote(remaining[0]);
          setTitleInput(remaining[0].title);
          setContentInput(remaining[0].content);
        } else {
          setActiveNote(null);
          setTitleInput('');
          setContentInput('');
        }
      }
      setSuccess('Note deleted.');
      setTimeout(() => setSuccess(null), 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to delete note.');
    }
  };

  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto bg-[#F8FAFC] relative min-h-full">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#E2E8F0] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
              Study Notes
            </h1>
            <p className="text-sm text-[#64748B] mt-0.5 font-medium">
              Organize coursework summaries, formulas, and revision materials stored securely in SQLite.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCreateNewNote}
          className="px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md shadow-blue-500/25 flex items-center gap-2 transition-all hover:-translate-y-0.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Note</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-xs text-[#DC2626] font-medium">
          <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-[#16A34A] font-medium">
          <Check className="w-4 h-4 text-[#16A34A] shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Main Grid: Notes List + Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[560px]">
        {/* Left Column: Notes List */}
        <div className="lg:col-span-5 flex flex-col rounded-3xl bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
          {/* Search Bar */}
          <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <div className="relative">
              <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes, tags, or topics..."
                className="w-full pl-9 pr-4 py-2 rounded-full bg-white border border-[#E2E8F0] text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 shadow-sm transition-all"
              />
            </div>
          </div>

          {/* List items with blue accent line on the left */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#F1F5F9] p-2 space-y-1">
            {loading ? (
              <div className="py-16 flex items-center justify-center text-xs text-[#64748B]">
                <Loader2 className="w-5 h-5 animate-spin text-[#2563EB] mr-2" />
                Loading notes...
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="py-16 px-4 text-center">
                <p className="text-xs font-bold text-[#0F172A]">No notes found</p>
                <p className="text-[11px] text-[#64748B] mt-1">
                  Click "+ New Note" to create your first study note.
                </p>
              </div>
            ) : (
              filteredNotes.map((note) => {
                const isSelected = activeNote?.id === note.id;
                return (
                  <div
                    key={note.id}
                    onClick={() => handleSelectNote(note)}
                    className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 flex items-start justify-between gap-3 group relative border ${
                      isSelected
                        ? 'bg-[#EFF6FF] border-l-4 border-l-[#2563EB] border-blue-200 shadow-sm'
                        : 'bg-white hover:bg-[#F8FAFF] border-transparent hover:border-slate-200 border-l-4 border-l-transparent hover:border-l-blue-400'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-sm font-bold truncate text-[#0F172A]">
                        {note.title}
                      </div>
                      <div className="text-[11px] text-[#64748B] truncate mt-1 leading-relaxed">
                        {note.content ? note.content.slice(0, 70) : 'Empty note'}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-[#64748B] font-mono mt-2">
                        <Clock className="w-3 h-3 text-[#2563EB]" />
                        <span>{new Date(note.updated_at || note.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectNote(note);
                          setIsEditing(true);
                        }}
                        className="p-1.5 rounded-lg text-[#64748B] hover:text-[#2563EB] hover:bg-white transition-colors"
                        title="Edit note"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteNote(note.id, e)}
                        className="p-1.5 rounded-lg text-[#64748B] hover:text-[#DC2626] hover:bg-red-50 transition-colors"
                        title="Delete note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Note Content Viewer/Editor */}
        <div className="lg:col-span-7 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col overflow-hidden">
          {activeNote ? (
            <>
              {/* Note Header / Toolbar */}
              <div className="p-5 border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-white to-[#F8FAFC]">
                <div className="flex-1 min-w-[200px]">
                  {isEditing ? (
                    <input
                      type="text"
                      value={titleInput}
                      onChange={(e) => setTitleInput(e.target.value)}
                      placeholder="Note Title"
                      className="w-full px-4 py-2 rounded-2xl bg-white border border-[#E2E8F0] text-sm font-bold text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 shadow-sm"
                    />
                  ) : (
                    <h2 className="text-base sm:text-lg font-black text-[#1D4ED8] tracking-tight truncate">
                      {activeNote.title}
                    </h2>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setPreviewMarkdown(!previewMarkdown)}
                        className="px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-50 border border-[#E2E8F0] text-xs font-bold text-[#64748B] flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#2563EB]" />
                        <span>{previewMarkdown ? 'Edit Raw' : 'Preview'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveNote}
                        disabled={saving}
                        className="px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                      >
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        <span>Save Note</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (activeNote.id) {
                            setTitleInput(activeNote.title);
                            setContentInput(activeNote.content);
                            setIsEditing(false);
                          } else {
                            setActiveNote(null);
                          }
                        }}
                        className="p-1.5 rounded-full text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 cursor-pointer"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-1.5 rounded-full bg-[#EFF6FF] hover:bg-blue-100 border border-blue-200 text-xs font-bold text-[#2563EB] flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteNote(activeNote.id)}
                        className="p-2 rounded-full text-[#64748B] hover:text-[#DC2626] hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors cursor-pointer"
                        title="Delete note"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Note Content Area */}
              <div className="flex-1 p-6 overflow-y-auto bg-white">
                {isEditing ? (
                  previewMarkdown ? (
                    <div className="p-6 rounded-2xl bg-[#F8FAFF] border border-blue-100">
                      <MarkdownRenderer content={contentInput || '*No content yet.*'} />
                    </div>
                  ) : (
                    <textarea
                      value={contentInput}
                      onChange={(e) => setContentInput(e.target.value)}
                      placeholder="Write your study notes, formulas, or copy exam summaries here (Supports rich Markdown)..."
                      className="w-full h-full min-h-[400px] p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-sm text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#2563EB] font-mono leading-relaxed resize-none shadow-inner"
                    />
                  )
                ) : (
                  <div className="p-2">
                    {activeNote.content ? (
                      <MarkdownRenderer content={activeNote.content} />
                    ) : (
                      <div className="text-sm text-[#64748B] italic">
                        Empty note. Click "Edit" to add study points or exam formulas.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-14 h-14 rounded-3xl bg-[#EFF6FF] flex items-center justify-center text-[#2563EB] mb-3 shadow-sm">
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-[#0F172A]">No note selected</h3>
              <p className="text-xs text-[#64748B] mt-1 max-w-xs">
                Select an existing study note from the left, or create a brand new one.
              </p>
              <button
                type="button"
                onClick={handleCreateNewNote}
                className="mt-4 px-5 py-2.5 rounded-full text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                Create Study Note
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Floating "+ New Note" Button for Easy Access */}
      <button
        type="button"
        onClick={handleCreateNewNote}
        className="fixed bottom-6 right-6 z-40 px-5 py-3 rounded-full text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl shadow-blue-500/30 flex items-center gap-2 hover:-translate-y-1 transition-all cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>+ New Note</span>
      </button>
    </div>
  );
};
