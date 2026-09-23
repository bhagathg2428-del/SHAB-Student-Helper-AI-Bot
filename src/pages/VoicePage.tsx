import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  RotateCcw,
  MessageSquare,
  AlertCircle,
  Loader2,
  Globe,
  Radio,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SupportedLanguage } from '../types';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

export const VoicePage: React.FC = () => {
  const { language, setLanguage } = useAuth();
  const [isListening, setIsListening] = useState(false);
  const [spokenTranscript, setSpokenTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'listening' | 'transcribing' | 'speaking'>('idle');

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : 'en-US';

      recognition.onresult = (event: any) => {
        setVoiceStatus('transcribing');
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          finalTranscript += event.results[i][0].transcript;
        }
        setSpokenTranscript(finalTranscript);
      };

      recognition.onerror = (e: any) => {
        console.error('Voice recognition error:', e);
        setIsListening(false);
        setVoiceStatus('idle');
      };

      recognition.onend = () => {
        setIsListening(false);
        if (voiceStatus !== 'speaking' && !loading) {
          setVoiceStatus('idle');
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      window.speechSynthesis?.cancel();
    };
  }, [language]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setError('Voice speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setVoiceStatus('idle');
    } else {
      setError(null);
      setSpokenTranscript('');
      setAiResponse(null);
      stopAudio();
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setVoiceStatus('listening');
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSendSpokenQuestion = async () => {
    if (!spokenTranscript.trim() || loading) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    setLoading(true);
    setError(null);
    setVoiceStatus('transcribing');

    try {
      const reply = await api.sendMessage({
        message: spokenTranscript.trim(),
        language,
      });

      setAiResponse(reply.content);
      speakText(reply.content);
    } catch (err: any) {
      setError(err.message || 'Failed to get voice reply.');
      setVoiceStatus('idle');
    } finally {
      setLoading(false);
    }
  };

  const speakText = (text: string) => {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    // Strip markdown symbols for natural TTS speech
    const cleanText = text
      .replace(/[#*_`]/g, '')
      .replace(/\|/g, ' ')
      .slice(0, 1500);

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsPlayingAudio(true);
      setVoiceStatus('speaking');
    };

    utterance.onend = () => {
      setIsPlayingAudio(false);
      setVoiceStatus('idle');
    };

    utterance.onerror = () => {
      setIsPlayingAudio(false);
      setVoiceStatus('idle');
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopAudio = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      if (voiceStatus === 'speaking') setVoiceStatus('idle');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-4xl mx-auto font-sans bg-[#F8FAFC]">
      {/* Title */}
      <div className="bg-white p-6 rounded-3xl border border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
              Interactive Voice Tutor
            </h1>
            <p className="text-sm text-[#64748B] mt-0.5 font-medium">
              Talk directly with SHAB in your preferred language and hear natural explanations.
            </p>
          </div>
        </div>

        {/* Language Selector: English, Telugu, Hindi */}
        <div className="flex items-center p-1.5 rounded-full bg-slate-100 border border-slate-200 self-start sm:self-auto">
          {[
            { id: 'en', label: 'English' },
            { id: 'te', label: 'Telugu' },
            { id: 'hi', label: 'Hindi' },
          ].map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setLanguage(l.id as SupportedLanguage)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                language === l.id
                  ? 'bg-white text-[#2563EB] shadow-sm'
                  : 'text-slate-600 hover:text-[#0F172A]'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-xs text-[#DC2626] font-medium">
          <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Voice Hub Card */}
      <div className="p-8 sm:p-14 rounded-3xl bg-white border border-[#E2E8F0] shadow-xl shadow-blue-500/5 flex flex-col items-center justify-center text-center relative overflow-hidden">
        {/* Animated Ripple Waves when Listening */}
        {isListening && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-44 h-44 rounded-full bg-blue-500/15 animate-ping" />
            <div className="w-64 h-64 rounded-full bg-blue-600/10 animate-pulse" />
            <div className="w-80 h-80 rounded-full bg-blue-700/5" />
          </div>
        )}

        {/* Large Microphone Button in Center */}
        <button
          type="button"
          onClick={toggleListening}
          className={`relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer shadow-xl ${
            isListening
              ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white scale-105 shadow-red-500/30 ring-8 ring-red-100 animate-pulse'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white hover:scale-105 shadow-blue-500/30 ring-8 ring-blue-50 hover:ring-blue-100'
          }`}
          title={isListening ? 'Click to stop listening' : 'Click to start voice question'}
        >
          {isListening ? (
            <MicOff className="w-12 h-12" />
          ) : (
            <Mic className="w-12 h-12" />
          )}
        </button>

        {/* Status Indicator: 'Listening...', 'Transcribing...', 'Speaking...' */}
        <div className="mt-8 flex items-center gap-2">
          {voiceStatus === 'listening' && (
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[#2563EB] text-xs font-bold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
              <span>Listening...</span>
            </div>
          )}
          {voiceStatus === 'transcribing' && (
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[#2563EB] text-xs font-bold">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2563EB]" />
              <span>Transcribing...</span>
            </div>
          )}
          {voiceStatus === 'speaking' && (
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-[#16A34A] text-xs font-bold">
              <Volume2 className="w-3.5 h-3.5 text-[#16A34A] animate-pulse" />
              <span>Speaking...</span>
            </div>
          )}
          {voiceStatus === 'idle' && (
            <div className="text-xs font-bold text-slate-400">
              Tap the microphone to speak
            </div>
          )}
        </div>

        <div className="mt-3 text-lg font-black text-[#0F172A]">
          {isListening
            ? 'Speak your question or doubt clearly'
            : 'Ask SHAB anything with voice'}
        </div>

        {/* Spoken Transcript Input/Display */}
        <div className="mt-6 w-full max-w-xl">
          <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-left min-h-[90px] relative shadow-inner">
            <div className="text-[10px] uppercase font-mono font-bold text-[#64748B] mb-1">
              Spoken Query:
            </div>
            <textarea
              value={spokenTranscript}
              onChange={(e) => setSpokenTranscript(e.target.value)}
              placeholder="Your voice transcript will appear here. You can also edit it before submitting..."
              className="w-full bg-transparent text-sm text-[#0F172A] placeholder-slate-400 focus:outline-none resize-none font-medium"
              rows={2}
            />

            {spokenTranscript && (
              <button
                type="button"
                onClick={() => setSpokenTranscript('')}
                className="absolute top-4 right-4 text-xs text-[#64748B] hover:text-[#0F172A] font-semibold"
              >
                Clear
              </button>
            )}
          </div>

          {spokenTranscript.trim() && (
            <div className="mt-3.5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleSendSpokenQuestion}
                disabled={loading}
                className="px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md shadow-blue-500/25 flex items-center gap-2 transition-all cursor-pointer hover:-translate-y-0.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Ask SHAB Now</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Spoken AI Response Card */}
      {aiResponse && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] border border-blue-100 flex items-center justify-center text-[#2563EB]">
                <Volume2 className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-[#1D4ED8] tracking-tight">SHAB Spoken Explanation</h2>
            </div>

            <div className="flex items-center gap-2">
              {isPlayingAudio ? (
                <button
                  type="button"
                  onClick={stopAudio}
                  className="px-4 py-2 rounded-full bg-red-50 text-[#DC2626] hover:bg-red-100 border border-red-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>Stop Speaking</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => speakText(aiResponse)}
                  className="px-4 py-2 rounded-full bg-[#EFF6FF] hover:bg-blue-100 text-[#2563EB] border border-blue-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Listen Again</span>
                </button>
              )}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#F8FAFF] border border-blue-100 text-[#334155]">
            <MarkdownRenderer content={aiResponse} />
          </div>
        </div>
      )}
    </div>
  );
};
