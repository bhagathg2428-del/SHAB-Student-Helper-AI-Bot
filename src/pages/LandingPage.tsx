import React from 'react';
import {
  GraduationCap,
  MessageSquare,
  FileText,
  BookOpen,
  HelpCircle,
  FolderOpen,
  ScanText,
  Mic,
  Languages,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Bot,
  Brain,
  FileCheck2,
  Check,
  Zap,
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (view: 'login' | 'register' | 'chat') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const features = [
    {
      icon: MessageSquare,
      title: 'AI Chat Tutor',
      desc: 'Ask complex academic questions in CS, Engineering, Math & Sciences. Get answers tailored for 2, 5, or 10-mark college exam formats.',
      tag: 'Interactive',
    },
    {
      icon: FileText,
      title: 'Smart Summary',
      desc: 'Condense lengthy textbooks, research papers, and lecture slides into exam-ready revision summaries with key points.',
      tag: 'Instant',
    },
    {
      icon: BookOpen,
      title: 'Study Notes',
      desc: 'Keep private, structured study notes with rich markdown support, instant search, and local SQLite database persistence.',
      tag: 'Organized',
    },
    {
      icon: HelpCircle,
      title: 'Quiz Generator',
      desc: 'Generate interactive multiple-choice tests with four options, instant scoring, and detailed answer explanations.',
      tag: 'Practice',
    },
    {
      icon: FolderOpen,
      title: 'PDF Assistant',
      desc: 'Upload PDFs, Word documents, and text files. Ask targeted questions grounded strictly in your uploaded syllabus materials.',
      tag: 'RAG Grounded',
    },
    {
      icon: ScanText,
      title: 'Intelligent OCR',
      desc: 'Extract handwritten notes, textbook pages, equations, and diagrams from photos instantly using Gemini Vision.',
      tag: 'Vision AI',
    },
    {
      icon: Mic,
      title: 'Voice Assistant',
      desc: 'Speak your study questions directly with real-time speech-to-text, and listen to synthesized AI tutor explanations.',
      tag: 'Hands-Free',
    },
    {
      icon: Languages,
      title: 'Multi-Language',
      desc: 'Switch effortlessly between English, Telugu (తెలుగు), and Hindi (हिन्दी) for natural, localized study explanations.',
      tag: '3 Languages',
    },
  ];

  const aboutPoints = [
    'Understand difficult topics with simplified real-world examples and step-by-step logic.',
    'Summarize documents into concise 2-mark definitions or comprehensive 10-mark breakdowns.',
    'Generate notes quickly and organize revision by course or subject.',
    'Create practice quizzes from uploaded syllabus materials or topics.',
    'Ask questions directly about your uploaded PDFs, PPTXs, and DOCXs without hallucination.',
    'Extract text from images of whiteboards, diagrams, and notebook pages via OCR.',
    'Practice through AI mock examinations, timed quizzes, and voice queries.',
  ];

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#0F172A] selection:bg-blue-600/20 selection:text-[#1D4ED8] flex flex-col font-sans relative overflow-x-hidden bg-subtle-grid">
      {/* Background Decorative Ambient Radial Glow */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-gradient-to-b from-blue-200/35 via-blue-100/20 to-transparent blur-[110px] pointer-events-none -z-10"
      />

      {/* Sticky White Navbar */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-[#E2E8F0] shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Brand with modern AI Sparkle Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xl tracking-tight text-[#1D4ED8]">SHAB</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EFF6FF] border border-blue-200 text-[10px] font-bold text-[#2563EB] uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-[#2563EB]" />
                AI
              </span>
            </div>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#64748B]">
            <a href="#home" className="hover:text-[#2563EB] transition-colors">
              Home
            </a>
            <a href="#features" className="hover:text-[#2563EB] transition-colors">
              Features
            </a>
            <a href="#about" className="hover:text-[#2563EB] transition-colors">
              About
            </a>
          </nav>

          {/* CTA actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="px-4 py-2 rounded-full text-xs sm:text-sm font-semibold text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => onNavigate('register')}
              className="px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/35 hover:-translate-y-0.5 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Copy & CTAs */}
          <div className="lg:col-span-7 text-left space-y-6">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EFF6FF] border border-blue-200/80 text-xs font-semibold text-[#2563EB] shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse" />
              <span>Next-Generation College Study Platform</span>
              <Zap className="w-3.5 h-3.5 text-[#2563EB]" />
            </div>

            {/* Main Hero Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#0F172A] leading-[1.12]">
              Study Smarter with{' '}
              <span className="bg-gradient-to-r from-[#2563EB] via-[#1D4ED8] to-[#3B82F6] bg-clip-text text-transparent">
                SHAB
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-[#64748B] max-w-xl leading-relaxed">
              Your AI-powered student assistant for mastering college coursework, instant syllabus summaries, exam practice quizzes, notes, and PDF assistance.
            </p>

            {/* CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => onNavigate('register')}
                className="px-8 py-3.5 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 hover:-translate-y-0.5 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="px-7 py-3.5 rounded-full text-sm font-semibold text-[#2563EB] bg-white hover:bg-blue-50/60 border border-blue-200 hover:border-blue-300 shadow-sm flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-[#2563EB]" />
                <span>Try AI Chat</span>
              </button>
            </div>

            {/* Trust highlights */}
            <div className="pt-6 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-[#64748B] font-medium">
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#16A34A]" />
                <span>Real Gemini 2.5 AI Responses</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#16A34A]" />
                <span>2, 5 & 10 Mark College Formats</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#16A34A]" />
                <span>Telugu & Hindi Support</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Modern AI Floating Visual */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            {/* Ambient behind visual */}
            <div className="absolute w-72 h-72 rounded-full bg-gradient-to-tr from-blue-400/20 to-indigo-400/20 blur-3xl -z-10 animate-pulse-glow" />

            {/* Main AI Card */}
            <div className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-3xl border border-blue-100 shadow-2xl shadow-blue-500/10 p-6 sm:p-7 relative z-10 animate-float-slow">
              {/* Header inside card */}
              <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#0F172A] flex items-center gap-1.5">
                      <span>SHAB Study AI</span>
                      <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                    </div>
                    <div className="text-[11px] text-[#64748B]">Personal College Tutor</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#EFF6FF] border border-blue-200 text-[10px] font-bold text-[#2563EB]">
                  ONLINE
                </span>
              </div>

              {/* Bot prompt bubble */}
              <div className="mt-5 p-4 rounded-2xl bg-[#EFF6FF] border border-blue-100">
                <p className="text-xs sm:text-sm font-semibold text-[#1D4ED8] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#2563EB] shrink-0" />
                  <span>"How can I help you study today?"</span>
                </p>
                <p className="text-[11px] text-[#64748B] mt-1.5 leading-relaxed">
                  Upload your syllabus PDF, generate a 10-question practice test, or get a 5-mark answer breakdown.
                </p>
              </div>

              {/* Interactive micro-action list */}
              <div className="mt-4 space-y-2">
                <div className="p-3 rounded-xl bg-white border border-[#E2E8F0] shadow-sm flex items-center justify-between text-xs hover:border-blue-300 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold text-xs">
                      📚
                    </div>
                    <span className="font-semibold text-[#0F172A]">Operating Systems: Deadlocks</span>
                  </div>
                  <span className="text-[10px] text-[#64748B] font-mono">10 Marks</span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#E2E8F0] shadow-sm flex items-center justify-between text-xs hover:border-blue-300 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold text-xs">
                      🧠
                    </div>
                    <span className="font-semibold text-[#0F172A]">Database Normalization (3NF/BCNF)</span>
                  </div>
                  <span className="text-[10px] text-[#16A34A] font-semibold">Ready</span>
                </div>
              </div>

              {/* Mini mock prompt bar */}
              <div className="mt-5 pt-3 border-t border-[#E2E8F0] flex items-center gap-2">
                <div className="flex-1 px-3.5 py-2 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#64748B] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                  <span className="truncate">Explain QuickSort with complexity...</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#2563EB] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Floating Satellite Card 1: Notes (top-left) */}
            <div className="absolute -top-6 -left-4 sm:-left-8 bg-white/95 backdrop-blur-md rounded-2xl border border-blue-100 shadow-xl shadow-blue-500/10 p-3 flex items-center gap-2.5 z-20 animate-float-medium">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-sm shadow-sm">
                📚
              </div>
              <div>
                <div className="text-xs font-bold text-[#0F172A]">Study Notes</div>
                <div className="text-[10px] text-[#16A34A] font-medium">Auto Synced</div>
              </div>
            </div>

            {/* Floating Satellite Card 2: AI Quiz (bottom-right) */}
            <div className="absolute -bottom-6 -right-2 sm:-right-6 bg-white/95 backdrop-blur-md rounded-2xl border border-blue-100 shadow-xl shadow-blue-500/10 p-3 flex items-center gap-2.5 z-20 animate-float-reverse">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center text-sm shadow-sm">
                📝
              </div>
              <div>
                <div className="text-xs font-bold text-[#0F172A]">AI Quiz</div>
                <div className="text-[10px] text-[#2563EB] font-medium">Score: 92%</div>
              </div>
            </div>

            {/* Floating Satellite Card 3: PDF (bottom-left) */}
            <div className="hidden sm:flex absolute bottom-8 -left-10 bg-white/95 backdrop-blur-md rounded-2xl border border-blue-100 shadow-xl shadow-blue-500/10 p-2.5 items-center gap-2 z-20 animate-float-slow">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center text-xs">
                📄
              </div>
              <span className="text-[11px] font-bold text-[#0F172A]">Syllabus.pdf</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#F8FAFC] via-[#FFFFFF] to-[#F8FAFC] border-y border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFF6FF] border border-blue-200 text-xs font-bold text-[#2563EB] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Full-Stack Student Suite</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
              Powerful Tools Crafted for College Success
            </h2>
            <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
              Every feature is built with real Gemini AI intelligence and SQLite data storage to elevate your semester grades.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="group relative p-6 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-300 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Header with Icon and Pill tag */}
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25 group-hover:scale-110 group-hover:shadow-blue-500/40 transition-all duration-300">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#EFF6FF] text-[#2563EB] border border-blue-100">
                        {f.tag}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
                      {f.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#64748B] mt-2 leading-relaxed">
                      {f.desc}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#F1F5F9] flex items-center text-xs font-bold text-[#2563EB] opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Explore feature</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#FFFFFF]">
        <div className="max-w-5xl mx-auto">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-white via-[#F8FAFC] to-[#EFF6FF] border border-[#E2E8F0] shadow-xl shadow-blue-500/5 relative overflow-hidden">
            {/* Ambient corner light */}
            <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-blue-300/20 blur-3xl pointer-events-none" />

            <div className="relative max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-mono uppercase text-[#2563EB] font-bold">
                <Brain className="w-4 h-4 text-[#2563EB]" />
                <span>About SHAB</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
                Why Students Trust SHAB For Every Semester
              </h2>
              <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
                SHAB (Student Helper AI Bot) bridges the gap between massive textbook chapters and college exam prep with precision:
              </p>

              <div className="mt-6 space-y-3 pt-2">
                {aboutPoints.map((point, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#EFF6FF] border border-blue-200 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-[#2563EB]" />
                    </div>
                    <span className="text-xs sm:text-sm text-[#334155] leading-relaxed font-medium">
                      {point}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-[#E2E8F0] flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => onNavigate('register')}
                  className="px-7 py-3 rounded-full text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md shadow-blue-500/25 transition-all cursor-pointer hover:-translate-y-0.5"
                >
                  Create Student Account
                </button>
                <div className="flex items-center gap-2 text-xs text-[#64748B]">
                  <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
                  <span>Free for students · 100% Secure SQLite</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-10 px-4 sm:px-6 lg:px-8 bg-[#F8FAFC] border-t border-[#E2E8F0] text-xs text-[#64748B]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#2563EB] flex items-center justify-center text-white shadow-sm">
              <GraduationCap className="w-4 h-4" />
            </div>
            <span className="text-[#1D4ED8] font-black text-base tracking-tight">SHAB</span>
            <span>— Student Helper AI Bot</span>
          </div>
          <div className="font-medium text-center sm:text-right">
            Premium Modern Blue + White AI Study Platform for College Students
          </div>
        </div>
      </footer>
    </div>
  );
};
