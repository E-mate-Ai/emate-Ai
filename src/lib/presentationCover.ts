function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, (character) => {
    const entities: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      '"': '&quot;',
      "'": '&apos;',
    };
    return entities[character] || character;
  });
}

export type PresentationThemeStyle =
  | 'ai-tech'
  | 'finance-business'
  | 'medical-health'
  | 'creative-marketing'
  | 'executive-general'
  | 'crimson-amber';

export interface PresentationTheme {
  id: PresentationThemeStyle;
  name: string;
  domainKicker: string;
  icon: string;
  coverBgGradient: [string, string];
  coverBgHex: string;
  coverKickerColor: string;
  coverBadgeFill: string;
  coverSubtitleColor: string;
  coverPresenterColor: string;
  coverPillBg: string;
  coverPillBorder: string;
  coverPillText: string;
  contentBgHex: string;
  contentKickerColor: string;
  contentItemBadgeFill: string;
  takeawayCardBg: string;
  takeawayCardBorder: string;
  takeawayBadgeFill: string;
  takeawayLabelColor: string;
}

export const PRESENTATION_THEMES: Record<PresentationThemeStyle, PresentationTheme> = {
  'ai-tech': {
    id: 'ai-tech',
    name: 'Obsidian Cyan (AI & Tech)',
    domainKicker: 'COMPUTER SCIENCE • ARTIFICIAL INTELLIGENCE',
    icon: 'cpu',
    coverBgGradient: ['#090d16', '#030712'],
    coverBgHex: '090D16',
    coverKickerColor: '#38bdf8',
    coverBadgeFill: '#1e293b',
    coverSubtitleColor: '#94a3b8',
    coverPresenterColor: '#64748b',
    coverPillBg: '#131d31',
    coverPillBorder: 'rgba(56, 189, 248, 0.25)',
    coverPillText: '#7dd3fc',
    contentBgHex: 'FFFFFF',
    contentKickerColor: '0284C7',
    contentItemBadgeFill: '0F172A',
    takeawayCardBg: 'F0F7FF',
    takeawayCardBorder: 'BAE6FD',
    takeawayBadgeFill: '2563EB',
    takeawayLabelColor: '1D4ED8',
  },
  'finance-business': {
    id: 'finance-business',
    name: 'Emerald Mint (Finance & Green)',
    domainKicker: 'ECONOMICS • FINANCIAL SECTORS',
    icon: 'landmark',
    coverBgGradient: ['#173e33', '#112f27'],
    coverBgHex: '173E33',
    coverKickerColor: '#a3c4b8',
    coverBadgeFill: '#245446',
    coverSubtitleColor: '#d4ece3',
    coverPresenterColor: '#8fb8a8',
    coverPillBg: '#224e41',
    coverPillBorder: 'rgba(255, 255, 255, 0.1)',
    coverPillText: '#d4ece3',
    contentBgHex: 'FFFFFF',
    contentKickerColor: 'B45309',
    contentItemBadgeFill: '173E33',
    takeawayCardBg: 'F4F7F1',
    takeawayCardBorder: 'E2E8F0',
    takeawayBadgeFill: 'D97706',
    takeawayLabelColor: '92400E',
  },
  'executive-general': {
    id: 'executive-general',
    name: 'Midnight Cobalt (Executive Strategy)',
    domainKicker: 'EXECUTIVE STRATEGY • CORPORATE ADVISORY',
    icon: 'chart',
    coverBgGradient: ['#0f172a', '#020617'],
    coverBgHex: '0F172A',
    coverKickerColor: '#93c5fd',
    coverBadgeFill: '#1e293b',
    coverSubtitleColor: '#cbd5e1',
    coverPresenterColor: '#94a3b8',
    coverPillBg: '#1e293b',
    coverPillBorder: 'rgba(147, 197, 253, 0.25)',
    coverPillText: '#bae6fd',
    contentBgHex: 'FFFFFF',
    contentKickerColor: '2563EB',
    contentItemBadgeFill: '0F172A',
    takeawayCardBg: 'F8FAFC',
    takeawayCardBorder: 'E2E8F0',
    takeawayBadgeFill: '3B82F6',
    takeawayLabelColor: '1D4ED8',
  },
  'medical-health': {
    id: 'medical-health',
    name: 'Ocean Teal (Clinical & Health)',
    domainKicker: 'HEALTH SCIENCES • CLINICAL RESEARCH',
    icon: 'sparkles',
    coverBgGradient: ['#063940', '#022429'],
    coverBgHex: '063940',
    coverKickerColor: '#5eead4',
    coverBadgeFill: '#0c5660',
    coverSubtitleColor: '#ccfbf1',
    coverPresenterColor: '#5eead4',
    coverPillBg: '#0a4e57',
    coverPillBorder: 'rgba(94, 234, 212, 0.25)',
    coverPillText: '#99f6e4',
    contentBgHex: 'FFFFFF',
    contentKickerColor: '0D9488',
    contentItemBadgeFill: '063940',
    takeawayCardBg: 'F0FDFA',
    takeawayCardBorder: '99F6E4',
    takeawayBadgeFill: '0F766E',
    takeawayLabelColor: '115E59',
  },
  'creative-marketing': {
    id: 'creative-marketing',
    name: 'Royal Plum (Brand & Creative)',
    domainKicker: 'CREATIVE STRATEGY • BRAND & MEDIA',
    icon: 'layers',
    coverBgGradient: ['#24123a', '#170928'],
    coverBgHex: '24123A',
    coverKickerColor: '#e879f9',
    coverBadgeFill: '#3b1f5c',
    coverSubtitleColor: '#fae8ff',
    coverPresenterColor: '#d8b4fe',
    coverPillBg: '#381958',
    coverPillBorder: 'rgba(232, 121, 249, 0.25)',
    coverPillText: '#f0abfc',
    contentBgHex: 'FFFFFF',
    contentKickerColor: '9333EA',
    contentItemBadgeFill: '24123A',
    takeawayCardBg: 'FDF4FF',
    takeawayCardBorder: 'F0ABFC',
    takeawayBadgeFill: 'C026D3',
    takeawayLabelColor: '86198F',
  },
  'crimson-amber': {
    id: 'crimson-amber',
    name: 'Terracotta Amber (Humanities & Law)',
    domainKicker: 'HUMANITIES & SOCIAL SCIENCES • ACADEMIC STUDY',
    icon: 'landmark',
    coverBgGradient: ['#2e1518', '#1c0b0d'],
    coverBgHex: '2E1518',
    coverKickerColor: '#fbbf24',
    coverBadgeFill: '#4a2024',
    coverSubtitleColor: '#fef3c7',
    coverPresenterColor: '#fca5a5',
    coverPillBg: '#3d1c20',
    coverPillBorder: 'rgba(251, 191, 36, 0.25)',
    coverPillText: '#fde68a',
    contentBgHex: 'FFFFFF',
    contentKickerColor: 'DC2626',
    contentItemBadgeFill: '2E1518',
    takeawayCardBg: 'FFFBEB',
    takeawayCardBorder: 'FDE68A',
    takeawayBadgeFill: 'D97706',
    takeawayLabelColor: '92400E',
  },
};

export function detectPresentationTheme(text: string, preferredThemeId?: string): PresentationTheme {
  // 1. Explicit user selection or override
  if (preferredThemeId && preferredThemeId in PRESENTATION_THEMES) {
    return PRESENTATION_THEMES[preferredThemeId as PresentationThemeStyle];
  }

  // 2. Embedded markdown theme tag: <!-- THEME: id -->
  const tagMatch = text.match(/<!--\s*THEME:\s*([a-z-]+)\s*-->/i);
  if (tagMatch && tagMatch[1] in PRESENTATION_THEMES) {
    return PRESENTATION_THEMES[tagMatch[1] as PresentationThemeStyle];
  }

  const clean = text.toLowerCase();

  // 3. AI, Tech, Computer Science (Obsidian Cyan)
  const aiRegex = /\b(ai|artificial intelligence|machine learning|deep learning|neural|nlp|llm|language model|data science|algorithm|python|cyber|cybersecurity|software|hardware|computer|cloud|network|robot|robotics|quantum|adversarial|cryptograph|blockchain|code|coding|devops|fullstack|frontend|backend|tech|technical|transformer|gpt|rag|agentic)\b/i;
  if (aiRegex.test(clean)) {
    return PRESENTATION_THEMES['ai-tech'];
  }

  // 4. Finance, Banking, Economics, Sustainability (Emerald Mint)
  const financeRegex = /\b(bank|banking|financ\w*|monetary|investment|economy|economic\w*|fiscal|capital|stock|stocks|portfolio|trading|green|sustainable|sustainability|climate|renewable\w*|clean energy|esg|fund|fintech|accounting|audit|wealth)\b/i;
  if (financeRegex.test(clean)) {
    return PRESENTATION_THEMES['finance-business'];
  }

  // 5. Medical, Health, Biology (Ocean Teal)
  const medicalRegex = /\b(health|medicine|medical|clinic\w*|biolog\w*|pharma\w*|doctor|patient|psychol\w*|genom\w*|disease\w*|hospital|therapy|vaccin\w*|biotech\w*|cancer|anatom\w*|physiol\w*|nutrition|healthcare|pathology)\b/i;
  if (medicalRegex.test(clean)) {
    return PRESENTATION_THEMES['medical-health'];
  }

  // 6. Creative, Marketing, Design, Arts (Royal Plum)
  const creativeRegex = /\b(marketing|brand\w*|design\w*|creative|media|advertising|art|arts|music|fashion|content creation|social media|storytelling|video production|graphic\w*|cinemat\w*|film|copywriting)\b/i;
  if (creativeRegex.test(clean)) {
    return PRESENTATION_THEMES['creative-marketing'];
  }

  // 7. Humanities, History, Law, Philosophy (Terracotta Amber)
  const humanitiesRegex = /\b(history|histor\w*|law|legal|philosophy|philosoph\w*|literature|literary|politic\w*|justice|education|sociology|sociol\w*|culture|cultural|ethics|ethical|governance|policy|humanities|anthropology)\b/i;
  if (humanitiesRegex.test(clean)) {
    return PRESENTATION_THEMES['crimson-amber'];
  }

  // 8. Executive General Strategy / Corporate Advisory (Midnight Cobalt)
  const execRegex = /\b(strategy|strategic|executive|leadership|management|corporate|consulting|operations|transformation|roadmap|business model|enterprise|advisory)\b/i;
  if (execRegex.test(clean)) {
    return PRESENTATION_THEMES['executive-general'];
  }

  // 9. Deterministic hash fallback: ensure even uncategorized topics don't all look identical
  const allThemeKeys: PresentationThemeStyle[] = [
    'ai-tech',
    'finance-business',
    'executive-general',
    'medical-health',
    'creative-marketing',
    'crimson-amber',
  ];
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  const chosenKey = allThemeKeys[Math.abs(hash) % allThemeKeys.length];
  return PRESENTATION_THEMES[chosenKey];
}

/**
 * Returns a randomized theme across the 6 core presentation palettes.
 */
export function getRandomPresentationTheme(): PresentationTheme {
  const allThemeKeys: PresentationThemeStyle[] = [
    'ai-tech',
    'finance-business',
    'executive-general',
    'medical-health',
    'creative-marketing',
    'crimson-amber',
  ];
  const randomIndex = Math.floor(Math.random() * allThemeKeys.length);
  return PRESENTATION_THEMES[allThemeKeys[randomIndex]];
}

export interface RawPresentationSlide {
  marker: string;
  content: string;
  isTitle: boolean;
}

/**
 * Robustly parses markdown into presentation slides, cleanly handling any
 * slide markers (including hyphens, spaces, and numbers) without dropping content.
 */
export function parsePresentationMarkdown(markdown: string): RawPresentationSlide[] {
  const slideRegex = /(?:^|\n)---\s*SLIDE(?:\s*\d*|\s*:)\s*([^\n]*?)\s*---?\s*(?:\n|$)/gi;
  const matches = [...markdown.matchAll(slideRegex)];

  if (matches.length > 0) {
    const slides: RawPresentationSlide[] = [];
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const rawName = match[1].replace(/---$/, '').trim();
      const startIndex = match.index + match[0].length;
      const endIndex = (i + 1 < matches.length) ? matches[i + 1].index : markdown.length;
      const content = markdown.slice(startIndex, endIndex).trim();
      const isTitle = i === 0 || /title|cover/i.test(rawName);
      slides.push({
        marker: rawName || (isTitle ? 'Title Slide' : `Slide ${i + 1}`),
        content,
        isTitle,
      });
    }
    return slides;
  }

  // Fallback: split by ## headings
  const h2Parts = markdown.split(/(?=^##\s+)/m).filter((p) => p.trim().length > 0);
  if (h2Parts.length > 0) {
    return h2Parts.map((part, idx) => ({
      marker: idx === 0 ? 'Title Slide' : `Slide ${idx + 1}`,
      content: part.trim(),
      isTitle: idx === 0,
    }));
  }

  return [{ marker: 'Title Slide', content: markdown.trim(), isTitle: true }];
}

export interface PresentationCoverData {
  title: string;
  subtitle: string;
  kicker: string;
  speakerNotes?: string;
  category: string;
}

export interface CoverOptions {
  slideCount?: number;
  category?: string;
}

/**
 * Extracts the 1st slide metadata from the generated markdown presentation.
 */
export function extractPresentationCoverData(markdown: string, fallbackTitle?: string): PresentationCoverData {
  let title = (fallbackTitle || '').trim();
  let subtitle = '';
  let speakerNotes: string | undefined = undefined;

  const slides = parsePresentationMarkdown(markdown);
  const titleSlide = slides.find((s) => s.isTitle) || slides[0];
  const firstSlideContent = titleSlide ? titleSlide.content : markdown.slice(0, 1000).trim();

  if (firstSlideContent) {
    const lines = firstSlideContent.split('\n').map((l) => l.trim()).filter(Boolean);

    // 1. Slide heading (# or ##)
    const headingLine = lines.find((l) => /^#{1,3}\s+/.test(l));
    if (headingLine) {
      const parsedHeading = headingLine.replace(/^#{1,3}\s+/, '').trim();
      if (parsedHeading && !/^title\s*slide$/i.test(parsedHeading) && !/^cover$/i.test(parsedHeading)) {
        title = parsedHeading;
      }
    }

    // 2. Speaker notes
    const notesLine = lines.find((l) => /\[?Speaker notes:?/i.test(l));
    if (notesLine) {
      speakerNotes = notesLine.replace(/\[?Speaker notes:?\s*/i, '').replace(/\]$/, '').trim();
    }

    // 3. Subtitle / tagline
    const nonHeadingLines = lines.filter((l) => !/^#{1,3}\s+/.test(l) && !/Speaker notes:/i.test(l) && !/^\*\*Pillars:/i.test(l));
    if (nonHeadingLines.length > 0) {
      const boldCandidate = nonHeadingLines.find((l) => /^\*\*(.*?)\*\*/.test(l));
      if (boldCandidate) {
        subtitle = boldCandidate.replace(/^\*\*(.*?)\*\*\s*[:-]?\s*/, '$1 — ').replace(/\*\*/g, '').trim();
      } else {
        const firstCleanLine = nonHeadingLines[0].replace(/^[-*•]\s+/, '').replace(/\*\*/g, '').trim();
        if (firstCleanLine && firstCleanLine.length > 4) {
          subtitle = firstCleanLine;
        }
      }
    }
  }

  if (!title) {
    title = fallbackTitle || 'Presentation';
  }

  if (!subtitle) {
    subtitle = 'Comprehensive Overview, Strategic Insights & Roadmap';
  }

  return {
    title,
    subtitle,
    kicker: 'TITLE SLIDE',
    speakerNotes,
    category: 'presentation',
  };
}

export function getPresentationSlideCount(markdown: string): number {
  return parsePresentationMarkdown(markdown).length;
}

export function omitModelTitleSlide(markdown: string): string {
  const slides = parsePresentationMarkdown(markdown);
  const contentSlides = slides.filter((s) => !s.isTitle);
  if (contentSlides.length === 0) return markdown;
  return contentSlides.map((s) => `---SLIDE: ${s.marker}---\n${s.content}`).join('\n\n');
}

export function extractPresentationPillars(markdown: string): string[] {
  // 1. Direct **Pillars:** line
  const pillarMatch = markdown.match(/\*\*Pillars:\*\*\s*(.*)$/im);
  if (pillarMatch && pillarMatch[1]) {
    const list = pillarMatch[1]
      .split(/[|,]/)
      .map((p) => p.replace(/\*\*/g, '').replace(/^[-*•]\s+/, '').trim())
      .filter((p) => p.length >= 2 && p.length <= 32);
    if (list.length >= 3) return list.slice(0, 4);
  }

  // 2. Look for Agenda slide items
  const agendaMatch = markdown.match(/---SLIDE:\s*(?:Agenda|Roadmap)[^-\n]*---\s*([\s\S]*?)(?=---SLIDE:|$)/i);
  if (agendaMatch && agendaMatch[1]) {
    const boldLines = agendaMatch[1].match(/\*\*([A-Za-z0-9\s]{3,24})\*\*/g);
    if (boldLines) {
      const items = boldLines
        .map((b) => b.replace(/\*\*/g, '').trim())
        .filter((b) => !/takeaway|agenda|slide|roadmap/i.test(b) && b.length >= 3);
      if (items.length >= 3) return items.slice(0, 4);
    }
  }

  // 3. Fallback to bold words across presentation
  const boldMatches = markdown.match(/\*\*([A-Za-z0-9\s]{3,20})\*\*/g);
  if (boldMatches) {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const b of boldMatches) {
      const clean = b.replace(/\*\*/g, '').trim();
      if (
        clean.length >= 3 &&
        clean.length <= 20 &&
        !seen.has(clean) &&
        !/slide|notes|agenda|title|topic|key takeaway|takeaway|pillars/i.test(clean)
      ) {
        seen.add(clean);
        result.push(clean);
        if (result.length >= 4) break;
      }
    }
    if (result.length >= 3) return result;
  }

  return [];
}

/**
 * Creates an elegant dark slide cover SVG that matches the rest of the dark zinc & amber PPT slides.
 * Replaces the old oversized blue cover with a clean, cohesive design mirroring the presentation deck.
 */
export function createPresentationCoverSvg(
  title: string,
  markdownOrSubtitle?: string,
  options?: CoverOptions
): string {
  const isFullMarkdown = typeof markdownOrSubtitle === 'string' && (markdownOrSubtitle.includes('---SLIDE:') || markdownOrSubtitle.includes('#'));
  const coverData = isFullMarkdown
    ? extractPresentationCoverData(markdownOrSubtitle, title)
    : {
        title: title || 'Presentation',
        subtitle: (markdownOrSubtitle && !markdownOrSubtitle.includes('---SLIDE:')) ? markdownOrSubtitle : 'Comprehensive Overview, Strategic Insights & Roadmap',
        kicker: 'TITLE SLIDE',
        category: 'presentation',
      };

  const finalTitle = (coverData.title || title || 'Presentation').trim();
  const subtitle = (coverData.subtitle || 'Comprehensive Overview, Strategic Insights & Roadmap').trim();
  const slideCount = options?.slideCount || (isFullMarkdown ? getPresentationSlideCount(markdownOrSubtitle) : 8);

  // Dynamic theme detection based on content
  const fullText = (title + ' ' + subtitle + ' ' + (typeof markdownOrSubtitle === 'string' ? markdownOrSubtitle.slice(0, 500) : '')).toLowerCase();
  const theme = detectPresentationTheme(fullText);
  const kicker = theme.domainKicker;

  // Dynamic typography sizing
  let fontSize = 42;
  let maxCharsPerLine = 32;
  if (finalTitle.length > 55) {
    fontSize = 30;
    maxCharsPerLine = 42;
  } else if (finalTitle.length > 34) {
    fontSize = 36;
    maxCharsPerLine = 34;
  }

  // Word-wrap title across lines
  const words = finalTitle.split(/\s+/).filter(Boolean);
  const titleLines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (currentLine && `${currentLine} ${word}`.length > maxCharsPerLine) {
      titleLines.push(currentLine);
      currentLine = word;
      if (titleLines.length >= 3) break;
    } else {
      currentLine = currentLine ? `${currentLine} ${word}` : word;
    }
  }
  if (currentLine && titleLines.length < 3) {
    titleLines.push(currentLine);
  }
  if (titleLines.length === 0) titleLines.push(finalTitle);

  // Word-wrap subtitle
  const subWords = subtitle.split(/\s+/).filter(Boolean);
  const subLines: string[] = [];
  let currentSub = '';
  for (const w of subWords) {
    if (currentSub && `${currentSub} ${w}`.length > 64) {
      subLines.push(currentSub);
      currentSub = w;
      if (subLines.length >= 2) break;
    } else {
      currentSub = currentSub ? `${currentSub} ${w}` : w;
    }
  }
  if (currentSub && subLines.length < 2) subLines.push(currentSub);
  if (subLines.length === 0) subLines.push(subtitle);

  const startY = titleLines.length === 1 ? 260 : titleLines.length === 2 ? 215 : 185;
  const lineSpacing = fontSize * 1.25;

  const titleSvgMarkup = titleLines
    .map((line, idx) => `<tspan x="70" y="${startY + idx * lineSpacing}">${escapeXml(line)}</tspan>`)
    .join('');

  const subStartY = startY + titleLines.length * lineSpacing + 28;

  const subSvgMarkup = subLines
    .map((line, idx) => `<tspan x="70" y="${subStartY + idx * 30}">${escapeXml(line)}</tspan>`)
    .join('');

  // Extract 4 feature pills
  const extractedPills = isFullMarkdown ? extractPresentationPillars(markdownOrSubtitle as string) : [];
  const defaultPills = theme.id === 'ai-tech'
    ? ['Core Concepts', 'Architectures', 'Model Training', 'Evaluation']
    : theme.id === 'finance-business'
    ? ['Financial Stability', 'Central Banking', 'Monetary Policy', 'Systemic Risk']
    : theme.id === 'medical-health'
    ? ['Clinical Evidence', 'Pathophysiology', 'Diagnostics', 'Therapeutics']
    : theme.id === 'creative-marketing'
    ? ['Brand Identity', 'Audience Growth', 'Visual Design', 'Campaign Strategy']
    : ['Strategic Focus', 'Core Pillars', 'Architecture', 'Roadmap'];
  const finalPills = extractedPills.length >= 3 ? extractedPills.slice(0, 4) : defaultPills;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
  <defs>
    <!-- Dynamic Topic-Tailored Presentation Canvas -->
    <linearGradient id="presentationCoverGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${theme.coverBgGradient[0]}" />
      <stop offset="100%" stop-color="${theme.coverBgGradient[1]}" />
    </linearGradient>
  </defs>

  <!-- Slide Canvas Base -->
  <rect width="1200" height="675" rx="16" fill="url(#presentationCoverGrad)" stroke="rgba(255, 255, 255, 0.08)" stroke-width="1.5" />

  <!-- Slide Header Bar -->
  <g transform="translate(70, 56)">
    <text x="0" y="0" fill="${theme.coverKickerColor}" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="700" letter-spacing="2.5">${escapeXml(kicker)}</text>
    <circle cx="1040" cy="-6" r="22" fill="${theme.coverBadgeFill}" stroke="rgba(255, 255, 255, 0.15)" stroke-width="1" />
    <path d="M1030 -10 L1040 -17 L1050 -10 L1050 -7 L1030 -7 Z M1032 -5 L1035 -5 L1035 3 L1032 3 Z M1038 -5 L1042 -5 L1042 3 L1038 3 Z M1045 -5 L1048 -5 L1048 3 L1045 3 Z M1028 5 L1052 5 L1052 7 L1028 7 Z" fill="#ffffff" />
  </g>

  <!-- Hero Title (Matching Preview Serif Design) -->
  <text font-family="Georgia, 'Times New Roman', serif" font-size="${fontSize}" font-weight="700" fill="#ffffff" letter-spacing="-0.3">
    ${titleSvgMarkup}
  </text>

  <!-- Subtitle (Italic Georgia) -->
  <text font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-size="20" font-weight="400" fill="${theme.coverSubtitleColor}" letter-spacing="0.2">
    ${subSvgMarkup}
  </text>

  <!-- Presenter line -->
  <text x="70" y="${subStartY + subLines.length * 30 + 26}" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="500" fill="${theme.coverPresenterColor}">
    Prepared with e-Mate AI Studio
  </text>

  <!-- Feature Pills Row (4 pills) -->
  <g transform="translate(70, 580)">
    <!-- Pill 1 -->
    <rect x="0" y="0" width="195" height="38" rx="19" fill="${theme.coverPillBg}" stroke="${theme.coverPillBorder}" />
    <circle cx="20" cy="19" r="11" fill="rgba(255, 255, 255, 0.1)" />
    <text x="40" y="24" fill="${theme.coverPillText}" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="600">${escapeXml((finalPills[0] || 'Core Concepts').slice(0, 18))}</text>

    <!-- Pill 2 -->
    <rect x="210" y="0" width="195" height="38" rx="19" fill="${theme.coverPillBg}" stroke="${theme.coverPillBorder}" />
    <circle cx="230" cy="19" r="11" fill="rgba(255, 255, 255, 0.1)" />
    <text x="250" y="24" fill="${theme.coverPillText}" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="600">${escapeXml((finalPills[1] || 'Architectures').slice(0, 18))}</text>

    <!-- Pill 3 -->
    <rect x="420" y="0" width="195" height="38" rx="19" fill="${theme.coverPillBg}" stroke="${theme.coverPillBorder}" />
    <circle cx="440" cy="19" r="11" fill="rgba(255, 255, 255, 0.1)" />
    <text x="460" y="24" fill="${theme.coverPillText}" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="600">${escapeXml((finalPills[2] || 'Mechanisms').slice(0, 18))}</text>

    <!-- Pill 4 -->
    <rect x="630" y="0" width="195" height="38" rx="19" fill="${theme.coverPillBg}" stroke="${theme.coverPillBorder}" />
    <circle cx="650" cy="19" r="11" fill="rgba(255, 255, 255, 0.1)" />
    <text x="670" y="24" fill="${theme.coverPillText}" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="600">${escapeXml((finalPills[3] || 'Roadmap').slice(0, 18))}</text>

    <!-- Slide count pill on right -->
    <rect x="960" y="0" width="100" height="38" rx="8" fill="rgba(0, 0, 0, 0.6)" stroke="rgba(255, 255, 255, 0.1)" />
    <text x="1010" y="24" text-anchor="middle" fill="#ffffff" font-family="monospace, sans-serif" font-size="13" font-weight="600">Page 1 / ${slideCount}</text>
  </g>
</svg>`;
}

export interface DocumentCoverData {
  title: string;
  subtitle: string;
  sections: string[];
  wordCount: number;
  estimatedPages: number;
}

/**
 * Extracts key metadata and outline from document markdown for the cover preview.
 */
export function extractDocumentCoverData(markdown: string, fallbackTitle?: string): DocumentCoverData {
  const lines = (markdown || '').split('\n').map((l) => l.trim()).filter(Boolean);
  let title = (fallbackTitle || '').trim();
  let subtitle = '';
  const sections: string[] = [];

  for (const line of lines) {
    if (!title && /^#\s+/.test(line)) {
      title = line.replace(/^#\s+/, '').trim();
    } else if (/^##\s+/.test(line) && sections.length < 3) {
      const sec = line.replace(/^##\s+/, '').replace(/^\d+[\.\)]\s*/, '').trim();
      if (sec && !sections.includes(sec)) sections.push(sec);
    } else if (!subtitle && !line.startsWith('#') && !line.startsWith('-') && !line.startsWith('|') && line.length > 20) {
      subtitle = line.replace(/[*_`]/g, '').trim();
    }
  }

  if (!title) title = fallbackTitle || 'Executive Document';
  if (!subtitle) subtitle = 'Comprehensive architectural breakdown, strategic analysis, and technical implementation specifications.';

  const words = (markdown || '').split(/\s+/).filter(Boolean).length;
  const wordCount = words || 650;
  const estimatedPages = Math.max(1, Math.ceil(wordCount / 420));

  return {
    title,
    subtitle,
    sections,
    wordCount,
    estimatedPages,
  };
}

/**
 * Creates an elegant executive document cover preview SVG matching Word / DOCX styling.
 */
export function createDocumentCoverSvg(
  title: string,
  markdownOrSubtitle?: string,
  options?: { wordCount?: number; estimatedPages?: number }
): string {
  const isFullMarkdown = typeof markdownOrSubtitle === 'string' && (markdownOrSubtitle.includes('#') || markdownOrSubtitle.includes('\n'));
  const coverData = isFullMarkdown
    ? extractDocumentCoverData(markdownOrSubtitle, title)
    : {
        title: title || 'Executive Document',
        subtitle: (markdownOrSubtitle && !markdownOrSubtitle.includes('#')) ? markdownOrSubtitle : 'Comprehensive architectural breakdown, strategic analysis, and technical specifications.',
        sections: ['Executive Summary', 'System Architecture', 'Implementation'],
        wordCount: options?.wordCount || 850,
        estimatedPages: options?.estimatedPages || 3,
      };

  const finalTitle = (coverData.title || title || 'Executive Document').trim();
  const subtitle = (coverData.subtitle || 'Comprehensive analysis and technical specifications.').trim();
  const estimatedPages = options?.estimatedPages || coverData.estimatedPages;
  const wordCount = options?.wordCount || coverData.wordCount;

  // Title wrapping
  let fontSize = 44;
  let maxChars = 30;
  if (finalTitle.length > 50) {
    fontSize = 34;
    maxChars = 40;
  } else if (finalTitle.length > 30) {
    fontSize = 38;
    maxChars = 34;
  }

  const words = finalTitle.split(/\s+/).filter(Boolean);
  const titleLines: string[] = [];
  let curLine = '';
  for (const w of words) {
    if (curLine && `${curLine} ${w}`.length > maxChars) {
      titleLines.push(curLine);
      curLine = w;
      if (titleLines.length >= 3) break;
    } else {
      curLine = curLine ? `${curLine} ${w}` : w;
    }
  }
  if (curLine && titleLines.length < 3) titleLines.push(curLine);
  if (titleLines.length === 0) titleLines.push(finalTitle);

  // Subtitle wrapping
  const subWords = subtitle.split(/\s+/).filter(Boolean);
  const subLines: string[] = [];
  let curSub = '';
  for (const w of subWords) {
    if (curSub && `${curSub} ${w}`.length > 68) {
      subLines.push(curSub);
      curSub = w;
      if (subLines.length >= 2) break;
    } else {
      curSub = curSub ? `${curSub} ${w}` : w;
    }
  }
  if (curSub && subLines.length < 2) subLines.push(curSub);

  const startY = titleLines.length === 1 ? 245 : titleLines.length === 2 ? 215 : 185;
  const lineSpacing = fontSize * 1.22;

  const titleSvg = titleLines
    .map((l, i) => `<tspan x="70" y="${startY + i * lineSpacing}">${escapeXml(l)}</tspan>`)
    .join('');

  const blueLineY = startY + titleLines.length * lineSpacing + 16;
  const subStartY = blueLineY + 38;

  const subSvg = subLines
    .map((l, i) => `<tspan x="70" y="${subStartY + i * 28}">${escapeXml(l)}</tspan>`)
    .join('');

  const sectionsMarkup = coverData.sections.length > 0
    ? `<g transform="translate(70, ${subStartY + subLines.length * 28 + 26})">
        ${coverData.sections.map((sec, i) => `
          <g transform="translate(${i * 240}, 0)">
            <rect width="220" height="34" rx="8" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" stroke-width="1" />
            <circle cx="16" cy="17" r="3.5" fill="#4b88e8" />
            <text x="28" y="22" fill="#cbd5e1" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="500">${escapeXml(sec.slice(0, 24))}</text>
          </g>
        `).join('')}
       </g>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
  <defs>
    <!-- Deep Executive Slate Canvas with subtle Word Blue glow -->
    <linearGradient id="docDarkCanvas" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#141824" />
      <stop offset="100%" stop-color="#1e2333" />
    </linearGradient>
    <radialGradient id="wordBlueGlow" cx="90%" cy="10%" r="50%">
      <stop offset="0%" stop-color="#185abd" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#185abd" stop-opacity="0" />
    </radialGradient>
  </defs>

  <!-- Canvas Base -->
  <rect width="1200" height="675" rx="16" fill="url(#docDarkCanvas)" stroke="rgba(255, 255, 255, 0.1)" stroke-width="1.5" />
  <rect width="1200" height="675" rx="16" fill="url(#wordBlueGlow)" />

  <!-- Header Bar -->
  <g transform="translate(70, 52)">
    <rect width="10" height="10" rx="2" fill="#4b88e8" y="-9" />
    <text x="18" y="0" fill="#4b88e8" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" letter-spacing="2">EXECUTIVE DOCUMENT · DOCX</text>
    <text x="1060" y="0" text-anchor="end" fill="#94a3b8" font-family="monospace, sans-serif" font-size="13">${estimatedPages} ${estimatedPages === 1 ? 'Page' : 'Pages'} · ${wordCount} Words</text>
    <line x1="0" y1="20" x2="1060" y2="20" stroke="rgba(255, 255, 255, 0.1)" stroke-width="1.5" />
  </g>

  <!-- Document Title -->
  <text font-family="Georgia, 'Times New Roman', serif" font-size="${fontSize}" font-weight="700" fill="#ffffff" letter-spacing="-0.3">
    ${titleSvg}
  </text>

  <!-- Word Blue Accent Rule -->
  <rect x="70" y="${blueLineY}" width="80" height="4" rx="2" fill="#4b88e8" />

  <!-- Subtitle / Executive Summary -->
  <text font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="19" font-weight="400" fill="#cbd5e1" letter-spacing="0.1">
    ${subSvg}
  </text>

  <!-- Section outline chips -->
  ${sectionsMarkup}

  <!-- Footer Bar -->
  <g transform="translate(70, 618)">
    <line x1="0" y1="-22" x2="1060" y2="-22" stroke="rgba(255, 255, 255, 0.1)" stroke-width="1.5" />
    <text x="0" y="0" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="600">e-Mate AI Studio</text>
    <text x="1060" y="0" text-anchor="end" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-size="13">Word Document (.docx)</text>
  </g>
</svg>`;
}

