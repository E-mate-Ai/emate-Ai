'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Zap,
  BookOpen,
  Square,
  Plus,
  ChevronDown,
  ChevronUp,
  Brain,
  FileText,
  Lightbulb,
  Sparkles,
  Check,
  Compass,
  BookMarked,
  Code2,
  PenLine,
  MessageSquare,
  GraduationCap,
  Volume2,
  X,
  Key,
  ImagePlus,
  Menu,
  NotebookText,
  Lock,
  UploadCloud,
} from 'lucide-react';
import ChatMessageBubble from './ChatMessageBubble';
import StreamingIndicator from './StreamingIndicator';
import { PromptInput } from '@/components/ui/ai-chat-input';
import type { ChatMessage, SelectedContext, StudyMode } from './AITopperChatScreen';
import { applyTheme } from '@/lib/theme';
import { ModelSelector } from '@/components/ModelSelector';
import { buildNotebookContext, appendToNotebook, addSubject, getSubjects, type Subject } from '@/lib/notebook';
import { saveChatSession, saveChatTranscript } from '@/lib/chatHistory';
import { loadDemoNotebook } from '@/lib/demoNotebook';
import {
  GUEST_LIMIT,
  DAILY_LIMIT,
  getGuestCredits,
  spendGuestCredit,
  spendAuthCredit,
  authCreditsExhausted,
} from '@/lib/credits';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';

const MCQAssessmentContainer = dynamic(() => import('@/components/MCQAssessmentContainer'), {
  ssr: false,
});
import type { MCQQuiz, MCQSubmission } from '@/lib/agents/types';
import { generateAnalyzerReport } from '@/lib/agents/studyAnalyzer';

// Study quick actions are built dynamically inside the component from selectedContext.

const GENERAL_QUICK_ACTIONS = [
  {
    icon: Code2,
    label: 'Code & algorithms',
    prompt: 'Help me write, debug, or optimize code for: ',
  },
  {
    icon: PenLine,
    label: 'Refine notes & drafts',
    prompt: 'Help me polish and structure this study draft: ',
  },
  {
    icon: Brain,
    label: 'Brainstorm study plan',
    prompt: 'Help me design a high-efficiency study plan for: ',
  },
  {
    icon: Compass,
    label: 'Step-by-step breakdown',
    prompt: 'Break down this complex topic into clear, easy steps: ',
  },
];

// Guests get targeted study quick actions: step-by-step breakdown and high-yield summary.
const GUEST_QUICK_ACTIONS = [
  {
    icon: Compass,
    label: 'Step-by-step breakdown',
    prompt: 'Explain this topic step-by-step with exam-ready clarity: ',
  },
  {
    icon: Sparkles,
    label: 'High-yield summary',
    prompt: 'Summarize this into high-yield, exam-focused key points: ',
  },
];

interface ChatMainAreaProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  mode: StudyMode;
  setMode: (m: StudyMode) => void;
  sessionId: string;
  selectedContext: SelectedContext;
  selectedModel: string;
  setSelectedModel: (m: string) => void;
}

let msgCounter = 1;

const getTimeGreeting = (date = new Date()) => {
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 14) return 'Good noon';
  if (hour >= 14 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 21) return 'Good evening';
  return 'Good night';
};

export default function ChatMainArea({
  messages,
  setMessages,
  mode,
  setMode,
  sessionId,
  selectedContext,
  selectedModel,
  setSelectedModel,
}: ChatMainAreaProps) {
  const router = useRouter();
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [isStudyMode, setIsStudyMode] = useState(true); // server-safe default — synced from localStorage in useEffect
  const [isOpenRouterConnected, setIsOpenRouterConnected] = useState(true); // default to true, check in client mount
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [isConnectingOpenRouter, setIsConnectingOpenRouter] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [guestCredits, setGuestCreditsState] = useState(GUEST_LIMIT);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isSupabaseSignedUp, setIsSupabaseSignedUp] = useState(false);
  const popupRef = useRef<Window | null>(null);

  // Keep subjects list in sync — initial load + reactive updates.
  useEffect(() => {
    setSubjects(getSubjects()); // populate from localStorage after hydration
    const sync = () => setSubjects(getSubjects());
    window.addEventListener('nk-subjects-changed', sync);
    return () => window.removeEventListener('nk-subjects-changed', sync);
  }, []);

  // Track Supabase auth state & unique session ID
  useEffect(() => {
    let authSub: { unsubscribe: () => void } | null = null;
    const checkSupabase = async () => {
      try {
        const { trackUserSession } = await import('@/lib/session');
        await trackUserSession();

        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        setIsSupabaseSignedUp(!!user);
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          setIsSupabaseSignedUp(!!session?.user);
          trackUserSession();
        });
        authSub = subscription;
      } catch { setIsSupabaseSignedUp(false); }
    };
    checkSupabase();
    return () => { authSub?.unsubscribe(); };
  }, []);

  // Identity: signed-up users (Supabase) OR connected OpenRouter users get full unlocked access!
  const isAuthenticated = isSupabaseSignedUp || isOpenRouterConnected;
  const isGuest = !isAuthenticated;

  // Guests are locked to the fast free model.
  const GUEST_MODEL = 'google/gemini-2.0-flash';

  // True once a guest has burned through the trial allowance. Drives the soft
  // conversion gate (sign-up CTA) while preserving their chat context.
  const isGuestOutOfCredits = isGuest && guestCredits <= 0;

  // Build study action tiles dynamically from the active notebook context
  const studyQuickActions = useMemo(
    () => [
      {
        icon: BookOpen,
        label: 'Practice quiz questions',
        prompt: `Generate 5 high-probability quiz questions for ${selectedContext.subject} — ${selectedContext.unit} with detailed model answers`,
      },
      {
        icon: Sparkles,
        label: 'High-yield summary',
        prompt: `Provide a concise, high-yield study summary for ${selectedContext.subject} — ${selectedContext.unit}`,
      },
      {
        icon: Brain,
        label: 'Concept deep-dive',
        prompt: `Explain ${selectedContext.unit} (${selectedContext.subject}) from first principles with exam tips and intuitive examples`,
      },
      {
        icon: Compass,
        label: 'Formulas & cheat sheet',
        prompt: `List all essential formulas, theorems, and definitions for ${selectedContext.subject} — ${selectedContext.unit}`,
      },
    ],
    [selectedContext.subject, selectedContext.unit]
  );
  const handleConnectOpenRouter = useCallback(() => {
    setShowConnectModal(true);
  }, []);

  // Open OAuth in a popup window
  const handleOpenRouterConnect = () => {
    setShowConnectModal(false);
    const w = 600,
      h = 700;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top = window.screenY + (window.outerHeight - h) / 2;
    const popup = window.open(
      '/api/auth/openrouter/connect',
      'OpenRouter Auth',
      `width=${w},height=${h},left=${left},top=${top},toolbar=no,menubar=no`
    );
    popupRef.current = popup;
    setIsConnectingOpenRouter(true);

    // Poll to detect if the user manually closed the popup
    const pollTimer = setInterval(() => {
      if (popup && popup.closed) {
        clearInterval(pollTimer);
        setIsConnectingOpenRouter(false);
        popupRef.current = null;
      }
    }, 500);
  };

  const checkConnection = useCallback(() => {
    // 1. Check localStorage
    const localKey = typeof window !== 'undefined' ? localStorage.getItem('user_openrouter_key') : null;

    // 2. Check document cookies
    const cookieKey = typeof document !== 'undefined'
      ? document.cookie.split('; ').find((row) => row.startsWith('user_openrouter_key='))?.split('=')[1]
      : null;

    if (localKey || cookieKey) {
      setIsOpenRouterConnected(true);
      return true;
    }
    setIsOpenRouterConnected(false);
    return false;
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Sync study mode from localStorage after hydration
      const saved = localStorage.getItem('nk-study-mode-active');
      if (saved !== null) setIsStudyMode(saved !== 'false');

      // Sync guest trial credit count from localStorage
      setGuestCreditsState(getGuestCredits());

      const hasConnection = checkConnection();

      // Check when URL query parameter changes
      const params = new URLSearchParams(window.location.search);
      if (params.get('connected') === 'true') {
        const cookieKey = document.cookie.split('; ').find((row) => row.startsWith('user_openrouter_key='))?.split('=')[1];
        if (cookieKey) {
          localStorage.setItem('user_openrouter_key', cookieKey);
        }
        checkConnection();
        router.replace('/ai-topper-chat');
      } else if (!hasConnection) {
        // Fallback check server status route
        fetch('/api/auth/openrouter/status')
          .then((res) => res.json())
          .then((data) => {
            if (data?.connected) {
              setIsOpenRouterConnected(true);
            }
          })
          .catch(() => {});
      }
    }
  }, [router, checkConnection]);

  // Listen for postMessage from OAuth popup callback
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OPENROUTER_AUTH_SUCCESS') {
        if (event.data.key) {
          localStorage.setItem('user_openrouter_key', event.data.key);
        }
        setIsConnectingOpenRouter(false);
        setIsOpenRouterConnected(true);
        popupRef.current = null;
        setShowToast(true);
      }
    };
    const handleOpenModal = () => {
      handleConnectOpenRouter();
    };
    window.addEventListener('message', handleMessage);
    window.addEventListener('nk-open-openrouter-modal', handleOpenModal);
    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('nk-open-openrouter-modal', handleOpenModal);
    };
  }, [handleConnectOpenRouter]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Persist the mode choice so it survives page reloads and new chats
      localStorage.setItem('nk-study-mode-active', String(isStudyMode));
      localStorage.setItem('nk-general-chat-active', String(!isStudyMode));
      window.dispatchEvent(new Event('nk-general-chat-change'));
    }
  }, [isStudyMode]);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [imageGenMode, setImageGenMode] = useState(false);
  const [quizQuiz, setQuizQuiz] = useState<MCQQuiz | null>(null);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  // Preserved quiz data for the reinforce flow — survives after quizQuiz is cleared.
  const lastQuizRef = useRef<MCQQuiz | null>(null);

  // Full-chat drag-and-drop state
  const [isWindowDragging, setIsWindowDragging] = useState(false);
  const windowDragCounterRef = useRef(0);

  const handleWindowDragEnter = useCallback(
    (e: React.DragEvent) => {
      if (isGuest) return;
      e.preventDefault();
      e.stopPropagation();
      windowDragCounterRef.current += 1;
      if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        setIsWindowDragging(true);
      }
    },
    [isGuest]
  );

  const handleWindowDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    windowDragCounterRef.current -= 1;
    if (windowDragCounterRef.current <= 0) {
      windowDragCounterRef.current = 0;
      setIsWindowDragging(false);
    }
  }, []);

  const handleWindowDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleWindowDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      windowDragCounterRef.current = 0;
      setIsWindowDragging(false);
      if (isGuest) return;

      const droppedFiles = Array.from(e.dataTransfer.files || []);
      const validFiles = droppedFiles.filter(
        (f) => f.type.startsWith('image/') || f.type !== ''
      );
      if (validFiles.length === 0) return;

      setAttachedFiles((prev) => [...prev, ...validFiles]);
      setPreviewUrls((prev) => [
        ...prev,
        ...validFiles.map((f) => (f.type.startsWith('image/') ? URL.createObjectURL(f) : '')),
      ]);
      toast.success(`${validFiles.length} file(s) attached`);
    },
    [isGuest]
  );

  // Clear stale quiz state when switching notebooks or study context so old
  // results don't carry over into a new subject/unit.
  useEffect(() => {
    setQuizQuiz(null);
    setShowQuizModal(false);
    setQuizLoading(false);
  }, [selectedContext.subject, selectedContext.unit]);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const modelMenuRef = useRef<HTMLDivElement>(null);

  const MODELS = [
    { id: 'google/gemini-2.0-flash', name: 'Gemini 2.0 Flash', badge: 'Fastest' },
    { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', badge: 'Latest' },
    { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', badge: 'Powerful' },
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', badge: 'Efficient' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', badge: 'Smartest' },
  ];

  const activeModel = MODELS.find((m) => m.id === selectedModel) || MODELS[0];

  // Lock guests to the fast free model — the model switcher is hidden for them.
  useEffect(() => {
    if (isGuest && selectedModel !== GUEST_MODEL) {
      setSelectedModel(GUEST_MODEL);
    }
  }, [isGuest, selectedModel, setSelectedModel, GUEST_MODEL]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(event.target as Node)) {
        setIsModelMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('nk-sidebar-open');
    if (saved !== null) {
      setIsSidebarOpen(saved === 'true');
    }

    const handleSidebarChange = () => {
      const current = localStorage.getItem('nk-sidebar-open');
      if (current !== null) {
        setIsSidebarOpen(current === 'true');
      }
    };

    window.addEventListener('nk-sidebar-change', handleSidebarChange);
    return () => window.removeEventListener('nk-sidebar-change', handleSidebarChange);
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const centerInputRef = useRef<HTMLTextAreaElement>(null);
  // Stable session id — mirrors `sessionId` prop (set by parent on resume load).
  const sessionIdRef = useRef(sessionId);
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Smooth auto-scroll to the bottom of the conversation as messages arrive or stream
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  useEffect(() => {
    if (!messages.length) {
      setTimeout(() => centerInputRef.current?.focus(), 50);
    }
  }, [messages.length]);

  // Sync theme state with localStorage — server-safe: start with 'light', read localStorage after mount
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  useEffect(() => {
    const updateTheme = () => {
      const savedTheme = localStorage.getItem('nk-theme') as 'light' | 'dark' | null;
      const t = savedTheme || 'light';
      setTheme(t);
      applyTheme(t);
    };

    updateTheme();
    window.addEventListener('storage', updateTheme);
    return () => window.removeEventListener('storage', updateTheme);
  }, []);

  // Voice + attachments are handled by the PromptInput composer itself.
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setAttachedFiles((prev) => [...prev, ...files]);

      // Create preview URLs
      const newPreviews = files.map((f) => {
        if (f.type.startsWith('image/')) return URL.createObjectURL(f);
        return 'doc'; // placeholder for non-images
      });
      setPreviewUrls((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => {
      const newUrls = [...prev];
      if (newUrls[index] !== 'doc') URL.revokeObjectURL(newUrls[index]);
      newUrls.splice(index, 1);
      return newUrls;
    });
  };

  const convertFilesToBase64 = async (
    files: File[]
  ): Promise<{ data: string; mimeType: string; text?: string; fileName?: string }[]> => {
    return Promise.all(
      files.map((file) => {
        return new Promise<{ data: string; mimeType: string; text?: string; fileName?: string }>(
          (resolve, reject) => {
            const isTextFile =
              file.type.startsWith('text/') ||
              file.name.endsWith('.md') ||
              file.name.endsWith('.json') ||
              file.name.endsWith('.csv') ||
              file.name.endsWith('.xml') ||
              file.name.endsWith('.yaml') ||
              file.name.endsWith('.yml') ||
              file.name.endsWith('.txt');

            if (isTextFile) {
              const reader = new FileReader();
              reader.onload = () => {
                const textContent = reader.result as string;
                resolve({ data: '', mimeType: file.type, text: textContent, fileName: file.name });
              };
              reader.onerror = reject;
              reader.readAsText(file);
            } else {
              const reader = new FileReader();
              reader.onload = () => {
                const result = reader.result as string;
                const base64Data = result.split(',')[1];
                resolve({ data: base64Data, mimeType: file.type, fileName: file.name });
              };
              reader.onerror = reject;
              reader.readAsDataURL(file);
            }
          }
        );
      })
    );
  };

  // ── Image Generation (authenticated-only) ──────────────────────────────────

  /** Send an image generation request and stream the result into the chat. */
  const handleImageSend = async (prompt: string) => {
    if (!prompt.trim() || isStreaming) return;
    setImageGenMode(false); // turn off mode after submitting

    const formatTimestamp = () => {
      try {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch (_) {
        const now = Date.now();
        return `${new Date(now).getHours()}:${String(new Date(now).getMinutes()).padStart(2, '0')}`;
      }
    };

    const userMsg: ChatMessage = {
      id: `msg-${String(msgCounter++).padStart(3, '0')}`,
      role: 'user',
      content: prompt,
      mode,
      timestamp: formatTimestamp(),
      subject: selectedContext.subject,
      isGeneralChat: !isStudyMode,
      images: [],
    };

    const imageId = `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const assistantMsg: ChatMessage = {
      id: `msg-${String(msgCounter++).padStart(3, '0')}`,
      role: 'assistant',
      content: '',
      mode,
      timestamp: formatTimestamp(),
      subject: selectedContext.subject,
      isGeneralChat: !isStudyMode,
      images: [{ id: imageId, url: '', prompt, status: 'generating' }],
    };

    const newMessages = [...messages, userMsg, assistantMsg];
    setMessages(newMessages);
    setInputValue('');
    setIsStreaming(true);

    // Persist the user prompt to transcript (images themselves are stripped).
    if (!isGuest) {
      saveChatSession({
        id: sessionIdRef.current,
        title: prompt.length > 60 ? prompt.slice(0, 57) + '…' : prompt,
        subject: selectedContext.subject,
        unit: selectedContext.unit,
        mode,
        timestamp: Date.now(),
      });
      saveChatTranscript(sessionIdRef.current, newMessages);
    }

    // Pre-flight key verification: check if user has a connected OpenRouter key
    const userApiKey = typeof window !== 'undefined'
      ? localStorage.getItem('user_openrouter_key') ||
        (document.cookie.split('; ').find((row) => row.startsWith('user_openrouter_key='))?.split('=')[1] ?? '')
      : '';

    if (!userApiKey) {
      toast.error('AI Image & Visual Note Generation is an e-Mate Plus feature. Upgrade to e-Mate Plus or connect your OpenRouter key to continue.');
      handleConnectOpenRouter();
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== assistantMsg.id || !m.images?.length) return m;
          return {
            ...m,
            images: [{ ...m.images[0], status: 'error' }],
            content: 'AI Image & Visual Note Generation is an e-Mate Plus feature. Upgrade to e-Mate Plus or connect your OpenRouter key to continue.',
          };
        })
      );
      setIsStreaming(false);
      return;
    }

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userApiKey}`,
        },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 401 || res.status === 403 || data?.code === 'auth_required' || data?.error?.includes('connected accounts')) {
          toast.error('An OpenRouter API key is required for image generation.');
          handleConnectOpenRouter();
        }
        throw new Error(data.error || `Image generation failed (${res.status})`);
      }

      const { imageUrl } = (await res.json()) as { imageUrl: string };

      // Patch the assistant message's image to done state.
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== assistantMsg.id || !m.images?.length) return m;
          return {
            ...m,
            images: [{ ...m.images[0], url: imageUrl, status: 'done' }],
          };
        })
      );
    } catch (err: any) {
      const msg = err?.message || 'Image generation failed. Try again.';
      toast.error(msg);
      // Patch the image to error state so the user can retry.
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== assistantMsg.id || !m.images?.length) return m;
          return {
            ...m,
            images: [{ ...m.images[0], status: 'error' }],
            content: msg,
          };
        })
      );
    } finally {
      setIsStreaming(false);
    }
  };

  /** Re-run image generation for an existing assistant message's image. */
  const handleRegenerateImage = async (messageId: string, imageId: string, prompt: string) => {
    if (isStreaming) return;

    // Set the image back to generating state.
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId || !m.images) return m;
        return {
          ...m,
          images: m.images.map((img) =>
            img.id === imageId ? { ...img, url: '', status: 'generating' as const } : img
          ),
        };
      })
    );
    setIsStreaming(true);

    const userApiKey = typeof window !== 'undefined'
      ? localStorage.getItem('user_openrouter_key') ||
        (document.cookie.split('; ').find((row) => row.startsWith('user_openrouter_key='))?.split('=')[1] ?? '')
      : '';

    if (!userApiKey) {
      toast.error('Image generation is available only for connected accounts. Connect your OpenRouter key to continue.');
      handleConnectOpenRouter();
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId || !m.images) return m;
          return {
            ...m,
            images: m.images.map((img) =>
              img.id === imageId ? { ...img, status: 'error' as const } : img
            ),
          };
        })
      );
      setIsStreaming(false);
      return;
    }

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userApiKey}`,
        },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 401 || res.status === 403 || data?.code === 'auth_required' || data?.error?.includes('connected accounts')) {
          toast.error('An OpenRouter API key is required for image generation.');
          handleConnectOpenRouter();
        }
        throw new Error(data.error || `Image generation failed (${res.status})`);
      }

      const { imageUrl } = (await res.json()) as { imageUrl: string };

      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId || !m.images) return m;
          return {
            ...m,
            images: m.images.map((img) =>
              img.id === imageId ? { ...img, url: imageUrl, status: 'done' as const } : img
            ),
          };
        })
      );
    } catch (err: any) {
      toast.error(err?.message || 'Regeneration failed. Try again.');
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId || !m.images) return m;
          return {
            ...m,
            images: m.images.map((img) =>
              img.id === imageId ? { ...img, status: 'error' as const } : img
            ),
          };
        })
      );
    } finally {
      setIsStreaming(false);
    }
  };

  // ── Quiz / Study Agent Orchestrator ────────────────────────────────────────

  const QUIZ_INTENTS = /\b(quiz|test|mcq|exam|assess|practice\s*question)/i;

  const handleQuizTrigger = async () => {
    if (quizLoading || isStreaming) return;
    setQuizLoading(true);

    try {
      const notebookContext = isStudyMode ? buildNotebookContext(selectedContext.subject) : '';

      const res = await fetch('/api/agents/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: selectedContext.subject,
          unit: selectedContext.unit,
          count: 5,
          difficulty: 'medium',
          notebookContext,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to generate quiz');
      }

      const quiz: MCQQuiz = await res.json();
      setQuizQuiz(quiz);
      setShowQuizModal(true);
    } catch (err: any) {
      toast.error(err.message || 'Could not generate quiz. Please try again.');
    } finally {
      setQuizLoading(false);
    }
  };

  const handleQuizSubmission = (submission: MCQSubmission) => {
    if (!quizQuiz) return;

    // Preserve quiz data for the reinforce flow (survives after quizQuiz is cleared).
    lastQuizRef.current = quizQuiz;

    const report = generateAnalyzerReport(submission, quizQuiz);

    const assistantMsg: ChatMessage = {
      id: `msg-${Date.now()}-quiz-report`,
      role: 'assistant',
      content:
        report.weakAreas.length === 0
          ? `🎉 **Excellent work!** You scored **${report.overallScore}%** on your ${quizQuiz.subject} quiz. No weak areas identified — you have a strong grasp of all topics!`
          : `📋 **Quiz Complete!** You scored **${report.overallScore}%** on your ${quizQuiz.subject} quiz.\n\nI've identified **${report.weakAreas.length} weak area${report.weakAreas.length > 1 ? 's' : ''}** that need your attention. Check the analysis below and click "Reinforce" to get targeted explanations.`,
      mode: 'deep-dive',
      timestamp: new Date().toISOString(),
      subject: selectedContext.subject,
      analyzerReport: report,
    };

    setMessages((prev) => [...prev, assistantMsg]);
    setQuizQuiz(null);
  };

  const handleReinforce = async (weakTopics: string[], submissionData?: MCQSubmission) => {
    const lastQuiz = lastQuizRef.current;

    if (!lastQuiz || !submissionData) {
      // Fallback when submission context is missing
      const prompt = `Please explain these concepts in detail with examples: ${weakTopics.join(', ')}`;
      await handleSend(prompt, undefined, true);
      return;
    }

    // Build a per-question mistake breakdown from the user's actual wrong answers
    const incorrectQuestions = submissionData.answers
      ? Object.entries(submissionData.answers)
          .map(([questionId, selectedOption]) => {
            const q = lastQuiz.questions.find((item) => item.id === questionId);
            if (!q || selectedOption === q.correctAnswer) return null;
            return {
              question: q.question,
              userAnswer: q.options[selectedOption] || 'No answer',
              correctAnswer: q.options[q.correctAnswer],
              explanation: q.explanation,
              topicTag: q.topicTag,
            };
          })
          .filter(Boolean)
      : [];

    if (incorrectQuestions.length === 0) {
      // All correct — just reinforce the weak topic areas
      const prompt = `I did well on the quiz but want to strengthen my understanding of: ${weakTopics.join(', ')}. Please explain each concept in depth with examples and exam tips.`;
      await handleSend(prompt, undefined, true);
      return;
    }

    const mistakeBreakdown = incorrectQuestions
      .map(
        (q, idx) =>
          `${idx + 1}. **Question:** ${q?.question}\n` +
          `   - **My Answer:** ${q?.userAnswer} (Incorrect)\n` +
          `   - **Correct Answer:** ${q?.correctAnswer}\n` +
          `   - **Why:** ${q?.explanation}`
      )
      .join('\n\n');

    const prompt =
      `I took a quiz on **${lastQuiz.subject || 'this topic'}** and scored poorly on the following questions:\n\n` +
      `${mistakeBreakdown}\n\n` +
      `Please do the following:\n` +
      `1. Explain **WHY** my selected answer was incorrect for each question.\n` +
      `2. Break down the core concept behind the correct answer in simple terms.\n` +
      `3. Provide a quick tip or mnemonic so I don't make this mistake again.`;

    await handleSend(prompt, undefined, true);
  };

  const handleSend = async (text?: string, attachmentOverride?: File[] | boolean, _systemAction?: boolean) => {
    // Support legacy call-site: handleSend(prompt, true) where second arg is the flag
    const isSystemAction = _systemAction === true || attachmentOverride === true;
    const actualAttachments = Array.isArray(attachmentOverride) ? attachmentOverride : undefined;
    const content = (text ?? inputValue).trim();
    if (!content || isStreaming) return;

    // Resolve or generate active target chat ID
    const targetChatId =
      sessionIdRef.current && sessionIdRef.current !== 'chat-new'
        ? sessionIdRef.current
        : `chat-${Date.now()}`;
    sessionIdRef.current = targetChatId;

    // Clear main input search bar immediately
    setInputValue('');

    // Quiz intent detection — intercepts before the text/credit path.
    // Bypass for system actions (reinforce, slash commands) to prevent re-triggering.
    if (!isSystemAction && isStudyMode && QUIZ_INTENTS.test(content) && !imageGenMode) {
      // Add the user message then trigger quiz generation
      const userMsg: ChatMessage = {
        id: `msg-${Date.now()}-user`,
        role: 'user',
        content,
        mode,
        timestamp: new Date().toISOString(),
        subject: selectedContext.subject,
      };
      setMessages((prev) => [...prev, userMsg]);
      router.push(`/ai-topper-chat?chatId=${targetChatId}`, { scroll: false });
      await handleQuizTrigger();
      return;
    }

    // /image slash command — extract prompt and route to image generation
    const imageCmdMatch = content.match(/^\/(image|img)\s+(.+)/i);
    if (imageCmdMatch && !isGuest) {
      const imagePrompt = imageCmdMatch[2].trim();
      if (imagePrompt) {
        const userMsg: ChatMessage = {
          id: `msg-${Date.now()}-user`,
          role: 'user',
          content,
          mode,
          timestamp: new Date().toISOString(),
          subject: selectedContext.subject,
        };
        setMessages((prev) => [...prev, userMsg]);
        router.push(`/ai-topper-chat?chatId=${targetChatId}`, { scroll: false });
        await handleImageSend(imagePrompt);
        return;
      }
    }

    // Image Gen Mode intercepts before the text/credit path
    if (imageGenMode && !isGuest) {
      router.push(`/ai-topper-chat?chatId=${targetChatId}`, { scroll: false });
      await handleImageSend(content);
      return;
    }

    // ── Credit gating ──────────────────────────────────────────────────────
    let guestCreditsSent: number | undefined;
    if (isGuest) {
      const remainingBefore = getGuestCredits();
      if (remainingBefore <= 0) {
        // Instead of opening a modal, reply with a default assistant message
        const noCreditsMsg: ChatMessage = {
          id: `msg-${Date.now()}-nocredits`,
          role: 'assistant',
          content: 'Oops! No credits left 😔 Sign up and connect your key to continue using e-Mate AI.',
          mode,
          timestamp: new Date().toISOString(),
          subject: selectedContext.subject,
        };
        const userMsg2: ChatMessage = {
          id: `msg-${Date.now()}-user`,
          role: 'user',
          content,
          mode,
          timestamp: new Date().toISOString(),
          subject: selectedContext.subject,
        };
        setMessages((prev) => [...prev, userMsg2, noCreditsMsg]);
        return;
      }
      guestCreditsSent = remainingBefore;
      // FIX 5: Credit deduction moved to occur ONLY on successful response generation
    }

    const formatTimestamp = () => {
      try {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch (_) {
        const now = new Date();
        return `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
      }
    };

    const userMsg: ChatMessage = {
      id: `msg-${String(msgCounter++).padStart(3, '0')}`,
      role: 'user',
      content,
      mode,
      timestamp: formatTimestamp(),
      subject: selectedContext.subject,
      isGeneralChat: !isStudyMode,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsStreaming(true);

    // Auto-redirect URL route to target prompt/chat session instantly
    router.push(`/ai-topper-chat?chatId=${targetChatId}`, { scroll: false });

    // Smooth scroll to stream viewport
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);

    // Persist to recent chats + transcript only for signed-in users
    if (!isGuest) {
      const existingHistory = typeof window !== 'undefined' ? (JSON.parse(localStorage.getItem('nk-chat-history') || '[]') as any[]) : [];
      const existingItem = existingHistory.find((item) => item.id === targetChatId);
      const sessionTitle = existingItem?.title || (content.length > 60 ? content.slice(0, 57) + '…' : content);

      saveChatSession({
        id: targetChatId,
        title: sessionTitle,
        subject: selectedContext.subject,
        unit: selectedContext.unit,
        mode,
        timestamp: Date.now(),
      });
      saveChatTranscript(targetChatId, newMessages);
    }

    // FIX 5: Track credit deduction so it only occurs once on successful generation
    let creditDeducted = false;
    const deductCreditOnSuccess = () => {
      if (creditDeducted) return;
      creditDeducted = true;
      if (isGuest) {
        const remainingAfter = spendGuestCredit();
        setGuestCreditsState(remainingAfter);
      } else {
        spendAuthCredit();
      }
    };

    try {
      const notebookContext = isStudyMode ? buildNotebookContext(selectedContext.subject) : '';
      // actualAttachments lets the PromptInput pass fresh attachments that haven't
      // flushed to React state yet when handleSend is called synchronously.
      const sendAttachments = actualAttachments ?? attachedFiles;
      const base64Attachments =
        sendAttachments.length > 0 ? await convertFilesToBase64(sendAttachments) : [];
      const finalPayloadMessages = [...newMessages];

      // If we have attachments, modify the last user message to include them
      if (base64Attachments.length > 0) {
        const lastMsg = finalPayloadMessages[finalPayloadMessages.length - 1];
        // Store original string for UI, but payload will have array format
        (lastMsg as any)._attachments = base64Attachments;
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: finalPayloadMessages,
          mode,
          subject: isStudyMode ? selectedContext.subject : undefined,
          unit: isStudyMode ? selectedContext.unit : undefined,
          model: selectedModel,
          notebookContext,
          isGeneralChat: !isStudyMode,
          attachments: base64Attachments,
          credits: guestCreditsSent, // sent for the server-side guest guard
        }),
      });

      // Clear attachments immediately after sending
      setAttachedFiles([]);
      setPreviewUrls([]);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data.error || `Request failed with status ${res.status}`;
        // FIX 3: Do NOT fire toast.error(msg) to avoid duplicate notification surface; render inline in chat only
        throw new Error(msg);
      }

      const assistantMsgId = `msg-${String(msgCounter++).padStart(3, '0')}`;
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          role: 'assistant',
          content: '',
          mode,
          timestamp: formatTimestamp(),
          subject: selectedContext.subject,
          isGeneralChat: !isStudyMode,
        },
      ]);

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body stream available.');

      const decoder = new TextDecoder();
      let accumulatedText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n\n');

        for (let line of lines) {
          line = line.trim();
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '');
            if (dataStr === '[DONE]') continue;
            try {
              // Server sends JSON-encoded string deltas: `data: "…"\n\n`
              const delta = JSON.parse(dataStr);
              if (typeof delta === 'string' && delta.length > 0) {
                // FIX 5: Response generation was successful, now deduct credit
                deductCreditOnSuccess();
                accumulatedText += delta;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId ? { ...m, content: accumulatedText } : m
                  )
                );
              }
            } catch {
              // Malformed chunk — skip silently (no notice injection)
            }
          }
        }
      }

      // Persist the completed transcript (assistant content is final after the
      // stream loop) — signed-in users only; guest chats are ephemeral.
      if (!isGuest) {
        saveChatTranscript(sessionIdRef.current, [
          ...messages,
          userMsg,
          {
            id: assistantMsgId,
            role: 'assistant',
            content: accumulatedText,
            mode,
            timestamp: formatTimestamp(),
            subject: selectedContext.subject,
            isGeneralChat: !isStudyMode,
          },
        ]);
      }

      if (isStudyMode && accumulatedText) {
        appendToNotebook(
          selectedContext.subject,
          `Struggling/Interested in: ${content.slice(0, 150)}${content.length > 150 ? '...' : ''}`,
          'user'
        );
      }
    } catch (err: any) {
      const rawMsg = err.message || 'Failed to connect to server.';

      // FIX 6: If the chat history ALREADY contains an OpenRouter API key error,
      // render a concise, non-disruptive 1-line note instead of repeating full error block.
      const isOpenRouterError = rawMsg.toLowerCase().includes('openrouter');
      const alreadyHasOpenRouterError = messages.some(
        (m) => m.role === 'assistant' && m.content.toLowerCase().includes('openrouter')
      );

      const displayContent =
        isOpenRouterError && alreadyHasOpenRouterError
          ? '⚠️ OpenRouter account connection required to continue.'
          : rawMsg;

      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.role === 'assistant' && last.content === displayContent) {
          return prev;
        }
        return [
          ...prev,
          {
            id: `msg-${String(msgCounter++).padStart(3, '0')}`,
            role: 'assistant',
            content: displayContent,
            mode,
            timestamp: formatTimestamp(),
            subject: selectedContext.subject,
            isGeneralChat: !isStudyMode,
          },
        ];
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const hasMessages = messages.length > 0;
  const greetingLabel = getTimeGreeting();
  const greetingText = greetingLabel;

  return (
    <div
      onDragEnter={handleWindowDragEnter}
      onDragLeave={handleWindowDragLeave}
      onDragOver={handleWindowDragOver}
      onDrop={handleWindowDrop}
      className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative transition-colors duration-500"
      style={{
        background: theme === 'dark' ? '#080809' : '#f9f9fb',
        color: theme === 'dark' ? '#ffffff' : '#000000',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Full-window drop zone overlay when a file is dragged over the chat */}
      {isWindowDragging && !isGuest && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center border-2 border-dashed border-blue-500 bg-blue-50/70 dark:bg-blue-950/50 backdrop-blur-sm pointer-events-none transition-all duration-200 animate-in fade-in">
          <UploadCloud className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-bounce mb-3" />
          <p className="text-base font-semibold text-blue-900 dark:text-blue-100">
            Drop your files here
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
            Images, PDFs, and notes supported
          </p>
        </div>
      )}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap"
      />
      <style>{`
                button { cursor: pointer; }
                button:disabled { cursor: not-allowed; }
                @media (prefers-reduced-motion: reduce){ *,*::before,*::after { animation:none !important; transition:none !important } }
            `}</style>
      {showFeatureModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center px-4 py-6">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowFeatureModal(false)}
          />
          <div
            className="relative w-full max-w-md rounded-3xl border p-6 shadow-2xl"
            style={{
              background: theme === 'dark' ? 'rgba(17,17,17,0.95)' : 'rgba(255,255,255,0.97)',
              borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Extra features
                </p>
                <h3
                  className="mt-2 text-lg font-semibold"
                  style={{ color: theme === 'dark' ? '#ffffff' : '#000000' }}
                >
                  Unlock smarter study tools
                </h3>
                <p className="mt-2 text-sm text-zinc-400">
                  Open quick study helpers without leaving your chat flow.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowFeatureModal(false)}
                className="rounded-full p-2 transition-colors hover:bg-black/5 hover:text-zinc-900 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label="Close features"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 grid gap-3">
              {[
                {
                  title: 'Flashcards',
                  desc: 'Turn any topic into bite-sized revision cards.',
                },
                {
                  title: 'Practice Quiz',
                  desc: 'Generate exam-style questions and instant answers.',
                },
                {
                  title: 'Study Planner',
                  desc: 'Build a focused plan for your next study sprint.',
                },
              ].map((item) => (
                <button
                  key={item.title}
                  type="button"
                  className="rounded-2xl border p-4 text-left transition-colors hover:border-zinc-300 dark:hover:border-zinc-700"
                  style={{
                    background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                    borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                  }}
                >
                  <p
                    className="text-sm font-semibold"
                    style={{ color: theme === 'dark' ? '#ffffff' : '#000000' }}
                  >
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm text-zinc-400">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top bar — sticky header scoped inside <main>, not full-viewport */}
      <header
        className="sticky top-0 z-40 w-full flex items-center justify-between px-8 py-4 gap-4"
        style={{
          background: theme === 'dark' ? 'rgba(8,8,9,0.7)' : 'rgba(249,249,251,0.7)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom:
            theme === 'dark'
              ? '1px solid rgba(255,255,255,0.06)'
              : '1px solid rgba(31,81,255,0.06)',
        }}
      >
        {/* Left Group: Toggle + Mode Switcher compact segmented pill */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const current = localStorage.getItem('nk-sidebar-open') === 'true';
              const next = !current;
              localStorage.setItem('nk-sidebar-open', String(next));
              window.dispatchEvent(new Event('nk-sidebar-change'));
            }}
            className="p-2 rounded-xl border hover:bg-gray-500/10 dark:hover:bg-zinc-800/80 transition-all cursor-pointer flex items-center justify-center"
            style={{
              borderColor: theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
              background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              color: theme === 'dark' ? '#ffffff' : '#000000',
            }}
            title={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            <Menu size={18} />
          </button>

          <div className="inline-flex p-1 rounded-full bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md border border-gray-200/60 dark:border-zinc-700/60 items-center gap-0.5 shadow-sm">
            <button
              onClick={() => setIsStudyMode(true)}
              aria-pressed={isStudyMode}
              className={`flex items-center gap-1.5 transition-all rounded-full px-3.5 py-1.5 text-xs ${
                isStudyMode
                  ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-100 font-semibold shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                  : 'text-gray-500 hover:text-gray-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <GraduationCap
                size={13}
                className={
                  isStudyMode
                    ? 'text-gray-900 dark:text-zinc-100'
                    : 'text-zinc-400 dark:text-zinc-500'
                }
              />
              Study
            </button>
            <button
              onClick={() => setIsStudyMode(false)}
              aria-pressed={!isStudyMode}
              className={`flex items-center gap-1.5 transition-all rounded-full px-3.5 py-1.5 text-xs ${
                !isStudyMode
                  ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-100 font-semibold shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                  : 'text-gray-500 hover:text-gray-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <MessageSquare
                size={13}
                className={
                  !isStudyMode
                    ? 'text-gray-900 dark:text-zinc-100'
                    : 'text-zinc-400 dark:text-zinc-500'
                }
              />
              General
            </button>
          </div>
        </div>

        {/* Right Group: credit badge for guests, Connected status for auth */}
        <div className="ml-auto flex items-center gap-2">
          {isGuest && (
            <div
              className="h-8 flex items-center gap-1.5 select-none text-[11px] font-medium px-3 rounded-full border"
              style={{
                background:
                  guestCredits <= 0
                    ? theme === 'dark'
                      ? 'rgba(239,68,68,0.12)'
                      : 'rgba(239,68,68,0.08)'
                    : theme === 'dark'
                      ? 'rgba(255,255,255,0.05)'
                      : 'rgba(0,0,0,0.04)',
                borderColor:
                  guestCredits <= 0
                    ? theme === 'dark'
                      ? 'rgba(239,68,68,0.25)'
                      : 'rgba(239,68,68,0.2)'
                    : theme === 'dark'
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(0,0,0,0.08)',
                color:
                  guestCredits <= 0
                    ? theme === 'dark'
                      ? '#fca5a5'
                      : '#dc2626'
                    : theme === 'dark'
                      ? '#a1a1aa'
                      : '#52525b',
              }}
            >
              <Zap size={11} />
              Free Credits: {guestCredits}/{GUEST_LIMIT}
            </div>
          )}
          {isOpenRouterConnected ? (
            <Link
              href="/upgrade"
              className="h-8 flex items-center gap-1.5 px-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold shadow-xs transition-all"
            >
              <span>Upgrade</span>
              <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full font-normal">
                Pro
              </span>
            </Link>
          ) : isSupabaseSignedUp ? (
            <button
              onClick={handleOpenRouterConnect}
              className="h-8 flex items-center gap-1 px-3 rounded-full bg-[#1f51ff] dark:bg-[#8aa2ff] text-white dark:text-[#0b0b0d] text-[11px] font-medium hover:opacity-90 transition-opacity shadow-sm"
            >
              <Key size={11} />
              Connect
            </button>
          ) : null}
        </div>
      </header>

      {/* Glassmorphic Connect Modal / Paywall Modal */}
      {showConnectModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
          onClick={() => setShowConnectModal(false)}
        >
          <div
            className="relative w-full max-w-sm mx-4 rounded-2xl p-6 flex flex-col items-center text-center gap-4"
            style={{
              background: theme === 'dark' ? 'rgba(24, 24, 27, 0.92)' : 'rgba(255, 255, 255, 0.95)',
              border:
                theme === 'dark'
                  ? '1px solid rgba(255,255,255,0.08)'
                  : '1px solid rgba(0,0,0,0.08)',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowConnectModal(false)}
              className="absolute top-3 right-3 p-1 rounded-lg transition-colors"
              style={{ color: theme === 'dark' ? '#71717a' : '#a1a1aa' }}
            >
              <X size={16} />
            </button>

            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{
                background: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              }}
            >
              {isGuestOutOfCredits ? (
                <Lock size={22} style={{ color: theme === 'dark' ? '#a1a1aa' : '#52525b' }} />
              ) : (
                <Key size={22} style={{ color: theme === 'dark' ? '#a1a1aa' : '#52525b' }} />
              )}
            </div>

            <div>
              <h3
                className="text-base font-semibold mb-1"
                style={{ color: theme === 'dark' ? '#fafafa' : '#09090b' }}
              >
                {isGuestOutOfCredits
                  ? "You've reached your 20 free searches"
                  : 'Connect Your API Key'}
              </h3>
              <p
                className="text-xs leading-relaxed"
                style={{ color: theme === 'dark' ? '#71717a' : '#a1a1aa' }}
              >
                {isGuestOutOfCredits
                  ? 'Connect your OpenRouter account to unlock unlimited access. It takes one click and is completely free.'
                  : 'Link your OpenRouter account to unlock AI processing. It takes one click and is completely free.'}
              </p>
            </div>

            {isGuestOutOfCredits ? (
              <>
                <button
                  onClick={() => router.push('/sign-up-login-screen')}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{
                    background: theme === 'dark' ? '#8aa2ff' : '#1f51ff',
                    color: theme === 'dark' ? '#0b0b0d' : '#ffffff',
                  }}
                >
                  <Sparkles size={14} />
                  Sign up / Log in — keep chatting
                </button>
                <button
                  onClick={handleOpenRouterConnect}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{
                    background: 'transparent',
                    border:
                      theme === 'dark'
                        ? '1px solid rgba(255,255,255,0.12)'
                        : '1px solid rgba(0,0,0,0.12)',
                    color: theme === 'dark' ? '#d4d4d8' : '#18181b',
                  }}
                >
                  <Key size={14} />
                  Connect OpenRouter instead
                </button>
              </>
            ) : (
              <button
                onClick={handleOpenRouterConnect}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
                style={{
                  background: theme === 'dark' ? '#8aa2ff' : '#1f51ff',
                  color: theme === 'dark' ? '#0b0b0d' : '#ffffff',
                }}
              >
                <Key size={14} />
                Connect OpenRouter (1-Click)
              </button>
            )}

            <button
              onClick={() => setShowConnectModal(false)}
              className="text-[11px] font-medium transition-colors"
              style={{ color: theme === 'dark' ? '#52525b' : '#a1a1aa' }}
            >
              Maybe later
            </button>
          </div>
        </div>
      )}

      {/* Linking OpenRouter — Glassmorphic Connecting Modal */}
      {isConnectingOpenRouter && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <style
            dangerouslySetInnerHTML={{
              __html: `
                        @keyframes or-pulse-ring {
                            0% { transform: scale(0.85); opacity: 0.6; }
                            50% { transform: scale(1.15); opacity: 0.2; }
                            100% { transform: scale(0.85); opacity: 0.6; }
                        }
                        @keyframes or-icon-float {
                            0%, 100% { transform: translateY(0); }
                            50% { transform: translateY(-4px); }
                        }
                        @keyframes or-dots {
                            0%, 80%, 100% { opacity: 0.2; }
                            40% { opacity: 1; }
                        }
                    `,
            }}
          />
          <div
            className="relative w-full max-w-sm mx-4 rounded-3xl p-8 flex flex-col items-center text-center gap-5"
            style={{
              background: theme === 'dark' ? 'rgba(14, 14, 16, 0.92)' : 'rgba(255, 255, 255, 0.95)',
              border:
                theme === 'dark'
                  ? '1px solid rgba(255,255,255,0.08)'
                  : '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 32px 64px -12px rgba(0,0,0,0.6)',
            }}
          >
            {/* Animated pulsing icon area */}
            <div className="relative w-20 h-20 flex items-center justify-center">
              {/* Pulse rings */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  border:
                    theme === 'dark'
                      ? '2px solid rgba(255, 255, 255, 0.18)'
                      : '2px solid rgba(0, 0, 0, 0.14)',
                  animation: 'or-pulse-ring 2s ease-in-out infinite',
                }}
              />
              <div
                className="absolute rounded-full"
                style={{
                  inset: '-8px',
                  border:
                    theme === 'dark'
                      ? '1px solid rgba(255, 255, 255, 0.10)'
                      : '1px solid rgba(0, 0, 0, 0.08)',
                  animation: 'or-pulse-ring 2s ease-in-out 0.5s infinite',
                }}
              />
              {/* Icon container */}
              <div
                className="relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background:
                    theme === 'dark'
                      ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02))'
                      : 'linear-gradient(135deg, rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.02))',
                  border:
                    theme === 'dark'
                      ? '1px solid rgba(255, 255, 255, 0.12)'
                      : '1px solid rgba(0, 0, 0, 0.10)',
                  animation: 'or-icon-float 3s ease-in-out infinite',
                }}
              >
                <Sparkles size={24} style={{ color: theme === 'dark' ? '#e4e4e7' : '#52525b' }} />
              </div>
            </div>

            {/* Text */}
            <div>
              <h3
                className="text-lg font-bold tracking-tight mb-1.5"
                style={{ color: theme === 'dark' ? '#fafafa' : '#09090b' }}
              >
                Linking OpenRouter Account
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: theme === 'dark' ? '#71717a' : '#a1a1aa' }}
              >
                Please complete authorization in the popup window
                <span style={{ animation: 'or-dots 1.4s infinite 0s', display: 'inline-block' }}>
                  .
                </span>
                <span style={{ animation: 'or-dots 1.4s infinite 0.2s', display: 'inline-block' }}>
                  .
                </span>
                <span style={{ animation: 'or-dots 1.4s infinite 0.4s', display: 'inline-block' }}>
                  .
                </span>
              </p>
            </div>

            {/* Cancel button */}
            <button
              onClick={() => {
                if (popupRef.current && !popupRef.current.closed) {
                  popupRef.current.close();
                }
                popupRef.current = null;
                setIsConnectingOpenRouter(false);
              }}
              className="px-5 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80 active:scale-[0.97]"
              style={{
                background: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                border:
                  theme === 'dark'
                    ? '1px solid rgba(255,255,255,0.1)'
                    : '1px solid rgba(0,0,0,0.08)',
                color: theme === 'dark' ? '#a1a1aa' : '#52525b',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Connection Toast — bottom-right removable */}
      {showToast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-2.5 bg-card/95 backdrop-blur-md text-text-primary rounded-xl shadow-xl border border-border animate-in fade-in slide-in-from-bottom-3 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Connected to OpenRouter</span>
          <button onClick={() => setShowToast(false)} className="ml-2 text-text-muted hover:text-text-primary">
            ✕
          </button>
        </div>
      )}

      {/* Messages area — no pt-20 needed since header is no longer absolute */}
      <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
        {!hasMessages ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-6 max-w-4xl mx-auto w-full h-full">
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setInputValue((prev) => `${prev} Attached: ${e.target.files![0].name} `);
                  setTimeout(() => centerInputRef.current?.focus(), 50);
                }
              }}
            />

            {/* Notebook Hero Header when a notebook is active */}
            {selectedContext.subject ? (
              <div className="flex flex-col items-center text-center mb-6 w-full max-w-xl mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-700 dark:text-amber-300 text-2xl mb-3 shadow-xs">
                  📔
                </div>
                <div className="flex items-center justify-between w-full mb-4 px-2">
                  <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 capitalize">
                    {selectedContext.subject}
                  </h1>
                  <button
                    type="button"
                    onClick={() => {
                      const evt = new CustomEvent('nk-open-sources-modal', { detail: { subject: selectedContext.subject } });
                      window.dispatchEvent(evt);
                    }}
                    className="px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-100/80 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5"
                  >
                    <span>Add sources</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Basic Chat Screen Heading & Subheading */
              <div className="text-center mb-6 max-w-xl mx-auto">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 text-center mb-2">
                  What are you studying today?
                </h1>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 text-center max-w-md mx-auto leading-relaxed">
                  Ask questions, analyze study notes, debug code, or create visual diagrams.
                </p>
              </div>
            )}

            {/* Elevated Command Input — PromptInput composer */}
            <PromptInput
              value={inputValue}
              onChange={setInputValue}
              onSubmit={(text, meta) => {
                // Map the display name back to a real model id for the API
                const model = MODELS.find((m) => m.name === meta.model);
                if (model) setSelectedModel(model.id);
                if (meta.attachments.length) {
                  setAttachedFiles(meta.attachments);
                  setPreviewUrls(meta.attachments.map((f) => URL.createObjectURL(f)));
                }
                handleSend(text, meta.attachments);
              }}
              models={isGuest ? ['Gemini 2.0 Flash'] : MODELS.map((m) => m.name)}
              efforts={['Quick', 'Balanced', 'Deep']}
              allowAttachments={!isGuest}
              placeholder="Ask e-Mate a question, paste notes, or type / for commands..."
              className="mx-auto w-full max-w-2xl mb-4"
              imageGenMode={imageGenMode}
              onImageGenToggle={!isGuest ? () => setImageGenMode((v) => !v) : undefined}
            />

            {/* Quick Action Chips Grid — grid-cols-2 on mobile, flex-wrap on desktop */}
            {isGuest ? (
              <div className="w-full max-w-2xl grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    loadDemoNotebook(selectedContext.subject);
                    toast.success('Demo notebook loaded');
                  }}
                  className="w-full sm:w-auto px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors flex items-center justify-center sm:justify-start gap-2 shadow-2xs"
                >
                  <NotebookText size={14} strokeWidth={1.75} className="text-zinc-400 shrink-0" />
                  <span>Try Demo Notebook</span>
                </button>
                {GUEST_QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => {
                      if (action.prompt) {
                        setInputValue(action.prompt);
                        setTimeout(() => centerInputRef.current?.focus(), 50);
                      }
                    }}
                    className="w-full sm:w-auto px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors flex items-center justify-center sm:justify-start gap-2 shadow-2xs"
                  >
                    <action.icon size={14} strokeWidth={1.75} className="text-zinc-400 shrink-0" />
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="w-full max-w-2xl grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-2">
                {(selectedContext.subject ? studyQuickActions : GENERAL_QUICK_ACTIONS).map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => {
                      if (action.prompt) {
                        setInputValue(action.prompt);
                        setTimeout(() => centerInputRef.current?.focus(), 50);
                      }
                    }}
                    className="w-full sm:w-auto px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors flex items-center justify-center sm:justify-start gap-2 shadow-2xs"
                  >
                    <action.icon size={14} strokeWidth={1.75} className="text-zinc-400 shrink-0" />
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto w-full px-4 py-6 space-y-6">
            {messages.map((msg) => (
              <ChatMessageBubble
                key={msg.id}
                message={msg}
                theme={theme}
                onRegenerateImage={handleRegenerateImage}
                onReinforce={handleReinforce}
              />
            ))}
            {isStreaming && <StreamingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input bar — shown at bottom only when conversation is active */}
      {hasMessages && (
        <div
          className="sticky bottom-0 w-full max-w-3xl mx-auto z-10 px-4 pb-4"
          style={{
            background: theme === 'dark' ? 'rgba(8,8,9,0.7)' : 'rgba(249,249,251,0.7)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            borderTop:
              theme === 'dark'
                ? '1px solid rgba(255,255,255,0.06)'
                : '1px solid rgba(31,81,255,0.06)',
          }}
        >
          <PromptInput
            onSubmit={(text, meta) => {
              // Map the display name back to a real model id for the API
              const model = MODELS.find((m) => m.name === meta.model);
              if (model) setSelectedModel(model.id);
              // Pass attachments explicitly so /api/chat gets them even before
              // the state update flushes; also sync hero/state preview.
              if (meta.attachments.length) {
                setAttachedFiles(meta.attachments);
                setPreviewUrls(meta.attachments.map((f) => URL.createObjectURL(f)));
              }
              handleSend(text, meta.attachments);
            }}
            models={isGuest ? ['Gemini 2.0 Flash'] : MODELS.map((m) => m.name)}
            efforts={['Quick', 'Balanced', 'Deep']}
            allowAttachments={!isGuest}
            placeholder={
              !isStudyMode
                ? 'Ask e-Mate a question, debug code, or request help...'
                : mode === 'sprint'
                  ? 'Ask for a rapid summary, formula, or exam cram tip...'
                  : 'Ask for a step-by-step explanation, proof, or derivation...'
            }
            className="mx-auto w-full max-w-3xl mt-3"
            imageGenMode={imageGenMode}
            onImageGenToggle={!isGuest ? () => setImageGenMode((v) => !v) : undefined}
          />
          <p
            className="text-[11px] text-center mt-2 text-text-muted"
          >
            e-Mate is an AI study copilot. Verify critical academic formulas and exam dates.
          </p>
        </div>
      )}

      {/* Quiz Loading Overlay */}
      {quizLoading && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-6 py-5 shadow-xl flex items-center gap-3 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-5 h-5 border-2 border-[#1f51ff] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Generating your quiz…
            </span>
          </div>
        </div>
      )}

      {/* MCQ Assessment Modal */}
      <MCQAssessmentContainer
        open={showQuizModal && !!quizQuiz}
        onClose={() => {
          setShowQuizModal(false);
          setQuizQuiz(null);
        }}
        quiz={quizQuiz}
        onSubmit={handleQuizSubmission}
      />

    </div>
  );
}
