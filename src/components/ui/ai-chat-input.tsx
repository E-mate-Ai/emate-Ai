'use client';

import * as React from 'react';
import { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  Mic,
  Wand2,
  Paperclip,
  Folder,
  TerminalSquare,
  LayoutGrid,
  ChevronRight,
  HelpCircle,
  Layers,
  BookOpen,
  Sparkles,
  Zap,
  UploadCloud,
} from 'lucide-react';

// ----------------------------------------------------------------------
// Slash Commands
// ----------------------------------------------------------------------

interface SlashCommand {
  label: string;
  command: string;
  description: string;
  icon: React.ElementType;
}

const SLASH_COMMANDS: SlashCommand[] = [
  { label: 'Generate Visual', command: '/image', description: 'Create study diagrams, flowcharts, or visual notes', icon: Sparkles },
  { label: 'Practice Quiz', command: '/mcq', description: 'Generate interactive multiple-choice questions', icon: HelpCircle },
  { label: 'Concept Flashcards', command: '/flashcard', description: 'Create active recall revision flip cards', icon: Layers },
  { label: 'High-Yield Summary', command: '/summary', description: 'Summarize syllabus concepts and lecture notes', icon: BookOpen },
  { label: 'Sprint Mode', command: '/sprint', description: 'Rapid-fire exam cram and formula sprint', icon: Zap },
];

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------
interface Attachment {
  id: string;
  file: File;
  url: string;
  name: string;
  kind: 'image' | 'doc';
  width?: number;
  height?: number;
}

// ----------------------------------------------------------------------
// Sub-components
// ----------------------------------------------------------------------
function MorphingText({ text }: { text: string }) {
  const [width, setWidth] = useState<number | 'auto'>('auto');
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (spanRef.current) {
      setWidth(spanRef.current.offsetWidth);
    }
  }, [text]);

  return (
    <span
      className="relative inline-flex items-center justify-center overflow-hidden transition-all duration-300 ease-spring-bounce"
      style={{ width }}
    >
      <span ref={spanRef} className="invisible whitespace-nowrap px-1">
        {text}
      </span>
      <span
        key={text}
        className="absolute inset-0 flex items-center justify-center whitespace-nowrap animate-in fade-in zoom-in-95 duration-300"
      >
        {text}
      </span>
    </span>
  );
}

function ModelSparkleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3z"
        fill="currentColor"
      />
      <path
        d="M18 14l.8 1.9 1.9.8-1.9.8L18 19.4l-.8-1.9-1.9-.8 1.9-.8L18 14z"
        fill="currentColor"
      />
    </svg>
  );
}

function ModelIcon({ model, className }: { model: string; className?: string }) {
  const brandIcons: Record<string, string> = {
    'Gemini 2.0 Flash':
      'https://res.cloudinary.com/drhx7imeb/image/upload/v1781695268/google-gemini-icon_l6kk5q.svg',
    'Gemini 2.5 Flash':
      'https://res.cloudinary.com/drhx7imeb/image/upload/v1781695268/google-gemini-icon_l6kk5q.svg',
    'Gemini 2.5 Pro':
      'https://res.cloudinary.com/drhx7imeb/image/upload/v1781695268/google-gemini-icon_l6kk5q.svg',
    'GPT-4o Mini':
      'https://res.cloudinary.com/drhx7imeb/image/upload/v1781695269/openai-icon_zozuib.svg',
    'Claude 3.5 Sonnet':
      'https://res.cloudinary.com/drhx7imeb/image/upload/v1781695268/Claude_AI_symbol_yqfzlc.svg',
  };

  if (brandIcons[model]) {
    return <img src={brandIcons[model]} alt={model} className={cn('object-contain', className)} />;
  }

  return <ModelSparkleIcon />;
}

function ArrowUpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M7 12V2M7 2L2.5 6.5M7 2L11.5 6.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" fill="currentColor" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 2v6h6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8 13h8M8 17h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M2.5 2.5L11.5 11.5M11.5 2.5L2.5 11.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DynamicBarsIcon({ level }: { level: string }) {
  const bars =
    level === 'Deep' || level === 'Max Effort'
      ? 3
      : level === 'Balanced' || level === 'Medium'
        ? 2
        : 1;

  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect
        x="1.5"
        y="8"
        width="2.5"
        height="4.5"
        rx="1"
        fill="currentColor"
        className="transition-opacity duration-300"
        opacity={bars >= 1 ? 1 : 0.3}
      />
      <rect
        x="5.75"
        y="5"
        width="2.5"
        height="7.5"
        rx="1"
        fill="currentColor"
        className="transition-opacity duration-300"
        opacity={bars >= 2 ? 1 : 0.3}
      />
      <rect
        x="10"
        y="2"
        width="2.5"
        height="10.5"
        rx="1"
        fill="currentColor"
        className="transition-opacity duration-300"
        opacity={bars >= 3 ? 1 : 0.3}
      />
    </svg>
  );
}

// ----------------------------------------------------------------------
// Attachment Thumbnail
// ----------------------------------------------------------------------
function AttachmentThumb({
  attachment,
  index,
  onRemove,
  onOpen,
  registerRef,
}: {
  attachment: Attachment;
  index: number;
  onRemove: (id: string) => void;
  onOpen: (attachment: Attachment, rect: DOMRect) => void;
  registerRef: (id: string, el: HTMLButtonElement | null) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  return (
    <button
      ref={(el) => {
        btnRef.current = el;
        registerRef(attachment.id, el);
      }}
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        if (btnRef.current) {
          onOpen(attachment, btnRef.current.getBoundingClientRect());
        }
      }}
      style={{ animationDelay: `${index * 35}ms`, animationFillMode: 'backwards' }}
      className={cn(
        'group relative size-12 shrink-0 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 outline-none',
        'transition-transform duration-200 hover:scale-[1.04] active:scale-[0.96]',
        'animate-in fade-in zoom-in-90 duration-300'
      )}
      aria-label={`Open preview of ${attachment.name}`}
    >
      {attachment.kind === 'doc' ? (
        <span className="flex size-full flex-col items-center justify-center gap-1 p-1 text-zinc-500 dark:text-zinc-400">
          <DocIcon />
          <span className="w-full truncate text-center text-[9px] font-medium leading-tight text-zinc-500 dark:text-zinc-400">
            {attachment.name}
          </span>
        </span>
      ) : (
        <img
          src={attachment.url}
          alt={attachment.name}
          className="size-full object-cover"
          draggable={false}
        />
      )}
      <span
        className={cn(
          'absolute inset-0 flex items-start justify-end bg-black/0 transition-colors duration-200',
          isHovered && 'bg-black/25'
        )}
      >
        <span
          role="button"
          tabIndex={-1}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.stopPropagation();
            onRemove(attachment.id);
          }}
          className={cn(
            'm-1 flex size-4 items-center justify-center rounded-full bg-white/90 dark:bg-zinc-900/90 text-zinc-700 dark:text-zinc-300 shadow-sm transition-all duration-200 hover:scale-110',
            isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'
          )}
          aria-label={`Remove ${attachment.name}`}
        >
          <CloseIcon />
        </span>
      </span>
    </button>
  );
}

// ----------------------------------------------------------------------
// Shared-Element Gallery Modal
// ----------------------------------------------------------------------
function AttachmentGalleryModal({
  attachment,
  originRect,
  onClose,
}: {
  attachment: Attachment;
  originRect: DOMRect;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<'opening' | 'open' | 'closing'>('opening');
  const [targetRect, setTargetRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
    radius: number;
  } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const maxW = Math.min(window.innerWidth * 0.86, 560);
    const maxH = Math.min(window.innerHeight * 0.78, 720);

    const naturalW = attachment.width || 800;
    const naturalH = attachment.height || 600;
    const scale = Math.min(maxW / naturalW, maxH / naturalH, 1.6);

    const width = naturalW * scale;
    const height = naturalH * scale;

    setTargetRect({
      top: (window.innerHeight - height) / 2,
      left: (window.innerWidth - width) / 2,
      width,
      height,
      radius: 20,
    });

    const raf = requestAnimationFrame(() => setPhase('open'));
    return () => cancelAnimationFrame(raf);
  }, [attachment]);

  const handleClose = useCallback(() => setPhase('closing'), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [handleClose]);

  const isOpen = phase === 'open';
  const isClosing = phase === 'closing';

  const geometry =
    isOpen && targetRect
      ? targetRect
      : {
          top: originRect.top,
          left: originRect.left,
          width: originRect.width,
          height: originRect.height,
          radius: 12,
        };

  const animEasing = isClosing ? 'ease-out' : 'cubic-bezier(0.175, 0.885, 0.32, 1.275)';
  const animDur = isClosing ? '0.3s' : '0.45s';
  const flipTransition = `top ${animDur} ${animEasing}, left ${animDur} ${animEasing}, width ${animDur} ${animEasing}, height ${animDur} ${animEasing}, border-radius ${animDur} ${animEasing}`;

  return (
    <div className="fixed inset-0 z-[100]" onClick={handleClose} role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-400"
        style={{ opacity: isOpen ? 1 : 0 }}
      />
      <div
        style={{
          position: 'fixed',
          top: geometry.top,
          left: geometry.left,
          width: geometry.width,
          height: geometry.height,
          borderRadius: geometry.radius,
          transition: flipTransition,
          overflow: 'hidden',
          boxShadow: isOpen
            ? '0 24px 60px -12px rgb(0 0 0 / 0.35)'
            : '0 0px 0px 0px rgb(0 0 0 / 0)',
        }}
        className="bg-zinc-900"
        onTransitionEnd={() => {
          if (phase === 'closing') onClose();
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          ref={imgRef}
          src={attachment.url}
          alt={attachment.name}
          className="size-full object-cover"
          draggable={false}
        />
      </div>

      <button
        type="button"
        onClick={handleClose}
        style={{ opacity: isOpen ? 1 : 0, transform: isOpen ? 'scale(1)' : 'scale(0.7)' }}
        className={cn(
          'fixed right-4 top-4 flex size-9 items-center justify-center rounded-full bg-zinc-800/90 text-zinc-100 shadow-md backdrop-blur-sm',
          'transition-all duration-300 hover:bg-zinc-700',
          !isOpen && 'pointer-events-none'
        )}
      >
        <span className="scale-150">
          <CloseIcon />
        </span>
      </button>
    </div>
  );
}

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------

export interface PromptInputProps {
  onSubmit?: (value: string, meta: { model: string; effort: string; attachments: File[] }) => void;
  placeholder?: string;
  className?: string;
  models?: string[];
  efforts?: string[];
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  maxAttachments?: number;
  /** When false, hides the attach-image button (e.g. for guest users). */
  allowAttachments?: boolean;
  /** When true, the input is in "Image Gen Mode" — subtitle + placeholder swap. */
  imageGenMode?: boolean;
  /** Fired when the user clicks the image-generation toggle. */
  onImageGenToggle?: () => void;
  /** Placeholder shown when imageGenMode is active. */
  imageGenPlaceholder?: string;
}

export const PromptInput = React.forwardRef<HTMLDivElement, PromptInputProps>(
  (
    {
      onSubmit,
      placeholder = 'Ask e-Mate a question, paste notes, or type / for commands...',
      className,
      models = ['Gemini 2.0 Flash', 'Gemini 2.5 Flash', 'GPT-4o Mini', 'Claude 3.5 Sonnet'],
      efforts = ['Quick', 'Balanced', 'Deep'],
      defaultValue = '',
      value: controlledValue,
      onChange,
      maxAttachments = 6,
      allowAttachments = true,
      imageGenMode = false,
      onImageGenToggle,
      imageGenPlaceholder = 'Describe the diagram, chart, or visual you want e-Mate to generate...',
    },
    ref
  ) => {
    const [localValue, setLocalValue] = useState(defaultValue);
    const [selectedModel, setSelectedModel] = useState(models[0]);
    const [effortIndex, setEffortIndex] = useState(0);
    const [isModelSelectOpen, setIsModelSelectOpen] = useState(false);

    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [activeAttachment, setActiveAttachment] = useState<{
      attachment: Attachment;
      rect: DOMRect;
    } | null>(null);

    // Attachment drop-up menu state
    const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
    const attachMenuRef = useRef<HTMLDivElement>(null);

    // Slash command menu state
    const [showSlashMenu, setShowSlashMenu] = useState(false);
    const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
    const [showPluginsFlyout, setShowPluginsFlyout] = useState(false);
    // What the file input should accept (swapped before opening the chooser).
    const uploadKindRef = useRef<'image' | 'doc'>('image');

    // Audio/Voice recording states
    const [isRecording, setIsRecording] = useState(false);
    const [audioData, setAudioData] = useState<number[]>(new Array(5).fill(0));
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const dragCounterRef = useRef(0);

    const isControlled = controlledValue !== undefined;
    const value = isControlled ? controlledValue : localValue;
    const hasValue = value.trim() !== '' || attachments.length > 0;
    const hasAttachments = attachments.length > 0;

    const valueRef = useRef(value);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const modelSelectRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const thumbRefs = useRef<Map<string, HTMLButtonElement | null>>(new Map());

    // Refs for Web Audio & Speech Recognition cleanup
    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const rafRef = useRef<number | null>(null);
    const recognitionRef = useRef<any>(null);
    const demoIntervalRef = useRef<number | null>(null);
    const demoTextIntervalRef = useRef<number | null>(null);

    // Sync value ref for audio callback closure
    useEffect(() => {
      valueRef.current = value;
    }, [value]);

    const handleValueChange = useCallback(
      (val: string) => {
        if (!isControlled) setLocalValue(val);
        onChange?.(val);
        // Detect slash command trigger
        setShowSlashMenu(val.startsWith('/'));
        setSelectedCommandIndex(0);
      },
      [isControlled, onChange]
    );

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      e.target.style.height = 'auto';
      e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
    };

    // Auto-adjust textarea height dynamically based on value changes
    useEffect(() => {
      if (!textareaRef.current) return;
      const el = textareaRef.current;
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }, [value]);

    // Close model select on outside click
    useEffect(() => {
      if (!isModelSelectOpen) return;
      const handleOutsideClick = (e: MouseEvent) => {
        if (modelSelectRef.current && !modelSelectRef.current.contains(e.target as Node)) {
          setIsModelSelectOpen(false);
        }
      };
      document.addEventListener('mousedown', handleOutsideClick);
      return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [isModelSelectOpen]);

    // Close attach menu on outside click or Escape
    useEffect(() => {
      if (!isAttachMenuOpen) return;
      const handleOutsideClick = (e: MouseEvent) => {
        if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) {
          setIsAttachMenuOpen(false);
        }
      };
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsAttachMenuOpen(false);
      };
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('mousedown', handleOutsideClick);
        document.removeEventListener('keydown', handleEscape);
      };
    }, [isAttachMenuOpen]);

    // --- Voice Recording Logic ---
    const stopRecording = useCallback(() => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (demoIntervalRef.current) {
        window.clearInterval(demoIntervalRef.current);
        demoIntervalRef.current = null;
      }
      if (demoTextIntervalRef.current) {
        window.clearInterval(demoTextIntervalRef.current);
        demoTextIntervalRef.current = null;
      }
      setIsRecording(false);
      setAudioData(new Array(5).fill(0));
    }, []);

    const startRecording = useCallback(async () => {
      let stream: MediaStream | null = null;
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
      } catch (err) {
        console.warn(
          'Microphone access denied or unavailable. Falling back to simulated voice mode for demo.'
        );
      }

      setIsRecording(true);

      function simulateText() {
        const fakeText = 'Explain this topic clearly with examples';
        const words = fakeText.split(' ');
        let i = 0;
        let currentBase = valueRef.current;
        demoTextIntervalRef.current = window.setInterval(() => {
          if (i < words.length) {
            currentBase = (currentBase ? currentBase + ' ' : '') + words[i];
            handleValueChange(currentBase);
            i++;
          } else {
            stopRecording();
          }
        }, 300);
      }

      if (stream) {
        streamRef.current = stream;

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateVisualizer = () => {
          analyser.getByteFrequencyData(dataArray);
          const bands = new Array(5).fill(0);
          const step = Math.floor(dataArray.length / 5);
          for (let i = 0; i < 5; i++) {
            let sum = 0;
            for (let j = 0; j < step; j++) {
              sum += dataArray[i * step + j];
            }
            bands[i] = sum / step / 255;
          }
          setAudioData(bands);
          rafRef.current = requestAnimationFrame(updateVisualizer);
        };
        updateVisualizer();

        const SpeechRecognition =
          (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;

          let baseline = valueRef.current;

          recognition.onresult = (event: any) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
              } else {
                interimTranscript += event.results[i][0].transcript;
              }
            }

            if (finalTranscript) {
              baseline += (baseline ? ' ' : '') + finalTranscript;
            }

            handleValueChange(
              (baseline + (interimTranscript ? ' ' + interimTranscript : '')).trim()
            );
          };

          recognition.onerror = (e: any) => {
            console.error('Speech recognition error', e);
            stopRecording();
          };

          recognition.onend = () => {
            stopRecording();
          };

          recognitionRef.current = recognition;
          recognition.start();
        } else {
          simulateText();
        }
      } else {
        demoIntervalRef.current = window.setInterval(() => {
          setAudioData(Array.from({ length: 5 }, () => Math.random() * 0.8 + 0.1));
        }, 100);
        simulateText();
      }
    }, [handleValueChange, stopRecording]);

    // Keep textarea auto-scrolled to bottom while recording
    useEffect(() => {
      if (isRecording && textareaRef.current) {
        textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
      }
    }, [value, isRecording]);

    // Ensure cleanup of mic/streams on unmount
    useEffect(() => {
      return () => {
        stopRecording();
        attachments.forEach((a) => URL.revokeObjectURL(a.url));
      };
    }, [stopRecording, attachments]);

    const handleSubmit = () => {
      if (value.trim() === '' && !hasAttachments) return;
      onSubmit?.(value, {
        model: selectedModel,
        effort: efforts[effortIndex],
        attachments: attachments.map((a) => a.file),
      });
      handleValueChange('');
      attachments.forEach((a) => URL.revokeObjectURL(a.url));
      setAttachments([]);
      setIsModelSelectOpen(false);
      setIsAttachMenuOpen(false);
      setShowSlashMenu(false);
    };

    const handleSelectCommand = (cmd: string) => {
      handleValueChange(`${cmd} `);
      setShowSlashMenu(false);
      textareaRef.current?.focus();
    };

    // Filtered slash commands based on current input
    const filteredCommands = SLASH_COMMANDS.filter((cmd) =>
      cmd.command.toLowerCase().includes(value.toLowerCase())
    );

    const cycleEffort = (e: React.MouseEvent) => {
      e.stopPropagation();
      setEffortIndex((prev) => (prev + 1) % efforts.length);
    };

    const handleFilesChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const kind = uploadKindRef.current;
      const files = Array.from(e.target.files ?? []).filter((f) =>
        kind === 'image' ? f.type.startsWith('image/') : f.type !== ''
      );
      e.target.value = '';

      // For docs, don't try to read image dimensions — show a doc icon instead.
      if (kind === 'doc') {
        const room = Math.max(0, maxAttachments - attachments.length);
        const accepted = files.slice(0, room);
        for (const file of accepted) {
          const url = URL.createObjectURL(file);
          addAttachment(file, url, 0, 0, 'doc');
        }
        return;
      }

      if (files.length === 0) return;
      const room = Math.max(0, maxAttachments - attachments.length);
      const accepted = files.slice(0, room);

      for (const file of accepted) {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => addAttachment(file, url, img.naturalWidth, img.naturalHeight, 'image');
        img.onerror = () => addAttachment(file, url, 800, 600, 'image');
        img.src = url;
      }
    };

    const addAttachment = (
      file: File,
      url: string,
      width: number,
      height: number,
      kind: 'image' | 'doc'
    ) => {
      const id = `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`;
      setAttachments((prev) => [...prev, { id, file, url, name: file.name, width, height, kind }]);
    };

    const processFiles = useCallback(
      (incomingFiles: File[]) => {
        if (!allowAttachments) return;
        const validFiles = incomingFiles.filter(
          (f) => f.type.startsWith('image/') || f.type !== ''
        );
        if (validFiles.length === 0) return;

        const room = Math.max(0, maxAttachments - attachments.length);
        const accepted = validFiles.slice(0, room);

        for (const file of accepted) {
          const isImg = file.type.startsWith('image/');
          const url = URL.createObjectURL(file);
          if (isImg) {
            const img = new Image();
            img.onload = () => addAttachment(file, url, img.naturalWidth, img.naturalHeight, 'image');
            img.onerror = () => addAttachment(file, url, 800, 600, 'image');
            img.src = url;
          } else {
            addAttachment(file, url, 0, 0, 'doc');
          }
        }
      },
      [allowAttachments, attachments.length, maxAttachments]
    );

    const handlePaste = useCallback(
      (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        if (!allowAttachments) return;
        const clipboardItems = Array.from(e.clipboardData?.items || []);
        const fileItems = clipboardItems.filter(
          (item) => item.kind === 'file' || item.type.startsWith('image/')
        );

        if (fileItems.length === 0) return;

        const files: File[] = [];
        for (const item of fileItems) {
          const file = item.getAsFile();
          if (file) files.push(file);
        }

        if (files.length > 0) {
          e.preventDefault();
          processFiles(files);
        }
      },
      [allowAttachments, processFiles]
    );

    const handleDragEnter = useCallback(
      (e: React.DragEvent) => {
        if (!allowAttachments) return;
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current += 1;
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
          setIsDraggingOver(true);
        }
      },
      [allowAttachments]
    );

    const handleDragLeave = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current -= 1;
      if (dragCounterRef.current <= 0) {
        dragCounterRef.current = 0;
        setIsDraggingOver(false);
      }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    }, []);

    const handleDrop = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current = 0;
        setIsDraggingOver(false);
        if (!allowAttachments) return;

        const droppedFiles = Array.from(e.dataTransfer.files || []);
        if (droppedFiles.length > 0) {
          processFiles(droppedFiles);
        }
      },
      [allowAttachments, processFiles]
    );

    const removeAttachment = (id: string) => {
      setAttachments((prev) => {
        const target = prev.find((a) => a.id === id);
        if (target) URL.revokeObjectURL(target.url);
        return prev.filter((a) => a.id !== id);
      });
      thumbRefs.current.delete(id);
    };

    // Calculate action button states
    const showArrow = hasValue && !isRecording;
    const showStop = isRecording;
    const showMic = !hasValue && !isRecording;

    const onActionButtonClick = (e: React.MouseEvent) => {
      e.preventDefault();
      if (isRecording) {
        stopRecording();
      } else if (hasValue) {
        handleSubmit();
      } else {
        startRecording();
      }
    };

    return (
      <>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              .prompt-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; background: transparent; }
              .prompt-scrollbar::-webkit-scrollbar-track { background: transparent; }
              .prompt-scrollbar::-webkit-scrollbar-thumb { background: rgba(150, 150, 150, 0.2); border-radius: 4px; }
              .prompt-scrollbar:hover::-webkit-scrollbar-thumb { background: rgba(150, 150, 150, 0.4); }
            `,
          }}
        />

        <input
          id="chat-file-attachment-input"
          name="chatFileAttachment"
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFilesChosen}
          className="hidden"
          tabIndex={-1}
          aria-hidden="true"
        />

        {/* Primary Search Card Container — Clean Single-Card Layout without internal line collisions */}
        <div
          ref={ref}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={cn(
            'relative w-full max-w-2xl mx-auto rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-md flex flex-col justify-between transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/40',
            isDraggingOver && 'border-dashed border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/30',
            className
          )}
        >
          {/* Drag & Drop Visual Overlay on input */}
          {isDraggingOver && allowAttachments && (
            <div className="absolute inset-0 z-30 rounded-3xl bg-blue-50/90 dark:bg-zinc-900/90 backdrop-blur-xs flex flex-col items-center justify-center pointer-events-none transition-all duration-150 animate-in fade-in">
              <UploadCloud className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-bounce mb-1" />
              <p className="text-xs font-semibold text-blue-900 dark:text-blue-100">
                Drop files here to attach
              </p>
              <p className="text-[10px] text-blue-600/80 dark:text-blue-400/80">
                Images & documents supported
              </p>
            </div>
          )}

          {/* Top Row: Auto-resizing Text Input */}
          <div className="w-full flex-1 mb-3">
            {/* Attachment preview row if files are attached */}
            {hasAttachments && (
              <div className="flex items-center gap-2 pb-2 px-1 overflow-x-auto prompt-scrollbar">
                {attachments.map((attachment, index) => (
                  <AttachmentThumb
                    key={attachment.id}
                    attachment={attachment}
                    index={index}
                    onRemove={removeAttachment}
                    onOpen={(a, rect) => setActiveAttachment({ attachment: a, rect })}
                    registerRef={(id, el) => thumbRefs.current.set(id, el)}
                  />
                ))}
              </div>
            )}

            {/* ── Slash Command Popover ──────────────────────────────── */}
            {showSlashMenu && filteredCommands.length > 0 && (
              <div
                className="absolute bottom-full mb-2 left-4 right-4 max-w-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100"
                role="listbox"
                aria-label="Slash commands"
              >
                <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-zinc-400 border-b border-zinc-100 dark:border-zinc-800">
                  Commands
                </div>
                <div className="p-1.5 space-y-0.5">
                  {filteredCommands.map((cmd, idx) => {
                    const Icon = cmd.icon;
                    return (
                      <button
                        key={cmd.command}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSelectCommand(cmd.command)}
                        role="option"
                        aria-selected={idx === selectedCommandIndex}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                          idx === selectedCommandIndex
                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                            : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0 text-blue-500" />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold">{cmd.command}</span>
                          <span className="text-[10px] text-zinc-400 truncate">{cmd.description}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <textarea
              id="chat-prompt-input"
              name="chatPrompt"
              aria-label="Ask e-Mate a question..."
              ref={textareaRef}
              value={value}
              onChange={(e) => {
                handleInput(e);
                handleValueChange(e.target.value);
              }}
              onPaste={handlePaste}
              onKeyDown={(e) => {
                // Slash menu keyboard navigation
                if (showSlashMenu && filteredCommands.length > 0) {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSelectedCommandIndex((prev) => (prev + 1) % filteredCommands.length);
                    return;
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSelectedCommandIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
                    return;
                  } else if (e.key === 'Enter' || e.key === 'Tab') {
                    e.preventDefault();
                    handleSelectCommand(filteredCommands[selectedCommandIndex].command);
                    return;
                  } else if (e.key === 'Escape') {
                    setShowSlashMenu(false);
                    return;
                  }
                }
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={imageGenMode ? imageGenPlaceholder : placeholder}
              disabled={isRecording}
              className="w-full bg-transparent border-0 outline-none focus:ring-0 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 placeholder:text-left text-left px-1 py-1 resize-none overflow-y-auto min-h-[56px] max-h-[160px] prompt-scrollbar"
            />
          </div>

          {/* Active Image Gen Mode pill */}
          {imageGenMode && (
            <div className="flex items-center gap-1.5 pb-2 px-1 -mt-1">
              <Wand2 size={12} className="text-[#1f51ff] dark:text-[#a8b8ff]" />
              <span className="text-[11px] font-medium text-[#1f51ff] dark:text-[#a8b8ff] bg-[#eef1ff] dark:bg-[#232a55]/60 border border-[#dbe3ff] dark:border-[#232a55] px-2 py-0.5 rounded-md flex items-center gap-1">
                Image Gen Mode Active
              </span>
            </div>
          )}

          {/* Bottom Row: Toolbar Controls */}
          <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-zinc-100 dark:border-zinc-800/60 w-full">
            {/* Left Side: Attach menu + Model & effort (always visible) */}
            <div className="flex items-center gap-2.5">
              {/* Attach drop-up trigger */}
              {allowAttachments && (
                <div className="relative" ref={attachMenuRef}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsAttachMenuOpen((v) => !v);
                    }}
                    aria-label="Attach files or access tools"
                    aria-expanded={isAttachMenuOpen}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors outline-none cursor-pointer"
                  >
                    <Paperclip className="w-4 h-4 -rotate-45" />
                  </button>

                  {isAttachMenuOpen && (
                    <div
                      className="absolute bottom-full left-0 mb-2 z-50 w-64 p-1.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-0.5 animate-in fade-in zoom-in-95 duration-150"
                      role="menu"
                      aria-label="Attachment options"
                    >
                      {/* Add files or photos */}
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setIsAttachMenuOpen(false);
                          uploadKindRef.current = 'image';
                          if (fileInputRef.current) {
                            fileInputRef.current.accept =
                              'image/*,.pdf,.doc,.docx,.txt,.md,.csv,.json,.xlsx,.ppt,.pptx';
                          }
                          fileInputRef.current?.click();
                        }}
                        role="menuitem"
                        className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      >
                        <Paperclip className="w-4 h-4 shrink-0 text-zinc-700 dark:text-zinc-300" />
                        <span className="flex-1 text-left">Add files or photos</span>
                        <kbd className="ml-auto text-[10px] font-mono text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-700 rounded px-1.5 py-0.5">
                          ⌘U
                        </kbd>
                      </button>

                      {/* Add folder */}
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setIsAttachMenuOpen(false)}
                        role="menuitem"
                        aria-disabled="true"
                        className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      >
                        <Folder className="w-4 h-4 shrink-0 text-zinc-700 dark:text-zinc-300" />
                        <span className="flex-1 text-left">Add folder</span>
                      </button>

                      {/* Slash commands */}
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setIsAttachMenuOpen(false);
                          handleValueChange('/');
                          textareaRef.current?.focus();
                        }}
                        role="menuitem"
                        className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      >
                        <TerminalSquare className="w-4 h-4 shrink-0 text-zinc-700 dark:text-zinc-300" />
                        <span className="flex-1 text-left">Slash commands</span>
                      </button>

                      {/* Connectors */}
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setIsAttachMenuOpen(false)}
                        role="menuitem"
                        aria-disabled="true"
                        className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      >
                        <LayoutGrid className="w-4 h-4 shrink-0 text-zinc-700 dark:text-zinc-300" />
                        <span className="flex-1 text-left">Connectors</span>
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-400 ml-auto" />
                      </button>

                      {/* Plugins — flyout submenu */}
                      <div
                        className="relative"
                        onMouseEnter={() => setShowPluginsFlyout(true)}
                        onMouseLeave={() => setShowPluginsFlyout(false)}
                      >
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          role="menuitem"
                          aria-haspopup="true"
                          aria-expanded={showPluginsFlyout}
                          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        >
                          <LayoutGrid className="w-4 h-4 shrink-0 text-zinc-700 dark:text-zinc-300" />
                          <span className="flex-1 text-left">Plugins</span>
                          <ChevronRight className="w-3.5 h-3.5 text-zinc-400 ml-auto" />
                        </button>

                        {showPluginsFlyout && (
                          <div
                            className="absolute left-full top-0 ml-1 w-60 p-1.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-0.5 animate-in fade-in zoom-in-95 duration-100 z-50"
                            role="menu"
                            aria-label="Plugin commands"
                          >
                            {SLASH_COMMANDS.map((cmd) => {
                              const Icon = cmd.icon;
                              return (
                                <button
                                  key={cmd.command}
                                  type="button"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => {
                                    setIsAttachMenuOpen(false);
                                    setShowPluginsFlyout(false);
                                    handleSelectCommand(cmd.command);
                                  }}
                                  role="menuitem"
                                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-left transition-colors cursor-pointer text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                >
                                  <Icon className="w-4 h-4 shrink-0 text-blue-500" />
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-semibold leading-tight">{cmd.label}</span>
                                    <span className="text-[10px] text-zinc-400 truncate">{cmd.description}</span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="relative" ref={modelSelectRef}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsModelSelectOpen((prev) => !prev);
                  }}
                  className={cn(
                    'group flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors outline-none cursor-pointer text-xs font-semibold',
                    isModelSelectOpen ? 'ring-1 ring-zinc-300 dark:ring-zinc-700' : ''
                  )}
                  aria-label={`Select model. Current: ${selectedModel}`}
                >
                  <ModelIcon
                    model={selectedModel}
                    className="size-3.5 opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                  <span className="text-xs font-semibold select-none">
                    <MorphingText text={selectedModel} />
                  </span>
                </button>

                {isModelSelectOpen && (
                  <div className="absolute bottom-full left-0 mb-2 z-50 w-48 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 p-1.5 shadow-xl backdrop-blur-md flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-150">
                    {models.map((model) => (
                      <button
                        key={model}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedModel(model);
                          setIsModelSelectOpen(false);
                        }}
                        className={cn(
                          'group flex h-8 w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-xs font-medium transition-colors cursor-pointer',
                          model === selectedModel
                            ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold'
                            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-100'
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <ModelIcon
                            model={model}
                            className="size-3.5 opacity-85 group-hover:opacity-100 transition-opacity"
                          />
                          {model}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={cycleEffort}
                className="text-xs font-medium text-zinc-500 flex items-center gap-1 hover:text-zinc-800 dark:hover:text-zinc-200 px-2 py-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors outline-none cursor-pointer"
                aria-label={`Mode effort: ${efforts[effortIndex]}`}
              >
                <DynamicBarsIcon level={efforts[effortIndex]} />
                <span className="text-xs font-medium select-none">
                  <MorphingText text={efforts[effortIndex]} />
                </span>
              </button>
            </div>

            {/* Right Side: Action Icons (Send, Mic, Stop) */}
            <div className="flex items-center gap-1.5">
              {/* Audio Wave Visualizer during voice recording */}
              {isRecording && (
                <div className="flex h-8 items-center gap-[3px] px-1">
                  {audioData.map((val, i) => (
                    <div
                      key={i}
                      className="w-1 rounded-full bg-blue-500 transition-[height] duration-75 ease-out"
                      style={{ height: `${Math.max(4, val * 20)}px` }}
                    />
                  ))}
                </div>
              )}

              {/* Image Generation Mode toggle — only rendered when the parent
                  provides a handler (ChatMainArea gates authenticated-only). */}
              {onImageGenToggle && (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={onImageGenToggle}
                  title="Generate image"
                  aria-pressed={imageGenMode}
                  aria-label="Toggle image generation mode"
                  className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors outline-none cursor-pointer ${
                    imageGenMode
                      ? 'text-[#1f51ff] dark:text-[#a8b8ff] bg-[#eef1ff] dark:bg-[#232a55]/60'
                      : 'text-zinc-500 hover:text-[#1f51ff] dark:text-zinc-400 dark:hover:text-[#a8b8ff] hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Wand2 className="w-4 h-4" />
                </button>
              )}

              {/* Voice Input button (when not recording) */}
              {!isRecording && (
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={startRecording}
                  aria-label="Use voice input"
                  title="Voice input"
                  className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 flex items-center justify-center shadow-xs transition-colors outline-none cursor-pointer"
                >
                  <Mic className="w-4 h-4" />
                </button>
              )}

              {/* Send Prompt button (always visible when not recording) */}
              {!isRecording && (
                <button
                  type="button"
                  disabled={!hasValue}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={handleSubmit}
                  aria-label="Send prompt"
                  title="Send"
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center shadow-xs transition-all outline-none cursor-pointer",
                    hasValue
                      ? "bg-brand hover:bg-brand-hover text-brand-foreground active:scale-95 shadow-glow-subtle"
                      : "bg-surface text-text-muted cursor-not-allowed opacity-50"
                  )}
                >
                  <ArrowUpIcon />
                </button>
              )}

              {/* Stop Recording button */}
              {isRecording && (
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={stopRecording}
                  aria-label="Stop recording"
                  title="Stop recording"
                  className="h-8 w-8 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-sm transition-transform active:scale-95 outline-none cursor-pointer"
                >
                  <StopIcon />
                </button>
              )}
            </div>
          </div>
        </div>

        {activeAttachment && (
          <AttachmentGalleryModal
            attachment={activeAttachment.attachment}
            originRect={activeAttachment.rect}
            onClose={() => setActiveAttachment(null)}
          />
        )}
      </>
    );
  }
);

PromptInput.displayName = 'PromptInput';
