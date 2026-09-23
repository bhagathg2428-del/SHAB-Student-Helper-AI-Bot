import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  HelpCircle,
  BookOpen,
  TrendingUp,
  MessageSquare,
  Upload,
  ArrowRight,
  FileText,
  Calendar,
  Sparkles,
  Loader2,
  CheckCircle2,
  FileCode,
  FileSpreadsheet,
  Clock,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { DashboardData } from '../types';
import { NavTab } from '../components/Sidebar';

interface DashboardPageProps {
  onNavigate: (tab: NavTab) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await api.getDashboard();
        setData(res);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard metrics.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const formatRelativeTime = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 min-h-[400px]">
        <div className="flex items-center gap-3 text-[#64748B] text-sm">
          <Loader2 className="w-5 h-5 animate-spin text-[#2563EB]" />
          <span>Loading student metrics...</span>
        </div>
      </div>
    );
  }

  const fileCount = data?.fileCount ?? 0;
  const quizCount = data?.quizCount ?? 0;
  const noteCount = data?.noteCount ?? 0;
  const studyProgress = data?.studyProgress ?? 0;
  const recentFiles = data?.recentFiles || [];
  const recentActivity = data?.recentActivity || [];
  const recentQuizResults = data?.recentQuizResults || [];

  const weekDays = [
    { day: 'Mon', active: true, hours: '2.5h' },
    { day: 'Tue', active: true, hours: '3.0h' },
    { day: 'Wed', active: true, hours: '1.5h' },
    { day: 'Thu', active: true, hours: '4.0h' },
    { day: 'Fri', active: true, hours: '2.0h' },
    { day: 'Sat', active: studyProgress > 40, hours: '1.0h' },
    { day: 'Sun', active: studyProgress > 70, hours: 'Today' },
  ];

  const getFileBadgeColor = (name: string, index: number) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') {
      return {
        bg: 'bg-red-50 text-red-600 border-red-200',
        iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600 text-white',
      };
    }
    if (ext === 'docx' || ext === 'doc') {
      return {
        bg: 'bg-blue-50 text-blue-600 border-blue-200',
        iconBg: 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white',
      };
    }
    const colors = [
      { bg: 'bg-blue-50 text-[#2563EB] border-blue-200', iconBg: 'bg-gradient-to-br from-blue-500 to-sky-600 text-white' },
      { bg: 'bg-indigo-50 text-indigo-600 border-indigo-200', iconBg: 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white' },
      { bg: 'bg-sky-50 text-sky-600 border-sky-200', iconBg: 'bg-gradient-to-br from-sky-500 to-blue-600 text-white' },
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto bg-[#F8FAFC]">
      {/* Dashboard Top Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#E2E8F0] shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight flex items-center gap-2">
            <span>Welcome back, {user?.full_name || 'Student'}</span>
            <span role="img" aria-label="wave" className="animate-bounce">👋</span>
          </h1>
          <p className="text-sm text-[#64748B] mt-1 font-medium">
            Let's make your study session productive.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('chat')}
            className="px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md shadow-blue-500/25 flex items-center gap-2 transition-all hover:-translate-y-0.5 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Ask AI Tutor</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('files')}
            className="px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-[#2563EB] bg-white hover:bg-blue-50 border border-blue-200 hover:border-blue-300 flex items-center gap-2 transition-all shadow-sm hover:-translate-y-0.5 cursor-pointer"
          >
            <Upload className="w-4 h-4 text-[#2563EB]" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-[#DC2626] font-medium">
          {error}
        </div>
      )}

      {/* Modern Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Files */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-white via-white to-blue-50/40 border border-[#E2E8F0] shadow-sm hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Total Files</span>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <FolderOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-[#0F172A] mt-4 tracking-tight">{fileCount}</div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-[#64748B] font-medium">Stored in SQLite</span>
            <span className="inline-flex items-center gap-1 font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded-full text-[10px]">
              Ready
            </span>
          </div>
        </div>

        {/* Card 2: Quizzes */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-white via-white to-blue-50/40 border border-[#E2E8F0] shadow-sm hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Quizzes Taken</span>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <HelpCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-[#0F172A] mt-4 tracking-tight">{quizCount}</div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-[#64748B] font-medium">Auto graded</span>
            <span className="inline-flex items-center gap-1 font-bold text-[#16A34A] bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">
              +100% AI
            </span>
          </div>
        </div>

        {/* Card 3: Notes */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-white via-white to-blue-50/40 border border-[#E2E8F0] shadow-sm hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Study Notes</span>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-[#0F172A] mt-4 tracking-tight">{noteCount}</div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-[#64748B] font-medium">Markdown revision</span>
            <span className="inline-flex items-center gap-1 font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded-full text-[10px]">
              Active
            </span>
          </div>
        </div>

        {/* Card 4: Study Progress */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-white via-white to-blue-50/40 border border-[#E2E8F0] shadow-sm hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Study Progress</span>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-[#0F172A] mt-4 tracking-tight">{studyProgress}%</div>
          <div className="mt-2 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-700"
              style={{ width: `${studyProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Beautiful Study Progress Widget */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#2563EB]" />
              <h2 className="text-base font-bold text-[#0F172A]">Weekly Study Progress</h2>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Active learning engagement and material retention across the current week.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#2563EB] bg-[#EFF6FF] px-3 py-1 rounded-full border border-blue-100">
              {studyProgress}% Completed
            </span>
          </div>
        </div>

        {/* Smooth Blue Progress Bar with Segment Marks */}
        <div className="w-full bg-[#F1F5F9] h-3 rounded-full overflow-hidden p-0.5 border border-[#E2E8F0]">
          <div
            className="h-full bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-[#1D4ED8] rounded-full transition-all duration-1000 shadow-sm"
            style={{ width: `${Math.max(studyProgress, 12)}%` }}
          />
        </div>

        {/* Mon Tue Wed Thu Fri Sat Sun Indicators */}
        <div className="mt-6 grid grid-cols-7 gap-2">
          {weekDays.map((w, i) => (
            <div
              key={i}
              className={`p-3 rounded-2xl border text-center transition-all ${
                w.active
                  ? 'bg-blue-50/50 border-blue-200 text-[#1D4ED8] shadow-sm'
                  : 'bg-white border-[#E2E8F0] text-slate-400'
              }`}
            >
              <div className="text-[11px] font-bold uppercase">{w.day}</div>
              <div className="my-1 flex justify-center">
                <span
                  className={`w-2 h-2 rounded-full ${
                    w.active ? 'bg-[#2563EB] ring-4 ring-blue-100' : 'bg-slate-200'
                  }`}
                />
              </div>
              <div className="text-[10px] font-mono font-medium">{w.hours}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid: Recent Files & Recent Quiz Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Files Section */}
        <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] border border-blue-100 flex items-center justify-center text-[#2563EB]">
                <FolderOpen className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#0F172A] tracking-tight">Recent Files</h2>
                <p className="text-[11px] text-[#64748B]">Uploaded course materials</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('files')}
              className="text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 transition-colors"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentFiles.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 px-4 text-center border-2 border-dashed border-[#E2E8F0] rounded-2xl bg-[#F8FAFC]">
              <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] flex items-center justify-center text-[#2563EB] mb-2 shadow-sm">
                <FolderOpen className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-[#0F172A]">No files uploaded yet</p>
              <p className="text-xs text-[#64748B] mt-1 max-w-xs">
                Upload your syllabus PDF or notes to begin RAG search and AI quiz generation.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('files')}
                className="mt-4 px-4 py-2 rounded-full text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] shadow-sm transition-all"
              >
                Upload Syllabus
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentFiles.map((file, idx) => {
                const badge = getFileBadgeColor(file.name, idx);
                return (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-white hover:border-blue-200 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${badge.iconBg}`}>
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#0F172A] truncate max-w-[180px] sm:max-w-xs">
                          {file.name}
                        </div>
                        <div className="text-[11px] text-[#64748B] font-mono mt-0.5 flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${badge.bg}`}>
                            {file.type || 'FILE'}
                          </span>
                          <span>{(file.size / 1024).toFixed(1)} KB</span>
                          <span>·</span>
                          <span>{new Date(file.upload_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate('chat')}
                      className="px-3.5 py-1.5 text-xs font-semibold text-[#2563EB] hover:text-white bg-[#EFF6FF] hover:bg-[#2563EB] rounded-full border border-blue-200 transition-colors shadow-sm cursor-pointer shrink-0 ml-2"
                    >
                      Ask AI
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Quiz Results Section */}
        <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] border border-blue-100 flex items-center justify-center text-[#2563EB]">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#0F172A] tracking-tight">Recent Quiz Results</h2>
                <p className="text-[11px] text-[#64748B]">Automated test performance</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('quiz')}
              className="text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 transition-colors"
            >
              <span>Take Quiz</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentQuizResults.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 px-4 text-center border-2 border-dashed border-[#E2E8F0] rounded-2xl bg-[#F8FAFC]">
              <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] flex items-center justify-center text-[#2563EB] mb-2 shadow-sm">
                <HelpCircle className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-[#0F172A]">No quizzes taken yet</p>
              <p className="text-xs text-[#64748B] mt-1 max-w-xs">
                Test your knowledge by generating an AI mock test based on your notes or textbook.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('quiz')}
                className="mt-4 px-4 py-2 rounded-full text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] shadow-sm transition-all"
              >
                Generate Practice Quiz
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentQuizResults.map((q) => (
                <div
                  key={q.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-white hover:border-blue-200 hover:shadow-sm transition-all"
                >
                  <div className="min-w-0 pr-3">
                    <div className="text-xs font-bold text-[#0F172A] truncate max-w-[180px] sm:max-w-xs">
                      {q.topic}
                    </div>
                    <div className="text-[11px] text-[#64748B] font-mono mt-0.5">
                      {q.score} of {q.total_questions} correct · {new Date(q.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-black font-mono shadow-sm ${
                        q.percentage >= 70
                          ? 'bg-emerald-50 text-[#16A34A] border border-emerald-200'
                          : q.percentage >= 50
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-red-50 text-[#DC2626] border border-red-200'
                      }`}
                    >
                      {q.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Timeline & Exam Formats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Timeline */}
        <div className="lg:col-span-2 p-6 sm:p-7 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-[#2563EB]" />
            <h2 className="text-base font-bold text-[#0F172A] tracking-tight">Recent Activity Timeline</h2>
          </div>

          {recentActivity.length === 0 ? (
            <div className="py-10 text-center text-xs text-[#64748B] border border-dashed border-[#E2E8F0] rounded-2xl">
              No recent study activity recorded yet. Start reading notes or chatting with SHAB!
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-blue-100">
              {recentActivity.map((act) => (
                <div key={act.id} className="relative flex items-start justify-between gap-4">
                  {/* Blue Timeline Node */}
                  <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-[#2563EB] ring-4 ring-blue-100" />
                  
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-[#0F172A] leading-tight">
                      {act.title}
                    </div>
                    <div className="text-[11px] text-[#64748B] font-mono mt-1">
                      {formatRelativeTime(act.timestamp)} · {new Date(act.timestamp).toLocaleDateString()}
                    </div>
                  </div>

                  <span className="text-[10px] uppercase font-bold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full border border-blue-100 shrink-0">
                    {act.type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Exam Preparation Formats Launcher */}
        <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-[#EFF6FF] via-white to-blue-50/40 border border-blue-200/80 flex flex-col justify-between shadow-sm">
          <div>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white mb-4 shadow-md shadow-blue-500/25">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#1D4ED8] tracking-tight">College Exam Modes</h3>
            <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
              Ask SHAB for structured answers tailored to Indian & global university marks systems:
            </p>

            <div className="mt-4 space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white border border-blue-100 flex items-center justify-between">
                <span className="font-bold text-[#0F172A]">2-Marks Mode</span>
                <span className="text-[10px] text-[#64748B]">Crisp Definition & Formula</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-blue-100 flex items-center justify-between">
                <span className="font-bold text-[#0F172A]">5-Marks Mode</span>
                <span className="text-[10px] text-[#64748B]">Core Concept + Diagram Steps</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-blue-100 flex items-center justify-between">
                <span className="font-bold text-[#0F172A]">10-Marks Mode</span>
                <span className="text-[10px] text-[#64748B]">Full Essay Breakdown</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-blue-200/60">
            <button
              type="button"
              onClick={() => onNavigate('chat')}
              className="w-full py-3 px-4 rounded-full text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] shadow-md shadow-blue-500/20 transition-all flex items-center justify-between cursor-pointer"
            >
              <span>Launch AI Tutor</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
