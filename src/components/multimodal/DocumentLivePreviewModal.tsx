'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  X,
  Download,
  ChevronDown,
  Maximize2,
  Minimize2,
  Landmark,
  Leaf,
  Wind,
  Sun,
  TrendingUp,
  Zap,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Brain,
  Cpu,
  Code2,
  Database,
  BarChart3,
  Layers,
  Building2,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { exportToDocx, exportToPptx, downloadFile } from '@/lib/documentExport';
import {
  omitModelTitleSlide,
  extractPresentationCoverData,
  extractPresentationPillars,
  parsePresentationMarkdown,
  detectPresentationTheme,
  PRESENTATION_THEMES,
  type PresentationTheme,
  type PresentationThemeStyle,
} from '@/lib/presentationCover';
import { parseMarkdownDocument, type MarkdownBlock } from '@/lib/standardDocument';
import type { GeneratedDocument } from './DocumentGenerationCard';

interface DocumentLivePreviewModalProps {
  doc: GeneratedDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  theme?: 'light' | 'dark';
  inline?: boolean;
}

interface ParsedSlideItem {
  title: string;
  desc: string;
  iconType: string;
}

interface ParsedSlide {
  title: string;
  kicker: string;
  subtitle?: string;
  presenter?: string;
  items: ParsedSlideItem[];
  takeaway?: string;
  bullets: string[];
  notes?: string;
  isCover?: boolean;
  pills?: string[];
  coverIconType?: string;
  theme?: PresentationTheme;
}

// ── Google Drive Logo SVG ──────────────────────────────────────────────────
function GoogleDriveLogo({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
      <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
      <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
      <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
      <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
      <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
      <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
    </svg>
  );
}

// ── Real-time Topic & Kicker Detection ─────────────────────────────────────
function detectDomainKicker(text: string): { kicker: string; icon: string } {
  const lower = text.toLowerCase();

  if (
    lower.includes('machine learning') ||
    lower.includes('deep learning') ||
    lower.includes('neural') ||
    lower.includes('artificial intelligence') ||
    lower.includes(' ai ') ||
    lower.includes('data science') ||
    lower.includes('algorithm') ||
    lower.includes('python') ||
    lower.includes('nlp') ||
    lower.includes('computer vision')
  ) {
    return { kicker: 'COMPUTER SCIENCE • ARTIFICIAL INTELLIGENCE', icon: 'cpu' };
  }

  if (
    lower.includes('bank') ||
    lower.includes('financ') ||
    lower.includes('monetary') ||
    lower.includes('investment') ||
    lower.includes('economy') ||
    lower.includes('capital') ||
    lower.includes('fiscal') ||
    lower.includes('stock')
  ) {
    return { kicker: 'ECONOMICS • FINANCIAL SECTORS', icon: 'landmark' };
  }

  if (
    lower.includes('green') ||
    lower.includes('sustainab') ||
    lower.includes('climate') ||
    lower.includes('renewab') ||
    lower.includes('energy') ||
    lower.includes('ecology') ||
    lower.includes('environment')
  ) {
    return { kicker: 'ENVIRONMENTAL SCIENCE • SUSTAINABILITY', icon: 'leaf' };
  }

  if (
    lower.includes('medicine') ||
    lower.includes('clinical') ||
    lower.includes('biolog') ||
    lower.includes('health') ||
    lower.includes('pharma') ||
    lower.includes('genomic')
  ) {
    return { kicker: 'HEALTH SCIENCES • CLINICAL RESEARCH', icon: 'sparkles' };
  }

  if (
    lower.includes('marketing') ||
    lower.includes('business') ||
    lower.includes('startup') ||
    lower.includes('management') ||
    lower.includes('enterprise') ||
    lower.includes('strategy')
  ) {
    return { kicker: 'BUSINESS STRATEGY • EXECUTIVE OVERVIEW', icon: 'chart' };
  }

  return { kicker: 'EXECUTIVE OVERVIEW • STRATEGIC ROADMAP', icon: 'layers' };
}

function detectSlideKicker(title: string, index: number): string {
  const lower = title.toLowerCase();

  if (lower.includes('agenda') || lower.includes('roadmap') || lower.includes('outline') || lower.includes('table of contents')) {
    return 'AGENDA & ROADMAP';
  }
  if (lower.includes('intro') || lower.includes('fundamental') || lower.includes('overview') || lower.includes('concept') || lower.includes('what is')) {
    return 'FOUNDATIONS & CONCEPTS';
  }
  if (lower.includes('architect') || lower.includes('pillar') || lower.includes('framework') || lower.includes('core')) {
    return 'CORE ARCHITECTURE & PILLARS';
  }
  if (lower.includes('algorithm') || lower.includes('mechanism') || lower.includes('method') || lower.includes('process') || lower.includes('deep dive')) {
    return 'DEEP DIVE & MECHANISMS';
  }
  if (lower.includes('applicat') || lower.includes('practice') || lower.includes('case study') || lower.includes('implement')) {
    return 'PRACTICAL APPLICATIONS';
  }
  if (lower.includes('challenge') || lower.includes('risk') || lower.includes('limit') || lower.includes('security')) {
    return 'SYSTEMIC CHALLENGES & RISKS';
  }
  if (lower.includes('future') || lower.includes('conclusion') || lower.includes('takeaway') || lower.includes('next step') || lower.includes('horizon')) {
    return 'KEY TAKEAWAYS & NEXT STEPS';
  }

  const fallbacks = [
    'FOUNDATIONS & SCOPE',
    'CORE PILLARS & MECHANISMS',
    'STRATEGIC ANALYSIS',
    'IMPLEMENTATION ROADMAP',
    'EVALUATION & METRICS',
  ];
  return fallbacks[(index - 1) % fallbacks.length];
}

// ── Smart icon picker for slide items ──────────────────────────────────────
function pickSlideIcon(text: string, index: number): string {
  const lower = text.toLowerCase();
  if (lower.includes('cpu') || lower.includes('model') || lower.includes('compute') || lower.includes('neural')) return 'cpu';
  if (lower.includes('brain') || lower.includes('ai') || lower.includes('learn') || lower.includes('intelligence')) return 'brain';
  if (lower.includes('code') || lower.includes('program') || lower.includes('software') || lower.includes('develop')) return 'code';
  if (lower.includes('data') || lower.includes('database') || lower.includes('dataset') || lower.includes('storage')) return 'database';
  if (lower.includes('bank') || lower.includes('central') || lower.includes('govern') || lower.includes('institution') || lower.includes('policy')) return 'landmark';
  if (lower.includes('leaf') || lower.includes('green') || lower.includes('sustain') || lower.includes('climate')) return 'leaf';
  if (lower.includes('wind') || lower.includes('clean') || lower.includes('energy')) return 'wind';
  if (lower.includes('sun') || lower.includes('solar') || lower.includes('power')) return 'sun';
  if (lower.includes('growth') || lower.includes('market') || lower.includes('financ') || lower.includes('invest') || lower.includes('metric') || lower.includes('trend')) return 'chart';
  if (lower.includes('risk') || lower.includes('protect') || lower.includes('secur') || lower.includes('stabilit')) return 'shield';

  const defaultCycle = ['cpu', 'brain', 'chart', 'shield', 'code', 'database'];
  return defaultCycle[index % defaultCycle.length];
}

function renderSlideItemIcon(type: string, className = 'w-4 h-4') {
  switch (type) {
    case 'brain':
      return <Brain className={className} />;
    case 'cpu':
      return <Cpu className={className} />;
    case 'code':
      return <Code2 className={className} />;
    case 'database':
      return <Database className={className} />;
    case 'chart':
      return <BarChart3 className={className} />;
    case 'leaf':
      return <Leaf className={className} />;
    case 'landmark':
      return <Landmark className={className} />;
    case 'wind':
      return <Wind className={className} />;
    case 'sun':
      return <Sun className={className} />;
    case 'shield':
      return <ShieldCheck className={className} />;
    case 'sparkles':
      return <Sparkles className={className} />;
    case 'layers':
      return <Layers className={className} />;
    default:
      return <CheckCircle2 className={className} />;
  }
}

// ── Parse presentation slides dynamically without static fallbacks ────────
function parseSlides(markdown: string, presentationTitle: string, selectedThemeId?: PresentationThemeStyle): ParsedSlide[] {
  const allRawSlides = parsePresentationMarkdown(markdown);
  const coverRaw = allRawSlides.find((s) => s.isTitle) || allRawSlides[0];
  const contentRaw = allRawSlides.filter((s) => !s.isTitle);

  const coverData = extractPresentationCoverData(markdown, presentationTitle);
  const theme = detectPresentationTheme(
    presentationTitle + ' ' + (coverData.subtitle || '') + ' ' + markdown.slice(0, 1000),
    selectedThemeId
  );

  const contentSlides: ParsedSlide[] = contentRaw.map((sec, idx) => {
    const lines = sec.content.trim().split('\n');
    const titleLine = lines.find((l) => l.trim().startsWith('## ') || l.trim().startsWith('# '));
    const title = titleLine ? titleLine.replace(/^#{1,2}\s+/, '').trim() : sec.marker || `Slide ${idx + 2}`;

    const notesLine = lines.find((l) => l.includes('[Speaker notes:') || l.includes('Speaker notes:'));
    const notes = notesLine
      ? notesLine.replace(/\[?Speaker notes:?\s*/i, '').replace(/\]$/, '').trim()
      : undefined;

    const bulletLines = lines
      .filter((l) => {
        const t = l.trim();
        if (t.startsWith('#')) return false;
        if (t.includes('Speaker notes:')) return false;
        return (
          t.startsWith('- ') ||
          t.startsWith('* ') ||
          t.startsWith('• ') ||
          /^\d+\.\s+/.test(t) ||
          /^\*\*.+\*\*/.test(t)
        );
      })
      .map((l) => l.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '').trim());

    const rawBullets = bulletLines.length > 0 ? bulletLines : [sec.content.replace(/^#{1,6}\s+.*$/gm, '').trim().slice(0, 240)];

    let takeawayText = '';
    const items: ParsedSlideItem[] = [];

    for (let i = 0; i < rawBullets.length; i++) {
      const bullet = rawBullets[i];
      const isTakeawayCandidate =
        /takeaway/i.test(bullet) ||
        /key insight/i.test(bullet) ||
        /conclusion/i.test(bullet) ||
        /summary/i.test(bullet);

      const boldMatch = /^\*\*(.*?)\*\*[\s:-]*(.*)$/.exec(bullet);
      const itemTitle = boldMatch ? boldMatch[1].trim() : bullet.slice(0, 36).trim();
      const itemDesc = boldMatch && boldMatch[2] ? boldMatch[2].trim() : bullet.replace(/^\*\*(.*?)\*\*/, '').trim() || itemTitle;

      if (isTakeawayCandidate && !takeawayText) {
        takeawayText = itemDesc || itemTitle;
      } else {
        items.push({
          title: itemTitle || `Core Insight ${items.length + 1}`,
          desc: itemDesc || bullet,
          iconType: pickSlideIcon(itemTitle + ' ' + itemDesc, items.length),
        });
      }
    }

    if (!takeawayText && items.length >= 2) {
      const last = items.pop()!;
      takeawayText = last.desc || last.title;
    } else if (!takeawayText && items.length === 1) {
      takeawayText = items[0].desc;
    }

    return {
      title,
      kicker: detectSlideKicker(title, idx + 1),
      items: items.slice(0, 3),
      takeaway: takeawayText,
      bullets: rawBullets,
      notes,
      theme,
    };
  });

  // Extract 4 real-time topic pills
  const directPillars = extractPresentationPillars(markdown);
  const defaultPills = theme.id === 'ai-tech'
    ? ['Core Concepts', 'Architectures', 'Model Training', 'Evaluation']
    : theme.id === 'finance-business'
    ? ['Financial Stability', 'Central Banking', 'Monetary Policy', 'Systemic Risk']
    : theme.id === 'medical-health'
    ? ['Clinical Evidence', 'Pathophysiology', 'Diagnostics', 'Therapeutics']
    : theme.id === 'creative-marketing'
    ? ['Brand Identity', 'Audience Growth', 'Visual Design', 'Campaign Strategy']
    : ['Strategic Focus', 'Core Pillars', 'Architecture', 'Roadmap'];
  const finalPills = (directPillars.length >= 3 ? directPillars : defaultPills).slice(0, 4);

  // Presenter detection (from markdown or clean default)
  let presenterName = 'Prepared with e-Mate AI Studio';
  const presenterMatch = markdown.match(/(?:Presented by|Author:|Prepared by|Speaker:)\s*([A-Za-z\s.]+)/i);
  if (presenterMatch && presenterMatch[1] && presenterMatch[1].trim().length > 2 && presenterMatch[1].trim().length < 40) {
    presenterName = `Presented by ${presenterMatch[1].trim()}`;
  }

  return [
    {
      title: coverData.title,
      subtitle: coverData.subtitle || 'Comprehensive Overview, Strategic Insights & Roadmap',
      kicker: theme.domainKicker,
      presenter: presenterName,
      pills: finalPills,
      coverIconType: theme.icon,
      items: [],
      bullets: coverData.subtitle ? [coverData.subtitle] : [],
      notes: coverData.speakerNotes,
      isCover: true,
      theme,
    },
    ...contentSlides,
  ];
}

// ── Pagination for Word/DOCX ──────────────────────────────────────────────
function estimateBlockHeight(block: MarkdownBlock): number {
  switch (block.type) {
    case 'h1':
      return 62;
    case 'h2':
      return 48;
    case 'h3':
      return 36;
    case 'bullet-list':
    case 'ordered-list':
      return Math.max(26, block.items.length * 24);
    case 'table':
      return 42 + block.data.rows.length * 28;
    case 'callout':
      return Math.max(56, Math.ceil(block.text.length / 85) * 22 + 28);
    case 'code-block':
      return 46 + (block.code.split('\n').length || 1) * 18;
    case 'divider':
      return 24;
    case 'paragraph':
    default:
      return 'text' in block && typeof (block as any).text === 'string'
        ? Math.max(24, Math.ceil((block as any).text.length / 85) * 20)
        : 26;
  }
}

function paginateDocumentBlocks(blocks: MarkdownBlock[]): MarkdownBlock[][] {
  const pages: MarkdownBlock[][] = [];
  let currentPage: MarkdownBlock[] = [];
  let currentHeight = 0;

  const PAGE1_BUDGET = 700;
  const RUNNING_BUDGET = 860;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const budget = pages.length === 0 ? PAGE1_BUDGET : RUNNING_BUDGET;
    const h = estimateBlockHeight(block);

    if (currentHeight + h > budget && currentPage.length > 0) {
      pages.push(currentPage);
      currentPage = [block];
      currentHeight = h;
    } else {
      currentPage.push(block);
      currentHeight += h;
    }
  }

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return pages.length > 0 ? pages : [[]];
}

function renderInlineContent(text: string, isDark: boolean): React.ReactNode {
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  const parts = text.split(regex);

  return parts.map((part, idx) => {
    if (!part) return null;
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className={`font-semibold ${isDark ? 'text-white' : 'text-zinc-950'}`}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={idx} className={`italic ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={idx}
          className={`px-1.5 py-0.5 rounded text-xs font-mono ${
            isDark ? 'bg-zinc-800 text-blue-400' : 'bg-zinc-100 text-blue-600'
          }`}
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

// ── Main Component ────────────────────────────────────────────────────────
export default function DocumentLivePreviewModal({
  doc,
  isOpen,
  onClose,
  onMinimize,
  theme = 'dark',
  inline = false,
}: DocumentLivePreviewModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(46);
  const [isZoomMenuOpen, setIsZoomMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isDark = theme === 'dark';
  const containerRef = useRef<HTMLDivElement | null>(null);

  const isPptx = doc?.format === 'pptx';

  const initialThemeId = useMemo(() => {
    if (!isPptx || !doc?.content) return 'executive-general' as PresentationThemeStyle;
    return detectPresentationTheme(doc.title + ' ' + doc.content.slice(0, 1000)).id;
  }, [isPptx, doc?.content, doc?.title]);

  const [activeThemeId, setActiveThemeId] = useState<PresentationThemeStyle>(initialThemeId);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  useEffect(() => {
    setActiveThemeId(initialThemeId);
  }, [initialThemeId]);

  const slides = isPptx && doc?.content ? parseSlides(doc.content, doc.title, activeThemeId) : [];

  const parsedDoc = useMemo(() => {
    if (isPptx || !doc?.content) return null;
    return parseMarkdownDocument(doc.content, doc.title);
  }, [isPptx, doc?.content, doc?.title]);

  const safeTitle = (doc?.title || (isPptx ? 'presentation' : 'document')).replace(/[^a-z0-9_-]/gi, '_');

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    },
    [isOpen, isFullscreen, onClose]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen || !doc) return null;

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleDownload = async () => {
    if (isExporting) return;
    setIsExporting(true);

    try {
      if (isPptx) {
        toast.info('Generating PowerPoint (.pptx) file…');
        const blob = await exportToPptx(doc.title, doc.content, activeThemeId);
        downloadFile(blob, `${safeTitle}.pptx`);
        toast.success(`Downloaded ${safeTitle}.pptx`);
      } else {
        toast.info('Generating Word (.docx) file…');
        const blob = await exportToDocx(doc.title, doc.content);
        downloadFile(blob, `${safeTitle}.docx`);
        toast.success(`Downloaded ${safeTitle}.docx`);
      }
    } catch (err: any) {
      toast.error(`Download failed: ${err?.message || 'Error exporting'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleGoogleDrive = async () => {
    if (isExporting) return;
    setIsExporting(true);

    try {
      if (isPptx) {
        toast.info('Preparing presentation for Google Drive / Google Slides…');
        const blob = await exportToPptx(doc.title, doc.content, activeThemeId);
        downloadFile(blob, `${safeTitle}.pptx`);
        window.open('https://slides.new', '_blank');
        toast.success('Downloaded .pptx! Opening Google Slides so you can import or drag-and-drop.', {
          duration: 5000,
        });
      } else {
        toast.info('Preparing document for Google Drive / Google Docs…');
        const blob = await exportToDocx(doc.title, doc.content);
        downloadFile(blob, `${safeTitle}.docx`);
        window.open('https://docs.new', '_blank');
        toast.success('Downloaded .docx! Opening Google Docs in a new tab.', {
          duration: 5000,
        });
      }
    } catch (err: any) {
      toast.error(`Failed to export for Google Drive: ${err?.message || 'Export error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Compute slide width style based on zoom level
  const getSlideWidthStyle = () => {
    if (zoomLevel === 0) return { width: '100%', maxWidth: '1020px' };
    const baseWidth = 1100;
    const computedPx = Math.round((zoomLevel / 50) * baseWidth * 0.45);
    return { width: '100%', maxWidth: `${Math.max(620, Math.min(computedPx, 1380))}px` };
  };

  return (
    <div
      className={
        inline && !isFullscreen
          ? 'flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden'
          : `fixed inset-0 z-[80] flex items-center justify-center animate-in fade-in duration-200 ${
              isFullscreen ? 'p-0 w-screen h-screen' : 'bg-black/85 backdrop-blur-md p-2 sm:p-5'
            }`
      }
    >
      {/* Outer Shell */}
      <div
        ref={containerRef}
        className={`relative flex min-h-0 min-w-0 flex-col overflow-hidden ${
          inline && !isFullscreen
            ? 'h-full w-full max-w-none'
            : isFullscreen
              ? 'h-screen w-screen rounded-none border-0'
              : 'h-[92vh] max-h-[960px] w-full max-w-6xl rounded-2xl border shadow-2xl'
        } ${
          isDark
            ? 'bg-[#18181b] border-zinc-800 text-zinc-100'
            : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* ── Top Header Bar (Exact match to reference) ── */}
        <header
          className={`h-13 shrink-0 flex items-center justify-between px-4 sm:px-6 border-b transition-colors select-none ${
            isDark
              ? 'bg-[#121214] border-zinc-800/80 text-zinc-100'
              : 'bg-white border-zinc-200 text-zinc-900'
          }`}
        >
          {/* Left: Document Title + Format */}
          <div className="flex items-center gap-2 min-w-0 pr-4">
            <h1
              className="text-sm sm:text-[15px] font-medium truncate tracking-tight"
              title={doc.title}
            >
              {doc.title || 'Untitled Presentation'}
            </h1>
            <span className={`text-sm shrink-0 font-normal ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              · {isPptx ? 'PPTX' : 'DOCX'}
            </span>
          </div>

          {/* Right Toolbar Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Theme Selector for PPTX */}
            {isPptx && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsThemeMenuOpen((o) => !o)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                    isDark
                      ? 'border-white/10 bg-zinc-800/60 text-zinc-200 hover:text-white hover:bg-zinc-800'
                      : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100'
                  }`}
                  title="Change presentation theme"
                  aria-label="Change presentation theme"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/20 shadow-xs"
                    style={{
                      background: `linear-gradient(135deg, ${PRESENTATION_THEMES[activeThemeId].coverBgGradient[0]}, ${PRESENTATION_THEMES[activeThemeId].coverBgGradient[1]})`,
                    }}
                  />
                  <span className="max-w-[110px] truncate hidden sm:inline">
                    {PRESENTATION_THEMES[activeThemeId].name.split('(')[0].trim()}
                  </span>
                  <ChevronDown size={13} className="opacity-70" />
                </button>

                {isThemeMenuOpen && (
                  <div
                    className={`absolute right-0 top-full mt-1.5 w-60 rounded-xl border py-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100 ${
                      isDark
                        ? 'bg-[#1c1c20] border-zinc-700 text-zinc-200'
                        : 'bg-white border-zinc-200 text-zinc-800'
                    }`}
                  >
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Presentation Theme
                    </div>
                    {(Object.values(PRESENTATION_THEMES) as PresentationTheme[]).map((thm) => (
                      <button
                        key={thm.id}
                        type="button"
                        onClick={() => {
                          setActiveThemeId(thm.id);
                          setIsThemeMenuOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-xs transition-colors flex items-center justify-between cursor-pointer ${
                          activeThemeId === thm.id
                            ? isDark
                              ? 'bg-zinc-800 text-white font-semibold'
                              : 'bg-zinc-100 text-zinc-950 font-semibold'
                            : isDark
                              ? 'hover:bg-zinc-800/60'
                              : 'hover:bg-zinc-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-4 h-4 rounded-full shrink-0 border border-white/30 shadow-xs"
                            style={{
                              background: `linear-gradient(135deg, ${thm.coverBgGradient[0]}, ${thm.coverBgGradient[1]})`,
                            }}
                          />
                          <span className="truncate">{thm.name}</span>
                        </div>
                        {activeThemeId === thm.id && (
                          <span className="text-[11px] text-amber-500 font-bold shrink-0">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Zoom dropdown (e.g. "46% ⌵") */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsZoomMenuOpen((o) => !o)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  isDark
                    ? 'text-zinc-300 hover:text-white hover:bg-zinc-800/80'
                    : 'text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100'
                }`}
                title="Adjust view scale"
                aria-label="Adjust zoom"
              >
                <span>{zoomLevel === 0 ? 'Fit' : `${zoomLevel}%`}</span>
                <ChevronDown size={14} className="opacity-70" />
              </button>

              {isZoomMenuOpen && (
                <div
                  className={`absolute right-0 top-full mt-1.5 w-36 rounded-xl border py-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100 ${
                    isDark
                      ? 'bg-[#1e1e22] border-zinc-700 text-zinc-200'
                      : 'bg-white border-zinc-200 text-zinc-800'
                  }`}
                >
                  {[
                    { label: 'Fit to screen', val: 0 },
                    { label: '46% (Default)', val: 46 },
                    { label: '50%', val: 50 },
                    { label: '75%', val: 75 },
                    { label: '100%', val: 100 },
                    { label: '125%', val: 125 },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => {
                        setZoomLevel(opt.val);
                        setIsZoomMenuOpen(false);
                      }}
                      className={`w-full px-3 py-1.5 text-left text-xs transition-colors flex items-center justify-between cursor-pointer ${
                        zoomLevel === opt.val
                          ? isDark
                            ? 'bg-zinc-800 text-white font-semibold'
                            : 'bg-zinc-100 text-zinc-950 font-semibold'
                          : isDark
                            ? 'hover:bg-zinc-800/60'
                            : 'hover:bg-zinc-50'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {zoomLevel === opt.val && <span className="text-[10px] text-amber-500 font-bold">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Google Drive / Slides Button */}
            <button
              type="button"
              onClick={handleGoogleDrive}
              disabled={isExporting}
              className={`p-1.5 sm:p-2 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                isDark
                  ? 'hover:bg-zinc-800/80 active:bg-zinc-700'
                  : 'hover:bg-zinc-100 active:bg-zinc-200'
              }`}
              title={isPptx ? 'Save to Google Drive / Open in Google Slides' : 'Save to Google Drive / Open in Google Docs'}
              aria-label="Google Drive"
            >
              <GoogleDriveLogo className="w-[18px] h-[18px]" />
            </button>

            {/* Download Icon */}
            <button
              type="button"
              onClick={handleDownload}
              disabled={isExporting}
              className={`p-1.5 sm:p-2 rounded-lg transition-colors cursor-pointer ${
                isDark
                  ? 'text-zinc-300 hover:text-white hover:bg-zinc-800/80'
                  : 'text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100'
              }`}
              title={isPptx ? 'Download PowerPoint (.pptx)' : 'Download Word Document (.docx)'}
              aria-label="Download"
            >
              {isExporting ? <Loader2 size={18} className="animate-spin text-amber-500" /> : <Download size={18} />}
            </button>

            {/* Fullscreen Expand Icon */}
            <button
              type="button"
              onClick={() => setIsFullscreen((f) => !f)}
              className={`p-1.5 sm:p-2 rounded-lg transition-colors cursor-pointer ${
                isDark
                  ? 'text-zinc-300 hover:text-white hover:bg-zinc-800/80'
                  : 'text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100'
              }`}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              aria-label="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>

            {/* Close 'X' Icon */}
            <button
              type="button"
              onClick={onClose}
              className={`p-1.5 sm:p-2 rounded-lg transition-colors cursor-pointer ${
                isDark
                  ? 'text-zinc-400 hover:text-white hover:bg-zinc-800/80'
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
              title="Close Preview"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* ── Main Preview Canvas Area ── */}
        <div
          className={`flex-1 overflow-y-auto overflow-x-hidden min-h-0 transition-colors ${
            isDark ? 'bg-[#212124]' : 'bg-[#ebecee]'
          }`}
        >
          {isPptx ? (
            /* ── Presentation Vertical Scroll View ── */
            <div className="flex flex-col items-center py-6 sm:py-8 px-3 sm:px-6 gap-6 sm:gap-8">
              {slides.map((slide, slideIdx) => {
                const totalCount = slides.length;
                const pageLabel = `Page ${slideIdx + 1} / ${totalCount}`;

                if (slide.isCover) {
                  // Dynamic title sizing to prevent any text clipping
                  const titleLength = slide.title.length;
                  const titleClass =
                    titleLength > 48
                      ? 'text-lg sm:text-2xl lg:text-[26px]'
                      : titleLength > 32
                      ? 'text-xl sm:text-2xl lg:text-[30px]'
                      : 'text-2xl sm:text-3xl lg:text-[36px]';

                  const theme = slide.theme;
                  const coverGrad = theme ? `linear-gradient(135deg, ${theme.coverBgGradient[0]} 0%, ${theme.coverBgGradient[1]} 100%)` : 'linear-gradient(135deg, #173e33 0%, #13392e 100%)';
                  const kickerColor = theme ? theme.coverKickerColor : '#a3c4b8';
                  const badgeFill = theme ? theme.coverBadgeFill : '#245446';
                  const subtitleColor = theme ? theme.coverSubtitleColor : '#d4ece3';
                  const presenterColor = theme ? theme.coverPresenterColor : '#8fb8a8';
                  const pillBg = theme ? theme.coverPillBg : '#224e41';
                  const pillBorder = theme ? theme.coverPillBorder : 'rgba(255, 255, 255, 0.1)';
                  const pillText = theme ? theme.coverPillText : '#d4ece3';

                  return (
                    <article
                      key={slideIdx}
                      style={getSlideWidthStyle()}
                      className="relative min-h-[350px] sm:min-h-[400px] lg:min-h-[440px] aspect-[16/9] overflow-hidden rounded-xl sm:rounded-2xl shadow-xl flex flex-col justify-between p-5 sm:p-7 lg:p-8 select-text transition-all border border-white/10"
                    >
                      {/* Dynamic theme cover gradient */}
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{ background: coverGrad }}
                      />

                      {/* Header Line inside cover (shrink-0 prevents compression) */}
                      <div className="relative z-10 flex items-center justify-between shrink-0 mb-1">
                        <span
                          className="text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase"
                          style={{ color: kickerColor }}
                        >
                          {slide.kicker}
                        </span>
                        <div
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-white/15 flex items-center justify-center text-white shadow-sm shrink-0"
                          style={{ backgroundColor: badgeFill }}
                        >
                          {renderSlideItemIcon(slide.coverIconType || 'layers', 'w-4 h-4 sm:w-4.5 sm:h-4.5')}
                        </div>
                      </div>

                      {/* Center Hero Title & Subtitle (flex-1 min-h-0 with proportional scaling) */}
                      <div className="relative z-10 flex-1 min-h-0 flex flex-col justify-center py-1">
                        <h2 className={`${titleClass} font-serif font-bold tracking-tight text-white leading-[1.2] max-w-4xl`}>
                          {slide.title}
                        </h2>
                        {slide.subtitle && (
                          <p
                            className="italic text-xs sm:text-sm lg:text-[14px] font-normal mt-1.5 sm:mt-2 leading-relaxed max-w-3xl opacity-90 line-clamp-2"
                            style={{ color: subtitleColor }}
                          >
                            {slide.subtitle}
                          </p>
                        )}
                        <p
                          className="text-[10px] sm:text-xs font-medium mt-1.5 sm:mt-2"
                          style={{ color: presenterColor }}
                        >
                          {slide.presenter}
                        </p>
                      </div>

                      {/* Bottom Feature Pills Row + Page Indicator (shrink-0 ensures NEVER clipped) */}
                      <div className="relative z-10 flex items-center justify-between gap-2 pt-2 shrink-0 border-t border-white/10 mt-auto">
                        {/* Feature Pills (single row, no wrapping, truncates gracefully) */}
                        <div className="flex items-center gap-1.5 sm:gap-2 overflow-hidden flex-1 min-w-0 pr-2">
                          {(slide.pills || []).map((pill, pi) => {
                            const icon =
                              pi === 0 ? <Leaf className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> :
                              pi === 1 ? <Cpu className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> :
                              pi === 2 ? <Sun className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> :
                              <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />;

                            return (
                              <div
                                key={pi}
                                className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full border text-[10px] sm:text-[11px] font-semibold shadow-xs shrink min-w-0 truncate"
                                style={{ backgroundColor: pillBg, borderColor: pillBorder, color: pillText }}
                              >
                                <span className="w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-white">
                                  {icon}
                                </span>
                                <span className="truncate max-w-[120px] sm:max-w-[150px]">{pill}</span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Page Pill */}
                        <span className="shrink-0 rounded-md bg-black/60 px-2.5 py-1 text-[10px] sm:text-xs font-mono font-medium text-white backdrop-blur-md">
                          {pageLabel}
                        </span>
                      </div>
                    </article>
                  );
                }

                // ── Slide 2+: Clean Theme Bento Cards (Never Clipped) ──
                const contentTheme = slide.theme;
                const contentKicker = contentTheme?.contentKickerColor ? `#${contentTheme.contentKickerColor}` : '#b45309';
                const itemBadgeFill = contentTheme?.contentItemBadgeFill ? `#${contentTheme.contentItemBadgeFill}` : '#173e33';
                const takeawayCardBg = contentTheme?.takeawayCardBg ? `#${contentTheme.takeawayCardBg}` : '#f4f7f1';
                const takeawayBorder = contentTheme?.takeawayCardBorder ? `#${contentTheme.takeawayCardBorder}` : '#e2e8f0';
                const takeawayBadge = contentTheme?.takeawayBadgeFill ? `#${contentTheme.takeawayBadgeFill}` : '#d97706';
                const takeawayLabel = contentTheme?.takeawayLabelColor ? `#${contentTheme.takeawayLabelColor}` : '#92400e';

                return (
                  <article
                    key={slideIdx}
                    style={getSlideWidthStyle()}
                    className="relative min-h-[350px] sm:min-h-[400px] lg:min-h-[440px] aspect-[16/9] overflow-hidden rounded-xl sm:rounded-2xl bg-white text-zinc-900 border border-zinc-200/90 shadow-xl flex flex-col justify-between p-5 sm:p-7 lg:p-8 select-text transition-all"
                  >
                    {/* Top Slide Header (shrink-0) */}
                    <div className="shrink-0 mb-1">
                      <span
                        className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase"
                        style={{ color: contentKicker }}
                      >
                        {slide.kicker}
                      </span>
                      <h2 className="text-base sm:text-lg lg:text-[22px] font-serif font-bold text-zinc-900 tracking-tight mt-0.5 line-clamp-1">
                        {slide.title}
                      </h2>
                    </div>

                    {/* Main Bento Body (2 Columns - flex-1 min-h-0 with responsive spacing) */}
                    <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-stretch py-1">
                      {/* Left Column: Bullet Cards */}
                      <div className="md:col-span-7 flex flex-col justify-center space-y-2.5 sm:space-y-3">
                        {(slide.items && slide.items.length > 0
                          ? slide.items
                          : slide.bullets.slice(0, 2).map((b, bi) => ({
                              title: b.slice(0, 32),
                              desc: b,
                              iconType: pickSlideIcon(b, bi),
                            }))
                        ).map((item, itemIdx) => (
                          <div key={itemIdx} className="flex items-start gap-3">
                            <div
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5"
                              style={{ backgroundColor: itemBadgeFill }}
                            >
                              {renderSlideItemIcon(item.iconType, 'w-3.5 h-3.5 sm:w-4 sm:h-4')}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-xs sm:text-[13px] font-bold text-zinc-900 leading-snug line-clamp-1">
                                {item.title}
                              </h3>
                              <p className="text-[10px] sm:text-[11px] text-zinc-600 mt-0.5 leading-snug line-clamp-2">
                                {item.desc.replace(/\*\*/g, '')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Right Column: Key Takeaway Bento Box */}
                      <div className="md:col-span-5 flex flex-col justify-center">
                        <div
                          className="rounded-xl sm:rounded-2xl p-3.5 sm:p-4.5 border shadow-xs flex flex-col justify-center"
                          style={{ backgroundColor: takeawayCardBg, borderColor: takeawayBorder }}
                        >
                          <div
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full text-white flex items-center justify-center shadow-xs shrink-0"
                            style={{ backgroundColor: takeawayBadge }}
                          >
                            <Zap className="w-3.5 h-3.5 fill-white" />
                          </div>
                          <span
                            className="text-[9px] sm:text-[10px] font-bold tracking-[0.18em] uppercase mt-2"
                            style={{ color: takeawayLabel }}
                          >
                            KEY TAKEAWAY
                          </span>
                          <p className="italic font-serif text-[11px] sm:text-xs leading-normal text-zinc-800 font-medium mt-1 line-clamp-4">
                            {slide.takeaway || slide.bullets[slide.bullets.length - 1] || 'Strategic alignment and implementation.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Page Indicator (shrink-0) */}
                    <div className="shrink-0 flex items-center justify-end pt-1">
                      <span className="rounded-md bg-black/75 px-2.5 py-1 text-[10px] sm:text-xs font-mono font-medium text-white">
                        {pageLabel}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            /* ── Paginated Word / DOCX Reader ── */
            <div className="flex justify-center py-6 px-4">
              {parsedDoc && (() => {
                const pages = paginateDocumentBlocks(parsedDoc.blocks);
                const isInvoice = parsedDoc.template === 'invoice';
                const isAcademic = parsedDoc.template === 'academic';
                const isAssignment = parsedDoc.template === 'assignment';

                const pageBg = isInvoice ? '#f8faff' : '#ffffff';
                const pageFont = isInvoice
                  ? "'Calibri', 'Segoe UI', -apple-system, sans-serif"
                  : "'Georgia', 'Cambria', 'Times New Roman', serif";

                const docScale = zoomLevel === 0 ? 50 : Math.min(100, zoomLevel);
                const pageWidth = Math.round(500 + (docScale / 100) * (816 - 500));
                const pageMinHeight = Math.round(pageWidth * 1.414);
                const horizontalPadding = Math.round(44 + (docScale / 100) * (64 - 44));
                const verticalPadding = Math.round(48 + (docScale / 100) * (64 - 48));

                return (
                  <div className="flex flex-col items-center gap-6 pb-8">
                    {pages.map((pageBlocks, pageIdx) => (
                      <div
                        key={pageIdx}
                        style={{
                          width: `${pageWidth}px`,
                          minHeight: `${pageMinHeight}px`,
                          background: pageBg,
                          padding: `${verticalPadding}px ${horizontalPadding}px`,
                          boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
                          color: '#1e293b',
                          fontFamily: pageFont,
                          boxSizing: 'border-box',
                          display: 'flex',
                          flexDirection: 'column',
                          borderRadius: '4px',
                        }}
                      >
                        {/* Page Header */}
                        {pageIdx > 0 && (
                          <div
                            style={{
                              fontSize: '10px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.08em',
                              color: '#94a3b8',
                              borderBottom: '1px solid #e2e8f0',
                              paddingBottom: '8px',
                              marginBottom: '20px',
                              display: 'flex',
                              justifyContent: 'space-between',
                            }}
                          >
                            <span>{parsedDoc.title}</span>
                            <span>Page {pageIdx + 1}</span>
                          </div>
                        )}

                        {/* Page Content */}
                        <div style={{ flex: '1 0 auto' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {pageBlocks.map((block, blockIdx) => {
                              if (block.type === 'h1') {
                                return (
                                  <h1 key={blockIdx} style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0 4px', color: '#0f172a' }}>
                                    {block.text}
                                  </h1>
                                );
                              }
                              if (block.type === 'h2') {
                                return (
                                  <h2 key={blockIdx} style={{ fontSize: '18px', fontWeight: 600, margin: '14px 0 2px', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                                    {block.text}
                                  </h2>
                                );
                              }
                              if (block.type === 'h3') {
                                return (
                                  <h3 key={blockIdx} style={{ fontSize: '15px', fontWeight: 600, margin: '8px 0 2px', color: '#1e293b' }}>
                                    {block.text}
                                  </h3>
                                );
                              }
                              if (block.type === 'bullet-list') {
                                return (
                                  <ul key={blockIdx} style={{ margin: '4px 0', paddingLeft: '20px', listStyleType: 'disc' }}>
                                    {block.items.map((item, ii) => (
                                      <li key={ii} style={{ fontSize: '13px', lineHeight: 1.6, color: '#1e293b' }}>
                                        {renderInlineContent(item, false)}
                                      </li>
                                    ))}
                                  </ul>
                                );
                              }
                              if (block.type === 'ordered-list') {
                                return (
                                  <ol key={blockIdx} style={{ margin: '4px 0', paddingLeft: '20px', listStyleType: 'decimal' }}>
                                    {block.items.map((item, ii) => (
                                      <li key={ii} style={{ fontSize: '13px', lineHeight: 1.6, color: '#1e293b' }}>
                                        {renderInlineContent(item, false)}
                                      </li>
                                    ))}
                                  </ol>
                                );
                              }
                              if (block.type === 'callout') {
                                return (
                                  <div key={blockIdx} style={{ margin: '8px 0', padding: '12px 16px', background: '#f0f9ff', borderLeft: '4px solid #0284c7', borderRadius: '4px', fontSize: '12.5px', color: '#0c4a6e', lineHeight: 1.6 }}>
                                    {block.text}
                                  </div>
                                );
                              }
                              if (block.type === 'paragraph') {
                                return (
                                  <p key={blockIdx} style={{ color: '#1e293b', margin: '0', lineHeight: 1.7, fontSize: '13px', fontFamily: pageFont, textAlign: isAcademic ? 'justify' : 'left' }}>
                                    {renderInlineContent(block.text, false)}
                                  </p>
                                );
                              }
                              return null;
                            })}
                          </div>
                        </div>

                        {/* Page Footer */}
                        <div
                          style={{
                            marginTop: 'auto',
                            paddingTop: '16px',
                            borderTop: '1px solid #e2e8f0',
                            display: 'flex',
                            justifyContent: isAssignment ? 'center' : 'space-between',
                            alignItems: 'center',
                            fontSize: '11px',
                            color: '#64748b',
                            flexShrink: 0,
                          }}
                        >
                          {!isAssignment && <span>{parsedDoc.title}</span>}
                          <span style={{ fontWeight: 600 }}>Page {pageIdx + 1} of {pages.length}</span>
                          {!isAssignment && <span>{parsedDoc.metadata.date}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
