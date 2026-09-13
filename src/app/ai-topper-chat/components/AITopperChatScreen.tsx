'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ChatMainArea from './ChatMainArea';
import { getChatHistory, getChatTranscript, type ChatMessage } from '@/lib/chatHistory';
import {
  Sparkles,
  BookOpen,
  PanelLeft,
  Compass,
  Clock,
  ArrowRight,
  ChevronLeft,
  X,
} from 'lucide-react';

export type StudyMode = 'deep-dive' | 'sprint';

// Single source of truth in the lib; re-exported so existing `from './AITopper...'`
// imports keep working while the search/persistence layer shares one type.
export type { ChatMessage } from '@/lib/chatHistory';

export interface SelectedContext {
  subject: string;
  unit: string;
}

export default function AITopperChatScreen() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showExitNotification, setShowExitNotification] = useState(false);
  const [mode, setMode] = useState<StudyMode>('sprint');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedContext, setSelectedContext] = useState<SelectedContext>({
    subject: '',
    unit: '',
  });
  const [selectedModel, setSelectedModel] = useState('openrouter/auto');
  // Active chat session id (drives transcript persistence/loading). Defaults to
  // a fresh id; updated to the loaded chat's id when a search result is picked.
  const [sessionId, setSessionId] = useState(() =>
    typeof window === 'undefined' ? 'chat-new' : `chat-${Date.now()}`
  );

  // Exit trigger listeners for beforeunload and mouseleave exit intent
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Guest session history will be deleted. Sign up to save your progress!';
    };

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        setShowExitNotification(true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // Sync active session when URL searchParam `chatId` changes
  useEffect(() => {
    const urlChatId = searchParams.get('chatId');
    if (urlChatId && urlChatId !== sessionId) {
      const history = getChatHistory();
      const chatItem = history.find((c) => c.id === urlChatId);
      const transcript = getChatTranscript(urlChatId);

      setSessionId(urlChatId);
      setMessages(transcript);
      if (chatItem) {
        if (chatItem.mode) setMode(chatItem.mode);
        if (chatItem.subject && chatItem.unit) {
          setSelectedContext({ subject: chatItem.subject, unit: chatItem.unit });
          localStorage.setItem('nk-subject', chatItem.subject);
          localStorage.setItem('nk-unit', chatItem.unit);
        }
      }
    }
  }, [searchParams, sessionId]);

  // Onboarding Guide State
  const [showGuide, setShowGuide] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Read initial theme
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('nk-theme');
      setTheme(savedTheme === 'dark' ? 'dark' : 'light');

      // Auto-trigger guide for new users
      const guideCompleted = localStorage.getItem('nk-guide-completed');
      if (!guideCompleted) {
        setShowGuide(true);
      }
    }
  }, []);

  useEffect(() => {
    const syncContext = () => {
      const savedSubject = localStorage.getItem('nk-subject') || '';
      const savedUnit = localStorage.getItem('nk-unit') || '';
      setSelectedContext({ subject: savedSubject, unit: savedUnit });
    };
    syncContext();
    window.addEventListener('nk-context-change', syncContext);

    // Listen to theme changes for dynamic guide themes
    const syncTheme = () => {
      const savedTheme = localStorage.getItem('nk-theme');
      setTheme(savedTheme === 'dark' ? 'dark' : 'light');
    };
    window.addEventListener('storage', syncTheme);

    // Support launching guide anytime
    const handleLaunchGuide = () => {
      setCurrentStep(0);
      setShowGuide(true);
    };
    window.addEventListener('nk-launch-guide', handleLaunchGuide);

    return () => {
      window.removeEventListener('nk-context-change', syncContext);
      window.removeEventListener('storage', syncTheme);
      window.removeEventListener('nk-launch-guide', handleLaunchGuide);
    };
  }, []);

  // Resume a chat session chosen from the sidebar Search / recent list.
  useEffect(() => {
    const handleChatLoad = (event: Event) => {
      const detail = (event as CustomEvent).detail as {
        id: string;
        subject: string;
        unit: string;
        mode: StudyMode;
        messages: ChatMessage[];
      };
      if (!detail?.id) return;
      setSessionId(detail.id);
      setMessages(detail.messages ?? []);
      setMode(detail.mode);
      setSelectedContext({ subject: detail.subject, unit: detail.unit });
      // Keep localStorage context in sync so notebooks / ChatMainArea follow.
      localStorage.setItem('nk-subject', detail.subject);
      localStorage.setItem('nk-unit', detail.unit);
    };
    window.addEventListener('nk-chat-load', handleChatLoad);
    return () => window.removeEventListener('nk-chat-load', handleChatLoad);
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleCloseGuide();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCloseGuide = () => {
    localStorage.setItem('nk-guide-completed', 'true');
    setShowGuide(false);
  };

  const steps = [
    {
      title: 'Welcome to e-Mate AI',
      description:
        'Your advanced AI Academic Copilot. e-Mate is designed to customize its explanations based on your active syllabus subject, context unit, and notes.',
      icon: Sparkles,
      color: '#1f51ff',
      badge: 'Getting Started',
    },
    {
      title: 'Dynamic Subject Notebooks',
      description:
        "Each subject gets an isolated notebook. e-Mate automatically remembers key points from your chat history to personalize answers. Manage your notebooks from the sidebar using '+ New notebook' and the 'Manage' panel.",
      icon: BookOpen,
      color: '#365aff',
      badge: 'Personalization',
    },
    {
      title: 'Real-time Resizable Sidebar',
      description:
        'Need more screen space? Drag the divider line on the right side of the sidebar to dynamically resize it to your perfect working width.',
      icon: PanelLeft,
      color: '#5470ff',
      badge: 'Interface',
    },
    {
      title: 'Locked Study Context',
      description:
        "Ensure precise replies by selecting your subject and unit from the 'Study Context' panel. e-Mate will base its knowledge on your syllabus constraints.",
      icon: Compass,
      color: '#6f86ff',
      badge: 'Exam Precision',
    },
    {
      title: 'Real-time Recent Chats',
      description:
        'Your conversations are saved and synced in real-time in the sidebar, allowing you to instantly rename, delete, or resume previous chats.',
      icon: Clock,
      color: '#8aa2ff',
      badge: 'Productivity',
    },
  ];

  const ActiveIcon = steps[currentStep].icon;

  return (
    <div className="relative flex h-screen min-h-screen overflow-hidden">
      {/* Leave Notification Banner */}
      {showExitNotification && (
        <div className="fixed top-4 right-4 z-[300] max-w-md p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-white shadow-2xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div>
            <p className="text-sm font-semibold">Sign up to save your progress!</p>
            <p className="text-xs text-zinc-400">
              Guest chats are non-persistent and will be cleared when you leave.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/sign-up-login-screen')}
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-500 transition-colors"
            >
              Sign Up
            </button>
            <button
              onClick={() => setShowExitNotification(false)}
              className="text-zinc-400 text-xs hover:text-white"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        <div className="flex h-full flex-col overflow-hidden">
          <ChatMainArea
            messages={messages}
            setMessages={setMessages}
            mode={mode}
            setMode={setMode}
            sessionId={sessionId}
            selectedContext={selectedContext}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
          />
        </div>
      </div>

      {/* Dynamic Onboarding Guide Modal */}
      {showGuide && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(16px)' }}
        >
          {/* Keyframe Animations */}
          <style
            dangerouslySetInnerHTML={{
              __html: `
            @keyframes guide-scale-up {
              0% { transform: scale(0.95); opacity: 0; }
              100% { transform: scale(1); opacity: 1; }
            }
            @keyframes content-slide-in {
              0% { transform: translateY(10px); opacity: 0; }
              100% { transform: translateY(0); opacity: 1; }
            }
            .guide-modal-glow {
              box-shadow: 0 0 40px rgba(31, 81, 255, 0.10), inset 0 1px 1px rgba(138, 162, 255, 0.12);
            }
            .mesh-grad {
              background-image: radial-gradient(at 0% 0%, rgba(31, 81, 255, 0.08) 0, transparent 50%), radial-gradient(at 50% 0%, rgba(138, 162, 255, 0.05) 0, transparent 50%);
            }
            button { cursor: pointer; }
            button:disabled { cursor: not-allowed; }
            @media (prefers-reduced-motion: reduce){ *,*::before,*::after { animation:none !important; transition:none !important } }
          `,
            }}
          />

          <div
            className="relative w-full max-w-lg rounded-[32px] overflow-hidden transition-all duration-500 guide-modal-glow animate-[guide-scale-up_0.35s_ease-out]"
            style={{
              background: theme === 'dark' ? '#141417' : '#ffffff',
              border:
                theme === 'dark'
                  ? '1px solid rgba(138,162,255,0.18)'
                  : '1px solid rgba(31,81,255,0.16)',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {/* Glowing background accent behind the icon */}
            <div
              className="absolute -top-12 -left-12 w-48 h-48 rounded-full blur-[80px]"
              style={{ background: steps[currentStep].color + '15' }}
            />

            {/* Decorative Banner with Mesh Gradient */}
            <div
              className="h-36 flex items-center justify-center relative mesh-grad border-b"
              style={{
                borderColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                background: `linear-gradient(180deg, ${steps[currentStep].color}18 0%, transparent 100%)`,
              }}
            >
              <div
                className="h-20 w-20 rounded-[24px] flex items-center justify-center shadow-2xl transition-all duration-300 transform scale-110 relative"
                style={{
                  background: theme === 'dark' ? '#1b1b20' : '#f4f5fb',
                  border:
                    theme === 'dark'
                      ? '1px solid rgba(138,162,255,0.12)'
                      : '1px solid rgba(31,81,255,0.10)',
                }}
              >
                <div
                  className="absolute inset-0 rounded-[24px] blur-md opacity-40"
                  style={{ background: steps[currentStep].color }}
                />
                <ActiveIcon
                  size={36}
                  className="relative z-10"
                  style={{ color: steps[currentStep].color }}
                />
              </div>
              <button
                onClick={handleCloseGuide}
                className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center border transition-all hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 z-20"
                style={{
                  borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  color: theme === 'dark' ? '#a1a1aa' : '#71717a',
                }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-8 py-8 space-y-8 relative z-10">
              <div className="space-y-3 text-center animate-[content-slide-in_0.4s_ease-out]">
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.25em] px-3.5 py-1.5 rounded-full inline-block"
                  style={{
                    background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                    color: theme === 'dark' ? '#ffffff' : '#000000',
                    border:
                      theme === 'dark'
                        ? '1px solid rgba(255,255,255,0.08)'
                        : '1px solid rgba(0,0,0,0.08)',
                  }}
                >
                  {steps[currentStep].badge}
                </span>
                <h3
                  className="text-2xl font-black tracking-tight mt-2"
                  style={{ color: theme === 'dark' ? '#ffffff' : '#000000' }}
                >
                  {steps[currentStep].title}
                </h3>
                <p
                  className="text-sm leading-relaxed max-w-sm mx-auto"
                  style={{ color: theme === 'dark' ? '#a1a1aa' : '#52525b' }}
                >
                  {steps[currentStep].description}
                </p>
              </div>

              {/* Progress Indicator */}
              <div className="flex justify-center items-center gap-2">
                {steps.map((_, idx) => (
                  <div
                    key={idx}
                    className="h-1.5 rounded-full transition-all duration-500"
                    style={{
                      width: currentStep === idx ? '28px' : '6px',
                      background:
                        currentStep === idx
                          ? theme === 'dark'
                            ? '#8aa2ff'
                            : '#1f51ff'
                          : theme === 'dark'
                            ? 'rgba(255,255,255,0.15)'
                            : 'rgba(0,0,0,0.15)',
                    }}
                  />
                ))}
              </div>

              {/* Navigation Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-2xl border transition-all duration-200 disabled:opacity-20 disabled:cursor-not-allowed hover:bg-black/5 dark:hover:bg-white/5 active:scale-95"
                  style={{
                    borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    color: theme === 'dark' ? '#ffffff' : '#000000',
                  }}
                >
                  <ChevronLeft size={14} />
                  <span>Back</span>
                </button>

                <button
                  onClick={handleNext}
                  className="px-6 py-3 rounded-2xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                  style={{
                    background: theme === 'dark' ? '#8aa2ff' : '#1f51ff',
                    color: theme === 'dark' ? '#0b0b0d' : '#ffffff',
                    boxShadow:
                      theme === 'dark'
                        ? '0 8px 24px rgba(31,81,255,0.35)'
                        : '0 8px 24px rgba(31,81,255,0.28)',
                  }}
                >
                  <span>{currentStep === steps.length - 1 ? 'Start Learning' : 'Continue'}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
