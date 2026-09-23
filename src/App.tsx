import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar, NavTab } from './components/Sidebar';
import { TopNavbar } from './components/TopNavbar';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { FilesPage } from './pages/FilesPage';
import { ChatPage } from './pages/ChatPage';
import { SummaryPage } from './pages/SummaryPage';
import { NotesPage } from './pages/NotesPage';
import { QuizPage } from './pages/QuizPage';
import { OCRPage } from './pages/OCRPage';
import { VoicePage } from './pages/VoicePage';
import { SettingsPage } from './pages/SettingsPage';
import { Loader2 } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [authView, setAuthView] = useState<'landing' | 'login' | 'register' | 'forgot'>('landing');
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center text-[#0F172A]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="text-xs text-slate-500 tracking-wider uppercase font-mono">
            Loading SHAB Assistant...
          </span>
        </div>
      </div>
    );
  }

  // Unauthenticated user
  if (!user) {
    if (authView === 'login') {
      return (
        <LoginPage
          onNavigate={(view) => {
            if (view === 'register') setAuthView('register');
            else if (view === 'forgot') setAuthView('forgot');
            else setAuthView('landing');
          }}
        />
      );
    }
    if (authView === 'register') {
      return (
        <RegisterPage
          onNavigate={(view) => {
            if (view === 'login') setAuthView('login');
            else setAuthView('landing');
          }}
        />
      );
    }
    if (authView === 'forgot') {
      return (
        <ForgotPasswordPage
          onNavigate={() => setAuthView('login')}
        />
      );
    }
    return (
      <LandingPage
        onNavigate={(view) => {
          if (view === 'login' || view === 'chat') setAuthView('login');
          else if (view === 'register') setAuthView('register');
        }}
      />
    );
  }

  // Authenticated Dashboard Layout
  const renderCurrentTab = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardPage onNavigate={(tab) => setCurrentTab(tab)} />;
      case 'files':
        return <FilesPage onNavigateToTab={(tab) => setCurrentTab(tab)} />;
      case 'chat':
        return <ChatPage />;
      case 'summary':
        return <SummaryPage />;
      case 'notes':
        return <NotesPage />;
      case 'quiz':
        return <QuizPage />;
      case 'ocr':
        return <OCRPage onNavigateToTab={(tab) => setCurrentTab(tab)} />;
      case 'voice':
        return <VoicePage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage onNavigate={(tab) => setCurrentTab(tab)} />;
    }
  };

  const getTabTitle = (tab: NavTab) => {
    switch (tab) {
      case 'dashboard':
        return 'Dashboard Overview';
      case 'files':
        return 'Study Materials & Files';
      case 'chat':
        return 'AI Study Tutor';
      case 'summary':
        return 'Smart Summary';
      case 'notes':
        return 'Study Notes';
      case 'quiz':
        return 'AI Quiz Generator';
      case 'ocr':
        return 'Intelligent OCR';
      case 'voice':
        return 'Voice Assistant';
      case 'settings':
        return 'Settings & Profile';
      default:
        return tab;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans">
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area (offset by sidebar width on desktop) */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <TopNavbar
          title={getTabTitle(currentTab)}
          onOpenSidebar={() => setIsSidebarOpen(true)}
        />

        <main className="flex-1 bg-[#F8FAFC]">{renderCurrentTab()}</main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
