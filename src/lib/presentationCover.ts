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
 * Accurately extracts:
 * - Slide title
 * - Subtitle / tagline
 * - Speaker notes
 */
export function extractPresentationCoverData(markdown: string, fallbackTitle?: string): PresentationCoverData {
  let title = (fallbackTitle || '').trim();
  let subtitle = '';
  let speakerNotes: string | undefined = undefined;

  const firstMarkerMatch = /^---SLIDE:\s*(.*?)---\s*$/m.exec(markdown);
  let firstSlideContent = '';

  if (firstMarkerMatch) {
    const startIdx = firstMarkerMatch.index + firstMarkerMatch[0].length;
    const nextMarkerIdx = markdown.indexOf('---SLIDE:', startIdx);
    firstSlideContent = (nextMarkerIdx >= 0 ? markdown.slice(startIdx, nextMarkerIdx) : markdown.slice(startIdx)).trim();
  } else {
    firstSlideContent = markdown.slice(0, 1000).trim();
  }

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
    const nonHeadingLines = lines.filter((l) => !/^#{1,3}\s+/.test(l) && !/Speaker notes:/i.test(l));
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
  const names = Array.from(markdown.matchAll(/---SLIDE:\s*(.*?)---/g), (match) => match[1].trim());
  const contentSlides = names.length - (names[0] && /title|cover/i.test(names[0]) ? 1 : 0);
  return Math.max(1, contentSlides + 1); // 1 title slide + N content slides
}

export function omitModelTitleSlide(markdown: string): string {
  const firstMarker = /^---SLIDE:\s*(.*?)---\s*$/m.exec(markdown);
  if (!firstMarker || !/title|cover/i.test(firstMarker[1])) return markdown;

  const nextMarkerIndex = markdown.indexOf('---SLIDE:', firstMarker.index + firstMarker[0].length);
  return nextMarkerIndex < 0 ? '' : markdown.slice(nextMarkerIndex).trim();
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

  // Dynamic typography sizing
  let fontSize = 48;
  let maxCharsPerLine = 28;
  if (finalTitle.length > 55) {
    fontSize = 36;
    maxCharsPerLine = 38;
  } else if (finalTitle.length > 32) {
    fontSize = 42;
    maxCharsPerLine = 32;
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

  const startY = titleLines.length === 1 ? 260 : titleLines.length === 2 ? 220 : 190;
  const lineSpacing = fontSize * 1.2;

  const titleSvgMarkup = titleLines
    .map((line, idx) => `<tspan x="70" y="${startY + idx * lineSpacing}">${escapeXml(line)}</tspan>`)
    .join('');

  const accentY = startY + titleLines.length * lineSpacing + 16;
  const subStartY = accentY + 44;

  const subSvgMarkup = subLines
    .map((line, idx) => `<tspan x="70" y="${subStartY + idx * 30}">${escapeXml(line)}</tspan>`)
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
  <defs>
    <!-- Dark Zinc gradient matching presentation slide canvas -->
    <linearGradient id="slideDarkCanvas" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#18181b" />
      <stop offset="100%" stop-color="#27272a" />
    </linearGradient>
  </defs>

  <!-- Slide Canvas Base -->
  <rect width="1200" height="675" rx="16" fill="url(#slideDarkCanvas)" stroke="rgba(255, 255, 255, 0.1)" stroke-width="1.5" />

  <!-- Slide Header Bar (Matching rest of PPT) -->
  <g transform="translate(70, 52)">
    <text x="0" y="0" fill="#f59e0b" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="700" letter-spacing="2">TITLE SLIDE</text>
    <text x="1060" y="0" text-anchor="end" fill="#a1a1aa" font-family="monospace, sans-serif" font-size="13">1 of ${slideCount}</text>
    <line x1="0" y1="20" x2="1060" y2="20" stroke="rgba(255, 255, 255, 0.1)" stroke-width="1.5" />
  </g>

  <!-- Hero Title (Matching rest of PPT) -->
  <text font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="${fontSize}" font-weight="800" fill="#ffffff" letter-spacing="-0.5">
    ${titleSvgMarkup}
  </text>

  <!-- Amber Accent Underline -->
  <rect x="70" y="${accentY}" width="80" height="4" rx="2" fill="#f59e0b" />

  <!-- Subtitle (Matching rest of PPT) -->
  <text font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="21" font-weight="400" fill="#d4d4d8" letter-spacing="0.2">
    ${subSvgMarkup}
  </text>

  <!-- Slide Footer Bar (Matching rest of PPT) -->
  <g transform="translate(70, 618)">
    <line x1="0" y1="-22" x2="1060" y2="-22" stroke="rgba(255, 255, 255, 0.1)" stroke-width="1.5" />
    <text x="0" y="0" fill="#a1a1aa" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="600">e-Mate AI Studio</text>
    <text x="1060" y="0" text-anchor="end" fill="#a1a1aa" font-family="system-ui, -apple-system, sans-serif" font-size="13">1 / ${slideCount}</text>
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

