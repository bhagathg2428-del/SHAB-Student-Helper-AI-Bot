import React, { useState } from 'react';
import { Menu, Globe, Bell, Check, Sparkles, Search, Command } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SupportedLanguage } from '../types';

interface TopNavbarProps {
  title: string;
  onOpenSidebar: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ title, onOpenSidebar }) => {
  const { user, language, setLanguage } = useAuth();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const languages: { code: SupportedLanguage; label: string; native: string }[] = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'te', label: 'Telugu', native: 'తెలుగు' },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  ];

  const currentLang = languages.find((l) => l.code === language) || languages[0];

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-xl border-b border-[#E2E8F0] shadow-sm px-4 sm:px-6 flex items-center justify-between transition-all">
      {/* Left: Mobile hamburger + Page Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="p-2 rounded-xl text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] lg:hidden border border-transparent hover:border-[#E2E8F0] transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-xs text-[#64748B]">
            <span className="font-extrabold text-[#2563EB] tracking-tight">SHAB</span>
            <span aria-hidden="true" className="text-slate-300">/</span>
            <span className="text-[#0F172A] capitalize font-semibold">{title}</span>
          </div>
        </div>
      </div>

      {/* Center: Modern Search Box */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <div className="w-full relative">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search notes, quizzes, or syllabus..."
            className="w-full pl-9 pr-10 py-1.5 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all shadow-inner"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-mono text-slate-400">
            <Command className="w-2.5 h-2.5" />
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Right controls: Language, Notifications & User */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Language selector dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFFFFF] hover:bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors shadow-sm"
            title="Select response language"
          >
            <Globe className="w-3.5 h-3.5 text-[#2563EB]" />
            <span className="hidden sm:inline">{currentLang.label}</span>
            <span className="sm:hidden">{currentLang.code.toUpperCase()}</span>
          </button>

          {showLangMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowLangMenu(false)} />
              <div className="absolute right-0 mt-1.5 w-48 rounded-2xl bg-[#FFFFFF] border border-[#E2E8F0] py-1.5 shadow-xl z-20">
                <div className="px-3 py-1 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  AI Language
                </div>
                {languages.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => {
                      setLanguage(l.code);
                      setShowLangMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors ${
                      language === l.code ? 'bg-[#EFF6FF] text-[#2563EB] font-bold' : 'text-[#64748B] hover:bg-[#F8FAFF]'
                    }`}
                  >
                    <div>
                      <span>{l.label}</span>
                      <span className="ml-1.5 text-[11px] text-[#64748B]">({l.native})</span>
                    </div>
                    {language === l.code && <Check className="w-3.5 h-3.5 text-[#2563EB]" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Notifications toggle */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-full bg-[#FFFFFF] hover:bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] transition-colors relative shadow-sm"
            title="Notifications"
          >
            <Bell className="w-4 h-4 text-[#64748B]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#2563EB] ring-2 ring-[#FFFFFF]" />
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-[#FFFFFF] border border-[#E2E8F0] p-3.5 shadow-2xl z-20">
                <div className="flex items-center justify-between pb-2.5 border-b border-[#E2E8F0]">
                  <span className="text-xs font-bold text-[#0F172A]">Study Updates</span>
                  <span className="text-[10px] text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded-full border border-blue-200 font-bold">
                    Active
                  </span>
                </div>
                <div className="py-2.5 space-y-2 text-xs">
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#F8FAFF] border border-blue-100">
                    <Sparkles className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[#0F172A] font-semibold">Gemini 2.5 Tutor Online</div>
                      <div className="text-[#64748B] text-[11px] mt-0.5">
                        Ask for "2 marks", "5 marks", or "10 marks" formatted college answers anytime.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User profile indicator */}
        <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-[#E2E8F0]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm ring-2 ring-blue-100">
            {user?.full_name ? user.full_name.charAt(0) : 'S'}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-[#0F172A] truncate max-w-[120px]">
              {user?.full_name || 'Student'}
            </div>
            <div className="text-[10px] text-[#16A34A] font-semibold leading-none flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] inline-block" />
              <span>Online</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
