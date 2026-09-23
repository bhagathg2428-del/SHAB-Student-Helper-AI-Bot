import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Clock,
  History,
  AlertCircle,
  Loader2,
  Award,
  MinusCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { QuizQuestion, QuizResult, FileRecord } from '../types';

export const QuizPage: React.FC = () => {
  const { language } = useAuth();
  const [activeTab, setActiveTab] = useState<'create' | 'taking' | 'results' | 'history'>('create');

  // Creation params
  const [topic, setTopic] = useState('');
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [selectedFileId, setSelectedFileId] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState('Medium');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Taking state
  const [quizId, setQuizId] = useState<string>('');
  const [quizTopic, setQuizTopic] = useState<string>('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Results state
  const [latestResult, setLatestResult] = useState<any>(null);

  // History state
  const [quizHistory, setQuizHistory] = useState<QuizResult[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

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

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const hist = await api.getQuizHistory();
      setQuizHistory(hist);
    } catch {
      // ignore
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!topic.trim() && !selectedFileId) {
      setError('Please specify a topic or select an uploaded syllabus document.');
      return;
    }

    setError(null);
    setGenerating(true);

    try {
      const res = await api.generateQuiz({
        topic: topic.trim() || undefined,
        fileId: selectedFileId || undefined,
        numQuestions,
        difficulty,
        language,
      });

      setQuizId(res.quizId);
      setQuizTopic(res.topic);
      setQuestions(res.questions);
      setUserAnswers({});
      setCurrentIndex(0);
      setActiveTab('taking');
    } catch (err: any) {
      setError(err.message || 'Failed to generate quiz.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectOption = (optionKey: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentIndex]: optionKey,
    }));
  };

  const handleSubmitQuiz = async () => {
    const answeredCount = Object.keys(userAnswers).length;
    if (answeredCount < questions.length) {
      if (!confirm(`You have only answered ${answeredCount} of ${questions.length} questions. Submit anyway?`)) {
        return;
      }
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await api.submitQuiz({
        quizId,
        answers: userAnswers,
      });

      const correctCount = result.review?.filter((r: any) => r.isCorrect).length || result.score;
      const answeredTotal = Object.keys(userAnswers).length;
      const skippedCount = Math.max(0, (result.totalQuestions || questions.length) - answeredTotal);
      const wrongCount = Math.max(0, answeredTotal - correctCount);

      setLatestResult({
        ...result,
        topic: quizTopic,
        correctCount,
        wrongCount,
        skippedCount,
      });
      setActiveTab('results');
    } catch (err: any) {
      setError(err.message || 'Failed to grade quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-5xl mx-auto bg-[#F8FAFC]">
      {/* Tab Switcher Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#E2E8F0] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
              AI Exam Practice & Quiz
            </h1>
            <p className="text-sm text-[#64748B] mt-0.5 font-medium">
              Self-test on any topic or lecture slide with instantaneous scoring.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'create' || activeTab === 'taking' || activeTab === 'results'
                ? 'bg-[#EFF6FF] text-[#2563EB] border border-blue-200'
                : 'text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100'
            }`}
          >
            Create Quiz
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('history');
              loadHistory();
            }}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-[#EFF6FF] text-[#2563EB] border border-blue-200'
                : 'text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100'
            }`}
          >
            Past Attempts
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-xs text-[#DC2626] font-medium">
          <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* TAB 1: CREATE QUIZ */}
      {activeTab === 'create' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#1D4ED8] mb-2 uppercase tracking-wider">
                Topic or Subject
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => {
                  setTopic(e.target.value);
                  if (e.target.value) setSelectedFileId('');
                }}
                placeholder="e.g. Operating Systems Deadlocks, Normalization, React Hooks, Computer Networks"
                className="w-full px-4 py-3 rounded-2xl bg-white border border-[#E2E8F0] text-[#0F172A] text-sm placeholder-slate-400 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 focus:outline-none shadow-sm transition-all"
              />
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-[#E2E8F0]" />
              <span className="flex-shrink mx-4 text-xs font-mono font-bold text-slate-400 uppercase">OR FROM FILE</span>
              <div className="flex-grow border-t border-[#E2E8F0]" />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1D4ED8] mb-2 uppercase tracking-wider">
                Select from Uploaded Material
              </label>
              <select
                value={selectedFileId}
                onChange={(e) => {
                  setSelectedFileId(e.target.value);
                  if (e.target.value) setTopic('');
                }}
                className="w-full px-4 py-3 rounded-2xl bg-white border border-[#E2E8F0] text-[#0F172A] text-xs sm:text-sm focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 focus:outline-none shadow-sm transition-all"
              >
                <option value="">-- Choose from uploaded lecture notes or textbooks --</option>
                {files.map((file) => (
                  <option key={file.id} value={file.id}>
                    📄 {file.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
            <div>
              <label className="block text-xs font-bold text-[#1D4ED8] mb-2 uppercase tracking-wider">
                Number of Questions
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[5, 10, 15].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setNumQuestions(count)}
                    className={`py-2.5 text-center rounded-2xl border text-xs font-bold transition-all cursor-pointer shadow-sm ${
                      numQuestions === count
                        ? 'bg-[#EFF6FF] border-[#2563EB] text-[#2563EB]'
                        : 'bg-white border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A]'
                    }`}
                  >
                    {count} Questions
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1D4ED8] mb-2 uppercase tracking-wider">
                Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Easy', 'Medium', 'Hard'].map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setDifficulty(diff)}
                    className={`py-2.5 text-center rounded-2xl border text-xs font-bold transition-all cursor-pointer shadow-sm ${
                      difficulty === diff
                        ? 'bg-[#EFF6FF] border-[#2563EB] text-[#2563EB]'
                        : 'bg-white border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A]'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3">
            <button
              type="button"
              onClick={handleGenerateQuiz}
              disabled={generating || (!topic.trim() && !selectedFileId)}
              className="w-full py-4 px-6 rounded-full text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer hover:-translate-y-0.5"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                  <span>Generating AI Quiz Questions...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Start Practice Quiz</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: TAKING QUIZ */}
      {activeTab === 'taking' && questions.length > 0 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
            <div>
              <span className="text-xs font-bold text-[#2563EB] uppercase tracking-wider font-mono">
                {quizTopic}
              </span>
              <div className="text-base font-extrabold text-[#0F172A] mt-0.5">
                Question {currentIndex + 1} of {questions.length}
              </div>
            </div>

            <div className="text-xs font-mono text-[#64748B] font-bold bg-[#F8FAFC] px-3 py-1.5 rounded-full border border-[#E2E8F0]">
              Answered: {Object.keys(userAnswers).length} / {questions.length}
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-[#E2E8F0]">
            <div
              className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>

          {/* Question Text */}
          <div className="p-6 rounded-2xl bg-[#F8FAFF] border border-blue-100">
            <h2 className="text-base sm:text-lg font-bold text-[#0F172A] leading-relaxed">
              {questions[currentIndex].question}
            </h2>
          </div>

          {/* Options A, B, C, D: Selected = Blue border, Light blue background */}
          <div className="space-y-3">
            {(['A', 'B', 'C', 'D'] as const).map((optKey) => {
              const optionText = questions[currentIndex].options[optKey];
              const isSelected = userAnswers[currentIndex] === optKey;
              return (
                <button
                  key={optKey}
                  type="button"
                  onClick={() => handleSelectOption(optKey)}
                  className={`w-full p-4 sm:p-5 rounded-2xl border text-left flex items-center gap-3.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#EFF6FF] border-[#2563EB] text-[#0F172A] shadow-md shadow-blue-500/10'
                      : 'bg-white border-[#E2E8F0] text-[#334155] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 font-mono transition-colors ${
                      isSelected
                        ? 'bg-[#2563EB] text-white shadow-sm'
                        : 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]'
                    }`}
                  >
                    {optKey}
                  </div>
                  <span className="text-xs sm:text-sm font-semibold leading-relaxed">{optionText}</span>
                </button>
              );
            })}
          </div>

          {/* Navigation Controls: Previous, Next, Submit Quiz with blue gradient */}
          <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => prev - 1)}
              className="px-5 py-2.5 rounded-full bg-white hover:bg-slate-50 border border-[#E2E8F0] text-xs font-bold text-[#64748B] hover:text-[#0F172A] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => prev + 1)}
                className="px-6 py-2.5 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-xs font-bold text-white flex items-center gap-2 transition-colors cursor-pointer shadow-sm hover:scale-105"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitQuiz}
                disabled={submitting}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-xs font-bold text-white flex items-center gap-2 shadow-md shadow-blue-500/25 transition-all cursor-pointer hover:scale-105"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Grading Quiz...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Quiz</span>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: QUIZ RESULTS (Large Circular Score Indicator, Correct/Wrong/Skipped, Blue Progress Graphics) */}
      {activeTab === 'results' && latestResult && (
        <div className="space-y-6">
          {/* Hero Result Card */}
          <div className="p-8 sm:p-10 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-[#2563EB] uppercase tracking-wider">
                {latestResult.topic}
              </span>
              <h2 className="text-3xl font-black text-[#0F172A] tracking-tight">Quiz Results</h2>
              <p className="text-sm text-[#64748B] max-w-md font-medium">
                {latestResult.percentage >= 80
                  ? 'Outstanding performance! You have mastered these key concepts.'
                  : latestResult.percentage >= 60
                  ? 'Good effort! Review the questions below to strengthen your weak areas.'
                  : 'Keep revising! Check the explanations below and try another practice attempt.'}
              </p>

              <div className="pt-2 flex flex-wrap gap-2.5 justify-center md:justify-start">
                <button
                  type="button"
                  onClick={() => setActiveTab('create')}
                  className="px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/25 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Try Another Quiz</span>
                </button>
              </div>
            </div>

            {/* Circular Score Indicator */}
            <div className="flex flex-col items-center">
              <div className="relative w-36 h-36 flex items-center justify-center">
                {/* SVG Circular Ring */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#EFF6FF"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#2563EB"
                    strokeWidth="10"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * latestResult.percentage) / 100}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-black text-[#0F172A] tracking-tight font-mono">
                    {latestResult.percentage}%
                  </span>
                  <span className="text-[11px] font-bold text-[#2563EB]">
                    {latestResult.percentage >= 80 ? 'Excellent!' : latestResult.percentage >= 60 ? 'Good!' : 'Keep Practicing'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown: Correct, Wrong, Skipped */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-white border border-emerald-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#16A34A] shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-[#0F172A]">
                  {latestResult.correctCount ?? latestResult.score}
                </div>
                <div className="text-xs font-bold text-[#16A34A] uppercase tracking-wider">Correct</div>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-red-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-[#DC2626] shrink-0">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-[#0F172A]">{latestResult.wrongCount ?? 0}</div>
                <div className="text-xs font-bold text-[#DC2626] uppercase tracking-wider">Wrong</div>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                <MinusCircle className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-[#0F172A]">{latestResult.skippedCount ?? 0}</div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Skipped</div>
              </div>
            </div>
          </div>

          {/* Detailed Question Review */}
          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-[#0F172A] tracking-tight">Question Review & Explanations</h3>

            {latestResult.review?.map((item: any, idx: number) => (
              <div
                key={idx}
                className={`p-6 rounded-3xl bg-white border shadow-sm transition-all ${
                  item.isCorrect ? 'border-emerald-200' : 'border-red-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    {item.isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
                    )}
                    <span className="text-sm font-bold text-[#0F172A]">
                      {idx + 1}. {item.question}
                    </span>
                  </div>

                  <span
                    className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                      item.isCorrect
                        ? 'bg-emerald-50 text-[#16A34A] border border-emerald-200'
                        : 'bg-red-50 text-[#DC2626] border border-red-200'
                    }`}
                  >
                    {item.isCorrect ? 'Correct' : 'Incorrect'}
                  </span>
                </div>

                {/* Options display */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {(['A', 'B', 'C', 'D'] as const).map((k) => {
                    const isUserChoice = item.userAnswer === k;
                    const isCorrectAnswer = item.correctAnswer === k;
                    return (
                      <div
                        key={k}
                        className={`p-3 rounded-xl border flex items-center gap-2 ${
                          isCorrectAnswer
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold'
                            : isUserChoice && !item.isCorrect
                            ? 'bg-red-50 border-red-300 text-red-950 line-through'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <span className="w-5 h-5 rounded-md bg-white border flex items-center justify-center font-bold text-[10px]">
                          {k}
                        </span>
                        <span className="truncate">{item.options?.[k]}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                <div className="mt-3.5 p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 text-xs text-[#1D4ED8] font-medium leading-relaxed">
                  <span className="font-bold">Explanation: </span>
                  {item.explanation || 'The selected choice is mathematically and theoretically aligned with standard university syllabus answers.'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: HISTORY */}
      {activeTab === 'history' && (
        <div className="rounded-3xl bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
            <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
              Attempt History ({quizHistory.length})
            </span>
            <button
              type="button"
              onClick={loadHistory}
              className="text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] cursor-pointer"
            >
              Refresh
            </button>
          </div>

          {loadingHistory ? (
            <div className="py-16 flex items-center justify-center text-xs text-[#64748B]">
              <Loader2 className="w-5 h-5 animate-spin text-[#2563EB] mr-2" />
              Loading history...
            </div>
          ) : quizHistory.length === 0 ? (
            <div className="py-16 px-4 text-center">
              <p className="text-xs font-bold text-[#0F172A]">No quiz records yet</p>
              <p className="text-[11px] text-[#64748B] mt-1">Take your first quiz to track progress.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#E2E8F0]">
              {quizHistory.map((h) => (
                <div key={h.id} className="p-5 flex items-center justify-between hover:bg-[#F8FAFF] transition-colors">
                  <div>
                    <div className="text-sm font-bold text-[#0F172A]">{h.topic}</div>
                    <div className="text-xs text-[#64748B] mt-0.5">
                      Score: {h.score} / {h.total_questions} ({h.percentage}%) • {new Date(h.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <span
                    className={`text-xs font-mono font-bold px-3 py-1 rounded-full ${
                      h.percentage >= 70
                        ? 'bg-emerald-50 text-[#16A34A] border border-emerald-200'
                        : 'bg-blue-50 text-[#2563EB] border border-blue-200'
                    }`}
                  >
                    {h.percentage}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
