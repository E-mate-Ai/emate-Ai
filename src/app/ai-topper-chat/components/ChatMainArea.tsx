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
  Gift,
  Paperclip,
  Trash2,
  ExternalLink,
  File,
} from 'lucide-react';
import ChatMessageBubble from './ChatMessageBubble';
import StreamingIndicator from './StreamingIndicator';
import { PromptInput } from '@/components/ui/ai-chat-input';
import type { ChatMessage, SelectedContext, StudyMode } from './AITopperChatScreen';
import { applyTheme } from '@/lib/theme';
import { ModelSelector } from '@/components/ModelSelector';
import {
  buildNotebookContext,
  appendToNotebook,
  addSubject,
  getSubjects,
  getNotebook,
  saveNotebook,
  type Subject,
} from '@/lib/notebook';
import { formatFileSize, type SourceItem } from '@/components/AddSourcesModal';
import {
  saveChatSession,
  saveChatTranscript,
  getChatHistory,
  getChatTranscript,
  formatChatTime,
  type ChatHistoryItem,
} from '@/lib/chatHistory';
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
  const [notebookSessions, setNotebookSessions] = useState<ChatHistoryItem[]>([]);
  const [notebookSources, setNotebookSources] = useState<SourceItem[]>([]);
  const [showSourcesDrawer, setShowSourcesDrawer] = useState(false);
  const popupRef = useRef<Window | null>(null);

  // Keep notebook chat history in sync for the active subject
  useEffect(() => {
    const syncNotebookSessions = () => {
      if (!selectedContext.subject) {
        setNotebookSessions([]);
        return;
      }
      const allHistory = getChatHistory();
      const filtered = allHistory.filter(
        (item) => item.subject && item.subject.toLowerCase() === selectedContext.subject.toLowerCase()
      );
      setNotebookSessions(filtered);
    };
    syncNotebookSessions();
    window.addEventListener('nk-chat-history-change', syncNotebookSessions);
    return () => window.removeEventListener('nk-chat-history-change', syncNotebookSessions);
  }, [selectedContext.subject]);

  // Keep notebook sources in sync for the active subject
  useEffect(() => {
    const syncNotebookSources = () => {
      if (!selectedContext.subject) {
        setNotebookSources([]);
        return;
      }
      const nb = getNotebook(selectedContext.subject);
      const existing: SourceItem[] = (nb.entries || [])
        .filter((e) => e.type)
        .map((e) => {
          const displayTitle = e.title || (e.content && !e.content.startsWith('http') ? e.content.slice(0, 35) : 'Untitled Source');
          return {
            id: e.id,
            title: displayTitle,
            name: displayTitle,
            type: e.type || 'file',
            content: e.content,
            url: e.url,
            size: e.size,
            timestamp: e.timestamp,
            status: 'indexed' as const,
          };
        });
      setNotebookSources(existing);
    };
    syncNotebookSources();
    window.addEventListener('nk-sources-updated', syncNotebookSources);
    window.addEventListener('nk-notebook-change', syncNotebookSources);
    window.addEventListener('nk-context-change', syncNotebookSources);
    return () => {
      window.removeEventListener('nk-sources-updated', syncNotebookSources);
      window.removeEventListener('nk-notebook-change', syncNotebookSources);
      window.removeEventListener('nk-context-change', syncNotebookSources);
    };
  }, [selectedContext.subject]);

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

  const handleRemoveSource = (titleOrId: string) => {
    if (!selectedContext.subject) return;
    const current = getNotebook(selectedContext.subject);
    const updatedEntries = current.entries.filter(
      (e) => e.title !== titleOrId && e.id !== titleOrId
    );
    saveNotebook(selectedContext.subject, { ...current, entries: updatedEntries });
    setNotebookSources(
      updatedEntries.map((e) => {
        const displayTitle = e.title || (e.content && !e.content.startsWith('http') ? e.content.slice(0, 35) : 'Untitled Source');
        return {
          id: e.id,
          title: displayTitle,
          name: displayTitle,
          type: e.type || 'file',
          content: e.content,
          url: e.url,
          size: e.size,
          timestamp: e.timestamp,
          status: 'indexed' as const,
        };
      })
    );
    window.dispatchEvent(new CustomEvent('nk-sources-updated', { detail: { subject: selectedContext.subject } }));
  };

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

  // Invite hover pop-up card state
  const [showInviteHover, setShowInviteHover] = useState(false);
  const inviteTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleInviteMouseEnter = () => {
    if (inviteTimerRef.current) clearTimeout(inviteTimerRef.current);
    setShowInviteHover(true);
  };

  const handleInviteMouseLeave = () => {
    inviteTimerRef.current = setTimeout(() => {
      setShowInviteHover(false);
    }, 200);
  };

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
    const resolveMimeType = (file: File) => {
      if (file.type && file.type.trim().length > 0) return file.type;
      const ext = file.name.toLowerCase().split('.').pop() || '';
      if (ext === 'png') return 'image/png';
      if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
      if (ext === 'webp') return 'image/webp';
      if (ext === 'gif') return 'image/gif';
      if (ext === 'svg') return 'image/svg+xml';
      if (ext === 'pdf') return 'application/pdf';
      if (ext === 'txt') return 'text/plain';
      if (ext === 'md') return 'text/markdown';
      if (ext === 'json') return 'application/json';
      return 'application/octet-stream';
    };

    return Promise.all(
      files.map((file) => {
        return new Promise<{ data: string; mimeType: string; text?: string; fileName?: string }>(
          (resolve, reject) => {
            const detectedMime = resolveMimeType(file);
            const isTextFile =
              detectedMime.startsWith('text/') ||
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
                resolve({ data: '', mimeType: detectedMime, text: textContent, fileName: file.name });
              };
              reader.onerror = reject;
              reader.readAsText(file);
            } else {
              const reader = new FileReader();
              reader.onload = () => {
                const result = reader.result as string;
                const base64Data = result.includes(',') ? result.split(',')[1] : result;
                resolve({ data: base64Data, mimeType: detectedMime, fileName: file.name });
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

    // Persist session metadata and transcript
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

    const assistantMsgId = `msg-${String(msgCounter++).padStart(3, '0')}`;

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

      let initialCitations: import('@/lib/prompts').Citation[] = [];
      const citationsHeader = res.headers.get('X-Citations');
      if (citationsHeader) {
        try {
          initialCitations = JSON.parse(decodeURIComponent(citationsHeader));
        } catch {
          // Ignore header parse error
        }
      }

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
          citations: initialCitations.length > 0 ? initialCitations : undefined,
        },
      ]);

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body stream available.');

      const decoder = new TextDecoder();
      let accumulatedText = '';
      let activeCitations = initialCitations;
      let sseBuffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });
        const lines = sseBuffer.split('\n\n');
        sseBuffer = lines.pop() ?? '';

        for (let line of lines) {
          line = line.trim();
          if (line.startsWith('data: ')) {
            const dataStr = line.replace(/^data:\s*/, '');
            if (dataStr === '[DONE]') continue;
            try {
              // Server sends JSON-encoded string deltas or citation events
              const parsed = JSON.parse(dataStr);
              if (parsed && typeof parsed === 'object') {
                if (parsed.type === 'citations' && Array.isArray(parsed.citations)) {
                  activeCitations = parsed.citations;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsgId ? { ...m, citations: activeCitations } : m
                    )
                  );
                } else if (parsed.error) {
                  throw new Error(parsed.error);
                }
              } else if (typeof parsed === 'string' && parsed.length > 0) {
                // Response generation was successful, now deduct credit
                deductCreditOnSuccess();
                accumulatedText += parsed;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId ? { ...m, content: accumulatedText } : m
                  )
                );
              }
            } catch (err: any) {
              // If it was an explicit server error JSON, rethrow to trigger catch block
              if (err?.message && !err.message.includes('JSON')) {
                throw err;
              }
            }
          }
        }
      }

      // Flush any remaining buffer content
      if (sseBuffer.trim() && sseBuffer.trim() !== 'data: [DONE]' && sseBuffer.startsWith('data: ')) {
        try {
          const dataStr = sseBuffer.replace(/^data:\s*/, '');
          const parsed = JSON.parse(dataStr);
          if (typeof parsed === 'string' && parsed.length > 0) {
            accumulatedText += parsed;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId ? { ...m, content: accumulatedText } : m
              )
            );
          }
        } catch {
          /* ignore */
        }
      }

      // Persist the completed transcript
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
          citations: activeCitations.length > 0 ? activeCitations : undefined,
        },
      ]);

      if (selectedContext.subject && accumulatedText) {
        appendToNotebook(
          selectedContext.subject,
          `Q: ${content.slice(0, 200)}${content.length > 200 ? '...' : ''}\nA: ${accumulatedText.slice(0, 300)}${accumulatedText.length > 300 ? '...' : ''}`,
          'ai'
        );
      }
    } catch (err: any) {
      const rawMsg = err.message || 'Failed to connect to server.';

      // If the chat history ALREADY contains an OpenRouter API key error,
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
        const existing = prev.find((m) => m.id === assistantMsgId);
        if (existing) {
          if (existing.content.trim().length > 0) {
            // Partial text already rendered: preserve it and append error notice
            return prev.map((m) =>
              m.id === assistantMsgId
                ? {
                    ...m,
                    content: `${m.content}\n\n⚠️ *[Response interrupted: ${displayContent}]*`,
                  }
                : m
            );
          } else {
            // No content yet: display the error message in the bubble
            return prev.map((m) =>
              m.id === assistantMsgId
                ? {
                    ...m,
                    content: displayContent,
                  }
                : m
            );
          }
        }
        return [
          ...prev,
          {
            id: assistantMsgId,
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

      {/* ── Floating Top Overlay Components (no static section dividing the screen) ── */}
      {/* Floating Left: Study / General Switcher Pill */}
      <div className={`absolute top-4 ${!isSidebarOpen ? 'left-16' : 'left-6'} z-30 flex items-center p-1 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800 shadow-md transition-all`}>
        <button
          onClick={() => {
            if (!isStudyMode) {
              setIsStudyMode(true);
              window.dispatchEvent(new Event('nk-new-chat'));
            }
          }}
          aria-pressed={isStudyMode}
          className={`flex items-center gap-1.5 transition-all rounded-full px-3.5 py-1.5 text-xs ${
            isStudyMode
              ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-100 font-semibold shadow-xs ring-1 ring-black/5 dark:ring-white/10'
              : 'text-gray-500 hover:text-gray-800 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          <GraduationCap
            size={13}
            className={isStudyMode ? 'text-gray-900 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-500'}
          />
          Study
        </button>
        <button
          onClick={() => {
            if (isStudyMode) {
              setIsStudyMode(false);
              window.dispatchEvent(new Event('nk-new-chat'));
            }
          }}
          aria-pressed={!isStudyMode}
          className={`flex items-center gap-1.5 transition-all rounded-full px-3.5 py-1.5 text-xs ${
            !isStudyMode
              ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-100 font-semibold shadow-xs ring-1 ring-black/5 dark:ring-white/10'
              : 'text-gray-500 hover:text-gray-800 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          <MessageSquare
            size={13}
            className={!isStudyMode ? 'text-gray-900 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-500'}
          />
          General
        </button>
      </div>

      {/* Floating Right: Sources Pill + Invite Button */}
      <div className="absolute top-4 right-6 z-30 flex items-center gap-2">
        {selectedContext.subject && (
          <button
            type="button"
            onClick={() => setShowSourcesDrawer(true)}
            className="h-9 px-3.5 rounded-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold shadow-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="View sources referenced by AI in this notebook"
          >
            <Paperclip size={13} className="text-zinc-500 dark:text-zinc-400" />
            <span>Sources</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold">
              {notebookSources.length}
            </span>
          </button>
        )}

        <div
          className="relative flex items-center"
          onMouseEnter={handleInviteMouseEnter}
          onMouseLeave={handleInviteMouseLeave}
        >
          <button
            type="button"
            onClick={() => {
              const code = 'KZT1DM';
              navigator.clipboard.writeText(`${window.location.origin}/invite/${code}`);
              toast.success('Referral link copied to clipboard!');
            }}
            className="h-9 px-4 rounded-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm font-semibold shadow-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Gift size={16} className="text-zinc-800 dark:text-zinc-200" />
            <span>Invite</span>
          </button>

          {/* Invite Hover Card Popup */}
          {showInviteHover && (
            <div
              onMouseEnter={handleInviteMouseEnter}
              onMouseLeave={handleInviteMouseLeave}
              className="absolute right-0 top-11 z-50 w-80 sm:w-96 p-6 rounded-[32px] bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xl text-zinc-900 dark:text-white animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <div className="w-full flex justify-center mb-3">
                <img
                  src="/images/3d_blue_gift_box.jpg"
                  alt="Gift Box"
                  className="w-32 h-32 object-contain"
                />
              </div>
              <h4 className="text-lg font-bold text-zinc-900 dark:text-white mb-2 text-left">
                Invite friends
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed text-left mb-4">
                Invite a friend and you'll both get 1 billion Muse tokens when they redeem your code in Settings within 48 hours of joining. 30 uses left.
              </p>
              <div className="w-full py-3 px-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold text-sm text-center tracking-widest mb-3 select-all">
                KZT1DM
              </div>
              <button
                type="button"
                onClick={() => {
                  const code = 'KZT1DM';
                  navigator.clipboard.writeText(`${window.location.origin}/invite/${code}`);
                  toast.success('Referral link copied to clipboard!');
                }}
                className="w-full py-3.5 rounded-full bg-[#0060df] hover:bg-[#0052cc] text-white text-sm font-semibold transition-all shadow-xs cursor-pointer active:scale-95 flex items-center justify-center"
              >
                Copy referral link
              </button>
            </div>
          )}
        </div>
      </div>

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
                <Plus size={22} style={{ color: theme === 'dark' ? '#a1a1aa' : '#52525b' }} />
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
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#0060df] hover:bg-[#0052cc] text-white text-xs sm:text-sm font-medium transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <Sparkles size={14} />
                  Sign up / Log in — keep chatting
                </button>
                <button
                  onClick={handleOpenRouterConnect}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm font-medium transition-all cursor-pointer active:scale-95"
                >
                  <Plus size={14} />
                  Connect OpenRouter instead
                </button>
              </>
            ) : (
              <button
                onClick={handleOpenRouterConnect}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#0060df] hover:bg-[#0052cc] text-white text-xs sm:text-sm font-medium transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <Plus size={14} />
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
              <div className="flex flex-col items-start w-full max-w-2xl mx-auto mb-6 px-2">
                <div className="text-3xl mb-2 flex items-center justify-center">
                  📔
                </div>
                <div className="flex items-center justify-between w-full">
                  <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 capitalize">
                    {selectedContext.subject}
                  </h1>
                  <button
                    type="button"
                    onClick={() => {
                      const evt = new CustomEvent('nk-open-sources-modal', { detail: { subject: selectedContext.subject } });
                      window.dispatchEvent(evt);
                    }}
                    className="px-4 py-2 rounded-full border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-100/90 dark:bg-zinc-800/90 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold transition-all cursor-pointer shadow-2xs active:scale-95 flex items-center gap-1.5"
                  >
                    <span>Add sources</span>
                  </button>
                </div>

                {/* Notebook Sources Section in Empty View */}
                {notebookSources.length > 0 ? (
                  <div className="w-full mt-4 mb-1 p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider">
                        <Paperclip size={13} className="text-zinc-400" />
                        <span>Notebook Sources ({notebookSources.length})</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const evt = new CustomEvent('nk-open-sources-modal', { detail: { subject: selectedContext.subject } });
                          window.dispatchEvent(evt);
                        }}
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <Plus size={12} />
                        Add more
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                      {notebookSources.map((source, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm text-xs group hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-2xs"
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 shrink-0 border border-zinc-200/60 dark:border-zinc-700/60">
                              {source.type.toUpperCase()}
                            </span>
                            <span className="truncate font-medium text-zinc-800 dark:text-zinc-200" title={source.title || source.name}>
                              {source.title || source.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {formatFileSize(source.size) && (
                              <span className="text-[10px] text-zinc-400 font-mono">
                                {formatFileSize(source.size)}
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Indexed
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSource(source.id || source.title || source.name || '')}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/40 text-zinc-400 hover:text-red-500 transition-all"
                              title="Remove source"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="w-full mt-4 mb-1 p-3 rounded-2xl border border-dashed border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/20 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                        <File size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">No sources added yet</p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Add PDF, Doc, or Web links to ground responses in this notebook.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const evt = new CustomEvent('nk-open-sources-modal', { detail: { subject: selectedContext.subject } });
                        window.dispatchEvent(evt);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90 transition-all shadow-xs"
                    >
                      Add source
                    </button>
                  </div>
                )}
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

            {/* Below PromptInput: Render Notebook Chat History when in notebook mode; render GENERAL_QUICK_ACTIONS when in standard chat mode */}
            {selectedContext.subject ? (
              /* Notebook Chat History Section — Left Aligned, Faded list on lower side */
              <div className="w-full max-w-2xl mt-4 px-1 text-left">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                    <MessageSquare size={13} strokeWidth={2} />
                    <span>Chat history</span>
                  </h3>
                </div>

                {notebookSessions.length === 0 ? (
                  <div className="p-3.5 rounded-2xl border border-dashed border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30">
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 leading-relaxed">
                      No chat history in this notebook yet. Chats you start here will be stored in <span className="font-semibold text-zinc-600 dark:text-zinc-300">{selectedContext.subject}</span>.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {notebookSessions.map((session) => (
                      <button
                        key={session.id}
                        type="button"
                        onClick={() => {
                          const transcript = getChatTranscript(session.id);
                          window.dispatchEvent(
                            new CustomEvent('nk-chat-load', {
                              detail: {
                                id: session.id,
                                subject: session.subject,
                                unit: session.unit,
                                mode: session.mode,
                                messages: transcript,
                              },
                            })
                          );
                        }}
                        className="w-full text-left p-3 rounded-2xl bg-zinc-100/60 dark:bg-zinc-900/50 hover:bg-zinc-200/70 dark:hover:bg-zinc-800/70 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-all flex items-center justify-between group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-3">
                          <MessageSquare size={14} className="text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 shrink-0 transition-colors" />
                          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 truncate">
                            {session.title || 'Untitled notebook chat'}
                          </span>
                        </div>
                        <span className="text-[11px] text-zinc-400 dark:text-zinc-500 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
                          {formatChatTime(session.timestamp)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* General Chat Quick Actions (when on basic screen) */
              <div className="w-full max-w-2xl grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-2">
                {GENERAL_QUICK_ACTIONS.map((action) => (
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
          <div className="max-w-3xl mx-auto w-full px-4 py-6 pb-28 space-y-6">
            {messages.map((msg, idx) => (
              <ChatMessageBubble
                key={msg.id}
                message={msg}
                theme={theme}
                onRegenerateImage={handleRegenerateImage}
                onReinforce={handleReinforce}
                isStreaming={isStreaming && idx === messages.length - 1 && msg.role === 'assistant'}
              />
            ))}
            {isStreaming && messages[messages.length - 1]?.role === 'user' && <StreamingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Floating Slim Pill Input Bar — shown at bottom when conversation is active */}
      {hasMessages && (
        <div className="absolute bottom-5 left-0 right-0 z-30 px-4 flex flex-col items-center justify-center pointer-events-none">
          <div className="w-full max-w-2xl pointer-events-auto">
            <PromptInput
              isSlim={true}
              onSubmit={(text, meta) => {
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
              placeholder={
                !isStudyMode
                  ? 'Ask e-Mate a question, debug code, or request help...'
                  : mode === 'sprint'
                    ? 'Ask for a rapid summary, formula, or exam cram tip...'
                    : 'Ask for a step-by-step explanation, proof, or derivation...'
              }
              imageGenMode={imageGenMode}
              onImageGenToggle={!isGuest ? () => setImageGenMode((v) => !v) : undefined}
            />
          </div>
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

      {/* Sources Drawer Slide-over Modal for Active Chat Inspection */}
      {showSourcesDrawer && (
        <div className="fixed inset-0 z-[150] flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setShowSourcesDrawer(false)}
          />
          <div className="relative w-full max-w-md h-full bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300">
                  <Paperclip size={14} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Notebook Sources
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {selectedContext.subject ? `Grounded in ${selectedContext.subject}` : 'Active session sources'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSourcesDrawer(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {notebookSources.length === 0 ? (
                <div className="text-center py-12 px-4 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/20">
                  <Paperclip size={24} className="mx-auto text-zinc-300 dark:text-zinc-600 mb-2" />
                  <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    No sources attached to this notebook
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto mb-4">
                    Add documents, notes, or web links to provide context for your questions.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSourcesDrawer(false);
                      const evt = new CustomEvent('nk-open-sources-modal', { detail: { subject: selectedContext.subject } });
                      window.dispatchEvent(evt);
                    }}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90 transition-all"
                  >
                    + Add first source
                  </button>
                </div>
              ) : (
                notebookSources.map((source, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-start justify-between gap-3 group hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shrink-0">
                          {source.type.toUpperCase()}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Indexed
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate" title={source.title || source.name}>
                        {source.title || source.name}
                      </h4>
                      {source.url && (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-blue-600 dark:text-blue-400 truncate flex items-center gap-1 mt-0.5 hover:underline"
                        >
                          <ExternalLink size={10} />
                          {source.url}
                        </a>
                      )}
                      {formatFileSize(source.size) && (
                        <p className="text-[10px] text-zinc-400 mt-0.5 font-mono">
                          {formatFileSize(source.size)}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSource(source.id || source.title || source.name || '')}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all shrink-0"
                      title="Remove source"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
              <button
                type="button"
                onClick={() => {
                  setShowSourcesDrawer(false);
                  const evt = new CustomEvent('nk-open-sources-modal', { detail: { subject: selectedContext.subject } });
                  window.dispatchEvent(evt);
                }}
                className="w-full py-2 rounded-xl text-xs font-semibold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90 transition-all flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Plus size={14} />
                <span>Add More Sources</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
