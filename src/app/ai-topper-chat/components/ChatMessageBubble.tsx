'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check, RotateCcw, BookMarked, Sparkles, Loader2, ChevronRight, Plus } from 'lucide-react';
import type { ChatMessage } from './AITopperChatScreen';
import { appendToNotebook } from '@/lib/notebook';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import type { MCQSubmission } from '@/lib/agents/types';

const GeneratedImageCard = dynamic(() => import('@/components/GeneratedImageCard'), {
  ssr: false,
});

const StudyAnalyzerReport = dynamic(() => import('@/components/StudyAnalyzerReport'), {
  ssr: false,
});

// ─── Process step definitions ────────────────────────────────────────────────
const PROCESS_STEPS = [
  'Loaded subject notebook settings',
  'Injected personal context summary',
  'Sent request to model',
  'Streaming response…',
  'Thought process finished',
] as const;

interface ChatMessageBubbleProps {
  message: ChatMessage;
  theme?: 'light' | 'dark';
  /** When provided, shows an active Regenerate button that calls this handler */
  onRegenerate?: () => void;
  /**
   * -1  = no process tracking (general chat or old message)
   *  1  = step 1 done
   *  …
   *  5  = all steps done (stream complete)
   */
  processStep?: number;
  /** Called when the user clicks a generated-image "Regenerate". (imageId, prompt) */
  onRegenerateImage?: (messageId: string, imageId: string, prompt: string) => void;
  /** Called when user clicks "Reinforce Weak Concepts" in an analyzer report. */
  onReinforce?: (weakTopics: string[], submissionData?: MCQSubmission) => void;
  /** True when this message is actively streaming tokens from the LLM */
  isStreaming?: boolean;
}

// ─── Collapsible details/summary component ───────────────────────────────────

function FlashcardDetails({
  summaryText,
  children,
  theme = 'dark',
}: {
  summaryText: string;
  children: React.ReactNode;
  theme?: 'light' | 'dark';
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isDark = theme === 'dark';

  return (
    <div
      className="my-3 rounded-xl overflow-hidden transition-all"
      style={{
        border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
        background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
      }}
    >
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-3.5 cursor-pointer select-none transition-colors"
        style={{
          background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
        }}
      >
        <ChevronRight
          size={14}
          className="shrink-0 transition-transform duration-200"
          style={{
            color: isDark ? '#71717a' : '#a1a1aa',
            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        />
        <span
          className="text-xs font-semibold"
          style={{ color: isDark ? '#d4d4d8' : '#3f3f46' }}
        >
          {summaryText || (isOpen ? 'Hide Answer' : 'Click to reveal answer')}
        </span>
      </div>

      {isOpen && (
        <div
          className="px-4 py-3.5 text-sm leading-relaxed animate-in fade-in duration-200"
          style={{
            borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
            color: isDark ? '#d4d4d8' : '#27272a',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Markdown renderer ────────────────────────────────────────────────────────

function renderMarkdown(text: string, theme: 'light' | 'dark' = 'dark'): React.ReactNode[] {
  const lines = text.split('\n');
  const result: React.ReactNode[] = [];
  let i = 0;
  const isDark = theme === 'dark';

  while (i < lines.length) {
    const line = lines[i];

    // ── <details> / <summary> collapsible block ─────────────────────────────
    if (line.trim().startsWith('<details')) {
      const detailLines: string[] = [];
      let depth = 1;
      detailLines.push(line);
      i++;
      while (i < lines.length && depth > 0) {
        if (lines[i].includes('<details')) depth++;
        if (lines[i].includes('</details>')) depth--;
        detailLines.push(lines[i]);
        i++;
      }
      const block = detailLines.join('\n');
      const summaryMatch = block.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i);
      const summaryText = summaryMatch
        ? summaryMatch[1].replace(/<[^>]+>/g, '').trim()
        : '';
      const contentMatch = block.match(/<\/summary>([\s\S]*?)<\/details>/i);
      const innerContent = contentMatch ? contentMatch[1].trim() : '';
      result.push(
        <FlashcardDetails
          key={`details-${i}`}
          summaryText={summaryText}
          theme={theme}
        >
          {innerContent.split('\n').filter(l => l.trim()).map((l, li) => (
            <p
              key={`details-p-${i}-${li}`}
              dangerouslySetInnerHTML={{ __html: formatInline(l.trim(), theme) }}
            />
          ))}
        </FlashcardDetails>
      );
      continue;
    }

    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      result.push(
        <div
          key={`code-${i}`}
          className="relative my-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 overflow-hidden font-mono text-sm shadow-md"
        >
          <div className="flex items-center justify-between px-4 py-1.5 bg-zinc-900/70 border-b border-zinc-800 text-xs text-zinc-400 font-sans">
            <span className="flex items-center gap-2">
              <span className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-zinc-700" />
                <span className="w-2 h-2 rounded-full bg-zinc-700" />
              </span>
              <span>{lang || 'code'}</span>
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(codeLines.join('\n'));
                toast.success('Code copied to clipboard!');
              }}
              className="px-1.5 py-0.5 rounded-md hover:bg-white/5 hover:text-zinc-100 transition-colors"
            >
              Copy
            </button>
          </div>
          <pre className="p-4 overflow-x-auto bg-transparent text-zinc-100 whitespace-pre scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            <code className="text-xs font-mono leading-relaxed bg-transparent overflow-x-auto whitespace-pre">
              {codeLines.join('\n')}
            </code>
          </pre>
        </div>
      );
      i++;
      continue;
    }

    if (line.startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      const rows = tableLines
        .filter((l) => !l.match(/^\|[-\s|]+\|$/))
        .map((l) =>
          l
            .split('|')
            .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
            .map((cell) => cell.trim())
        );
      if (rows.length > 0) {
        result.push(
          <div
            key={`table-${i}`}
            className="my-3 overflow-x-auto rounded-xl"
            style={{
              border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
            }}
          >
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}>
                  {rows[0].map((cell, ci) => (
                    <th
                      key={`th-${ci}`}
                      className="px-3 py-2 text-left font-semibold"
                      style={{
                        color: isDark ? '#ececec' : '#000000',
                        borderBottom: isDark
                          ? '1px solid rgba(255,255,255,0.08)'
                          : '1px solid rgba(0,0,0,0.06)',
                      }}
                    >
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(1).map((row, ri) => (
                  <tr
                    key={`tr-${ri}`}
                    style={{
                      borderBottom: isDark
                        ? '1px solid rgba(255,255,255,0.06)'
                        : '1px solid rgba(0,0,0,0.04)',
                    }}
                    className="last:border-0"
                  >
                    {row.map((cell, ci) => (
                      <td
                        key={`td-${ri}-${ci}`}
                        className="px-3 py-2"
                        style={{ color: isDark ? '#b4b4b4' : '#27272a' }}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    if (line.startsWith('## ')) {
      result.push(
        <h2
          key={`h2-${i}`}
          className="text-base font-semibold mt-4 mb-2"
          style={{ color: isDark ? '#ececec' : '#000000' }}
        >
          {line.slice(3)}
        </h2>
      );
      i++;
      continue;
    }

    if (line.startsWith('### ')) {
      result.push(
        <h3
          key={`h3-${i}`}
          className="text-sm font-semibold mt-3 mb-1.5"
          style={{ color: isDark ? '#ececec' : '#000000' }}
        >
          {line.slice(4)}
        </h3>
      );
      i++;
      continue;
    }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      const bullets: string[] = [];
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        bullets.push(lines[i].slice(2));
        i++;
      }
      result.push(
        <ul key={`ul-${i}`} className="my-1.5 space-y-1 pl-1">
          {bullets.map((b, bi) => (
            <li
              key={`li-${i}-${bi}`}
              className="text-xs sm:text-sm leading-relaxed flex items-start gap-2"
              style={{ color: isDark ? '#e4e4e7' : '#18181b' }}
            >
              <span className="shrink-0 text-zinc-600 dark:text-zinc-400 font-bold text-sm leading-relaxed">•</span>
              <span dangerouslySetInnerHTML={{ __html: formatInline(b, theme) }} />
            </li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ''));
        i++;
      }
      result.push(
        <ol key={`ol-${i}`} className="my-2 space-y-2 pl-4 list-decimal list-inside">
          {items.map((item, ii) => (
            <li
              key={`oli-${i}-${ii}`}
              className="text-sm leading-relaxed"
              style={{ color: isDark ? '#b4b4b4' : '#27272a' }}
              dangerouslySetInnerHTML={{ __html: formatInline(item, theme) }}
            />
          ))}
        </ol>
      );
      continue;
    }

    if (line.trim() === '') {
      result.push(<div key={`br-${i}`} className="h-1.5" />);
      i++;
      continue;
    }

    result.push(
      <p
        key={`p-${i}`}
        className="text-sm leading-relaxed"
        style={{ color: isDark ? '#b4b4b4' : '#27272a' }}
        dangerouslySetInnerHTML={{ __html: formatInline(line, theme) }}
      />
    );
    i++;
  }

  return result;
}

function formatInline(text: string, theme: 'light' | 'dark' = 'dark'): string {
  const isDark = theme === 'dark';
  const strongColor = isDark ? '#ffffff' : '#111111';
  const emColor = isDark ? '#b4b4b4' : '#52525b';
  const codeBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
  const codeColor = isDark ? '#a8b8ff' : '#1f51ff';
  const chipBg = isDark ? 'rgba(138,162,255,0.10)' : 'rgba(31,81,255,0.06)';
  const chipBorder = isDark ? 'rgba(138,162,255,0.18)' : 'rgba(31,81,255,0.12)';

  return text
    .replace(
      /\*\*(.+?)\*\*/g,
      `<strong style="font-weight:600;color:${strongColor};">$1</strong>`
    )
    .replace(/\*(.+?)\*/g, `<em style="font-style:italic;color:${emColor}">$1</em>`)
    .replace(
      /`(.+?)`/g,
      `<code style="padding:2px 6px;border-radius:4px;font-size:0.75rem;font-family:monospace;background:${codeBg};color:${codeColor}">$1</code>`
    )
    .replace(
      /\[(?:Source|Doc):\s*([^\]]+)\]/gi,
      `<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;margin:2px 4px;border-radius:6px;font-size:0.7rem;font-weight:600;background:${chipBg};color:${codeColor};border:1px solid ${chipBorder};" title="Verified Study Source Citation">📎 $1</span>`
    );
}

// ─── Process Accordion ────────────────────────────────────────────────────────

interface ProcessAccordionProps {
  processStep: number; // 1–5, or -1 for none
  theme: 'light' | 'dark';
}

function ProcessAccordion({ processStep, theme }: ProcessAccordionProps) {
  const isDone = processStep >= 5;
  const isActive = processStep >= 1 && processStep < 5;

  // Start expanded when active; auto-collapse once streaming starts (step 4)
  const [isExpanded, setIsExpanded] = useState(true);
  const [bodyHeight, setBodyHeight] = useState<number | undefined>(undefined);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Measure real body height whenever steps change
  useEffect(() => {
    if (bodyRef.current) {
      setBodyHeight(bodyRef.current.scrollHeight);
    }
  }, [processStep]);

  // Auto-collapse 1.5 s after streaming kicks in (step 4)
  useEffect(() => {
    if (processStep === 4) {
      const t = setTimeout(() => setIsExpanded(false), 1500);
      return () => clearTimeout(t);
    }
  }, [processStep]);

  const isDark = theme === 'dark';

  return (
    <div className="my-1">
      {/* Accordion header */}
      <button
        onClick={() => setIsExpanded((v) => !v)}
        className="flex items-center gap-2 text-xs font-medium transition-colors py-1 focus:outline-none"
        style={{ color: isDark ? '#71717a' : '#71717a' }}
      >
        {/* Dot: pulses while active, solid once done */}
        <span className="relative flex items-center justify-center w-2 h-2">
          <span
            className={`absolute inset-0 rounded-full ${isActive ? 'animate-ping opacity-60' : ''}`}
            style={{
              background: isDone ? '#1f51ff' : isActive ? '#1f51ff' : '#71717a',
            }}
          />
          <span
            className="relative rounded-full w-1.5 h-1.5"
            style={{
              background: isDone ? '#1f51ff' : isActive ? '#1f51ff' : '#71717a',
            }}
          />
        </span>

        <span
          style={{
            color: isDone
              ? isDark
                ? '#8aa2ff'
                : '#1f51ff'
              : isActive
                ? isDark
                  ? '#a1a1aa'
                  : '#71717a'
                : isDark
                  ? '#52525b'
                  : '#a1a1aa',
          }}
        >
          {isDone ? 'Thought process finished' : isActive ? 'Thinking…' : 'Processing…'}
        </span>

        {/* Chevron */}
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transform transition-transform duration-200"
          style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Accordion body — smooth height transition */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: isExpanded ? (bodyHeight ?? 500) + 'px' : '0px',
          opacity: isExpanded ? 1 : 0,
        }}
      >
        <div
          ref={bodyRef}
          className="mt-1.5 pl-3 space-y-1.5 pb-1"
          style={{
            borderLeft: `2px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
          }}
        >
          {PROCESS_STEPS.map((label, idx) => {
            const stepNum = idx + 1; // 1–5
            const isStepDone = processStep >= stepNum;
            const isStepActive = processStep === stepNum - 1 && stepNum <= 4;

            return (
              <div
                key={label}
                className="flex items-center gap-2 transition-all duration-300"
                style={{
                  opacity: processStep >= stepNum - 1 ? 1 : 0.3,
                  transform: processStep >= stepNum - 1 ? 'translateX(0)' : 'translateX(-4px)',
                }}
              >
                {/* Icon: spinner if in-progress, check if done */}
                <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
                  {isStepDone ? (
                    <Check
                      size={11}
                      className="transition-transform duration-300 scale-100"
                      style={{ color: '#10b981' }}
                    />
                  ) : isStepActive ? (
                    <Loader2
                      size={11}
                      className="animate-spin"
                      style={{ color: isDark ? '#71717a' : '#a1a1aa' }}
                    />
                  ) : (
                    <span
                      className="w-1 h-1 rounded-full"
                      style={{ background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }}
                    />
                  )}
                </span>
                <span
                  className="text-[11px] font-mono transition-colors duration-300"
                  style={{
                    color: isStepDone
                      ? isDark
                        ? '#52525b'
                        : '#a1a1aa'
                      : isStepActive
                        ? isDark
                          ? '#a1a1aa'
                          : '#71717a'
                        : isDark
                          ? '#3f3f46'
                          : '#d4d4d8',
                  }}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

// ─── Grounded Citations List ─────────────────────────────────────────────────

function GroundedCitationsList({
  citations,
  theme = 'dark',
}: {
  citations: import('@/lib/prompts').Citation[];
  theme?: 'light' | 'dark';
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isDark = theme === 'dark';

  if (!citations || citations.length === 0) return null;

  return (
    <div
      className="mt-3 pt-2 rounded-xl transition-all"
      style={{
        borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
      }}
    >
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-semibold hover:opacity-80 transition-opacity focus:outline-none cursor-pointer"
        style={{ color: isDark ? '#a1a1aa' : '#52525b' }}
      >
        <span className="text-[11px]">📎</span>
        <span>Grounded in {citations.length} source{citations.length > 1 ? 's' : ''}</span>
        <ChevronRight
          size={12}
          className="transition-transform duration-200"
          style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
        />
      </button>

      {isExpanded && (
        <div className="mt-2 space-y-1.5 animate-in fade-in duration-150">
          {citations.map((c, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-xl text-xs flex flex-col gap-1"
              style={{
                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.05)',
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold truncate text-xs" style={{ color: isDark ? '#e4e4e7' : '#18181b' }}>
                  {c.sourceFileName}
                </span>
                {c.page && (
                  <span
                    className="px-1.5 py-0.5 text-[10px] font-mono rounded shrink-0 font-medium"
                    style={{
                      background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                      color: isDark ? '#a1a1aa' : '#71717a',
                    }}
                  >
                    Page {c.page}
                  </span>
                )}
              </div>
              {c.previewText && (
                <p
                  className="text-[11px] leading-relaxed line-clamp-2 italic"
                  style={{ color: isDark ? '#a1a1aa' : '#71717a' }}
                >
                  "{c.previewText}"
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ChatMessageBubble({
  message,
  theme = 'dark',
  onRegenerate,
  processStep = -1,
  onRegenerateImage,
  onReinforce,
  isStreaming = false,
}: ChatMessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const isUser = message.role === 'user';
  const isDark = theme === 'dark';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSaveToNotebook = () => {
    const activeSubj = typeof window !== 'undefined' ? localStorage.getItem('nk-subject') : null;
    const subj = message.subject || activeSubj || '';
    appendToNotebook(
      subj,
      `Key concept: ${message.content.slice(0, 300)}${message.content.length > 300 ? '...' : ''}`,
      'ai'
    );
    setSaved(true);
    toast.success(`Saved to ${subj} Notebook!`);
    setTimeout(() => setSaved(false), 2000);
  };

  if (isUser) {
    return (
      <div className="flex flex-col items-end w-full fade-in-up my-1">
        <div className="bg-[#cbe2ff] dark:bg-[#1e3a8a]/70 text-[#1a1a1a] dark:text-[#f0f0f0] px-4 py-2 rounded-full max-w-[80%] inline-block text-xs sm:text-sm font-normal shadow-2xs">
          {message.content}
        </div>
      </div>
    );
  }

  const showProcessAccordion = !message.isGeneralChat && processStep >= 1;

  return (
    <div className="w-full fade-in-up group transition-colors flex flex-col items-start gap-1.5 my-1">
      {/* Assistant Message Container Card */}
      <div className="px-5 py-3.5 sm:px-6 sm:py-4 rounded-[22px] bg-[#e5e5e5] dark:bg-zinc-800/80 text-[#1a1a1a] dark:text-[#f0f0f0] max-w-[620px] shadow-2xs space-y-2">
        {/* Animated process accordion — only for study mode with active tracking */}
        {showProcessAccordion && <ProcessAccordion processStep={processStep} theme={theme} />}

        {/* Message content */}
        <div
          className="prose prose-zinc dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed font-normal"
          style={{ color: isDark ? '#f4f4f5' : '#1a1a1a' }}
        >
          {message.content ? (
            <>
              {renderMarkdown(message.content, theme)}
              {isStreaming && (
                <span
                  className="inline-block w-1.5 h-3.5 ml-1 bg-blue-500 animate-pulse align-middle rounded-xs"
                  aria-label="streaming"
                />
              )}
            </>
          ) : (
            isStreaming && (
              <div className="flex items-center gap-1.5 py-1.5 text-zinc-400 dark:text-zinc-500 text-xs">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )
          )}
        </div>

        {/* Grounded Citations List if attached to message */}
        {message.citations && message.citations.length > 0 && (
          <GroundedCitationsList citations={message.citations} theme={theme} />
        )}

        {/* Connect your apps Action Card block */}
        {(message.content.toLowerCase().includes('gmail') || message.content.toLowerCase().includes('inbox') || message.content.toLowerCase().includes('calendar')) && (
          <div className="mt-3 p-4 rounded-[22px] bg-[#dedede] dark:bg-zinc-800/90 max-w-xs space-y-3 border border-transparent">
            <h5 className="text-xs font-bold text-zinc-900 dark:text-white">Connect your apps</h5>
            <div className="space-y-2">
              {/* Gmail Row */}
              <div
                onClick={() => toast.success('Connecting Gmail...')}
                className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-white/50 dark:hover:bg-zinc-700/50 cursor-pointer transition-colors"
              >
                <div className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-700 flex items-center justify-center shrink-0 border border-zinc-200/50 dark:border-zinc-600 shadow-2xs">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4Z" fill="#EA4335"/>
                    <path d="M20 6L12 11L4 6V18H20V6Z" fill="#34A853"/>
                    <path d="M4 6L12 11L20 6" stroke="#4285F4" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="min-w-0">
                  <h6 className="text-xs font-semibold text-zinc-900 dark:text-white leading-tight">Gmail</h6>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate leading-tight mt-0.5">Manage your inbox and draft replies</p>
                </div>
              </div>

              {/* Google Calendar Row */}
              <div
                onClick={() => toast.success('Connecting Google Calendar...')}
                className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-white/50 dark:hover:bg-zinc-700/50 cursor-pointer transition-colors"
              >
                <div className="w-8 h-8 rounded-xl bg-[#4285F4] text-white flex items-center justify-center shrink-0 font-bold text-xs shadow-2xs">
                  31
                </div>
                <div className="min-w-0">
                  <h6 className="text-xs font-semibold text-zinc-900 dark:text-white leading-tight">Google Calendar</h6>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate leading-tight mt-0.5">Add and manage calendar events</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Interactive OpenRouter CTA button for error messages */}
        {message.content.toLowerCase().includes('openrouter') && (
          <div className="mt-3 flex items-center gap-2">
            {message.content.toLowerCase().includes('credit') || message.content.toLowerCase().includes('balance') ? (
              <a
                href="https://openrouter.ai/settings/credits"
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 rounded-full bg-[#0060df] hover:bg-[#0052cc] text-white text-xs sm:text-sm font-medium inline-flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <Sparkles size={16} />
                <span>Add Credits on OpenRouter</span>
              </a>
            ) : (
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event('nk-open-openrouter-modal'))}
                className="px-5 py-2.5 rounded-full bg-[#0060df] hover:bg-[#0052cc] text-white text-xs sm:text-sm font-medium inline-flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <Plus size={16} />
                <span>Connect OpenRouter Account</span>
              </button>
            )}
          </div>
        )}

        {/* Generated image cards */}
        {message.images && message.images.length > 0 && (
          <div className="mt-2">
            {message.images.map((img) => (
              <GeneratedImageCard
                key={img.id}
                image={img}
                theme={theme}
                onRegenerate={
                  onRegenerateImage
                    ? (imageId, prompt) => onRegenerateImage(message.id, imageId, prompt)
                    : undefined
                }
              />
            ))}
          </div>
        )}

        {/* Study Analyzer Report */}
        {message.analyzerReport && onReinforce && (
          <StudyAnalyzerReport report={message.analyzerReport} onReinforce={onReinforce} />
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pl-2">
        <button
          onClick={handleCopy}
          title="Copy response"
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-300 cursor-pointer"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
        {!message.isGeneralChat && (
          <button
            onClick={handleSaveToNotebook}
            title="Save to Subject Notebook"
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-300 cursor-pointer"
          >
            {saved ? <Check size={12} className="text-emerald-500" /> : <BookMarked size={12} />}
            <span className={saved ? 'text-emerald-500 font-medium' : ''}>
              {saved ? 'Saved to Notebook' : 'Save to Notebook'}
            </span>
          </button>
        )}
        <button
          title="Regenerate"
          onClick={onRegenerate}
          disabled={!onRegenerate}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-300 ${
            onRegenerate
              ? 'cursor-pointer'
              : 'opacity-40 cursor-not-allowed'
          }`}
        >
          <RotateCcw size={12} />
          <span>Regenerate</span>
        </button>
      </div>
    </div>
  );
}

// ─── Static fallback accordion (for messages loaded from history) ─────────────

function StaticProcessAccordion({ theme }: { theme: 'light' | 'dark' }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isDark = theme === 'dark';

  return (
    <div className="my-1">
      <button
        onClick={() => setIsExpanded((v) => !v)}
        className="flex items-center gap-2 text-xs font-medium py-1 focus:outline-none transition-colors"
        style={{ color: isDark ? '#52525b' : '#a1a1aa' }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#10b981' }} />
        <span style={{ color: isDark ? '#34d399' : '#059669' }}>Thought process finished</span>
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-transform duration-200"
          style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: isExpanded ? '200px' : '0px', opacity: isExpanded ? 1 : 0 }}
      >
        <div
          className="mt-1.5 pl-3 space-y-1.5 pb-1"
          style={{
            borderLeft: `2px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
          }}
        >
          {PROCESS_STEPS.map((label) => (
            <div key={label} className="flex items-center gap-2">
              <Check size={11} style={{ color: '#10b981' }} className="shrink-0" />
              <span
                className="text-[11px] font-mono"
                style={{ color: isDark ? '#52525b' : '#a1a1aa' }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
