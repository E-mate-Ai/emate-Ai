import PptxGenJS from 'pptxgenjs';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import {
  parsePresentationMarkdown,
  extractPresentationCoverData,
  extractPresentationPillars,
  detectPresentationTheme,
  type PresentationTheme,
} from '@/lib/presentationCover';
import { buildUniversalDocx } from '@/lib/standardDocument';

export const dynamic = 'force-dynamic';

function parsePresentationContentSlides(markdown: string): Array<{
  title: string;
  bullets: string[];
  notes?: string;
}> {
  const allSlides = parsePresentationMarkdown(markdown);
  const contentSlides = allSlides.filter((s) => !s.isTitle);

  return contentSlides.map((s, idx) => {
    const lines = s.content.trim().split('\n');
    const titleLine = lines.find((l) => l.trim().startsWith('## ') || l.trim().startsWith('# '));
    const title = titleLine ? titleLine.replace(/^#{1,2}\s+/, '').trim() : s.marker || `Slide ${idx + 2}`;

    const notesLine = lines.find((l) => l.includes('[Speaker notes:') || l.includes('Speaker notes:'));
    const notes = notesLine
      ? notesLine.replace(/\[?Speaker notes:?\s*/i, '').replace(/\]$/, '').trim()
      : undefined;

    const bullets = lines
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

    return {
      title,
      bullets: bullets.length > 0 ? bullets : [s.content.replace(/^#{1,6}\s+.*$/gm, '').trim().slice(0, 200)],
      notes,
    };
  });
}

function detectPptSlideKicker(title: string, index: number): string {
  const lower = title.toLowerCase();
  if (lower.includes('agenda') || lower.includes('roadmap') || lower.includes('outline')) return 'AGENDA & ROADMAP';
  if (lower.includes('intro') || lower.includes('fundamental') || lower.includes('overview')) return 'FOUNDATIONS & CONCEPTS';
  if (lower.includes('architect') || lower.includes('pillar') || lower.includes('core')) return 'CORE ARCHITECTURE & PILLARS';
  if (lower.includes('algorithm') || lower.includes('mechanism') || lower.includes('method') || lower.includes('deep dive')) return 'DEEP DIVE & MECHANISMS';
  if (lower.includes('applicat') || lower.includes('practice') || lower.includes('implement')) return 'PRACTICAL APPLICATIONS';
  if (lower.includes('challenge') || lower.includes('risk') || lower.includes('limit')) return 'SYSTEMIC CHALLENGES & RISKS';
  if (lower.includes('future') || lower.includes('conclusion') || lower.includes('takeaway')) return 'KEY TAKEAWAYS & NEXT STEPS';
  const fallbacks = ['FOUNDATIONS & SCOPE', 'CORE PILLARS', 'STRATEGIC ANALYSIS', 'IMPLEMENTATION ROADMAP'];
  return fallbacks[(index - 1) % fallbacks.length];
}

async function generatePptxBuffer(title: string, markdown: string, themeId?: string): Promise<Buffer> {
  const pres = new PptxGenJS();
  pres.defineLayout({ name: 'WIDE_16x9', width: 13.333, height: 7.5 });
  pres.layout = 'WIDE_16x9';
  pres.author = 'e-Mate AI';
  pres.company = 'e-Mate AI Studio';
  pres.title = title;

  const coverData = extractPresentationCoverData(markdown, title);
  const slides = parsePresentationContentSlides(markdown);
  const totalSlides = slides.length + 1;
  const theme = detectPresentationTheme(title + ' ' + (coverData.subtitle || '') + ' ' + markdown.slice(0, 500), themeId);

  // Extract 4 pills from content
  const extractedPills = extractPresentationPillars(markdown);
  const defaultPills = theme.id === 'ai-tech'
    ? ['Core Concepts', 'Architectures', 'Model Training', 'Evaluation']
    : theme.id === 'finance-business'
    ? ['Financial Stability', 'Central Banking', 'Monetary Policy', 'Systemic Risk']
    : theme.id === 'medical-health'
    ? ['Clinical Evidence', 'Pathophysiology', 'Diagnostics', 'Therapeutics']
    : theme.id === 'creative-marketing'
    ? ['Brand Identity', 'Audience Growth', 'Visual Design', 'Campaign Strategy']
    : ['Strategic Focus', 'Core Pillars', 'Architecture', 'Roadmap'];
  const finalPills = (extractedPills.length >= 3 ? extractedPills : defaultPills).slice(0, 4);

  // Presenter line
  let presenterName = 'Prepared with e-Mate AI Studio';
  const presenterMatch = markdown.match(/(?:Presented by|Author:|Prepared by|Speaker:)\s*([A-Za-z\s.]+)/i);
  if (presenterMatch && presenterMatch[1] && presenterMatch[1].trim().length > 2 && presenterMatch[1].trim().length < 40) {
    presenterName = `Presented by ${presenterMatch[1].trim()}`;
  }

  // ── 1. Title Slide - Matching Theme Cover ─────────────────────────────────
  const titleSlide = pres.addSlide();
  titleSlide.background = { color: theme.coverBgHex };

  // Top header kicker
  titleSlide.addText(theme.domainKicker, {
    x: 0.8,
    y: 0.55,
    w: 9.5,
    h: 0.35,
    fontSize: 11,
    bold: true,
    color: theme.coverKickerColor.replace('#', ''),
    fontFace: 'Arial',
  });

  // Circular icon badge on top right
  titleSlide.addShape(pres.ShapeType.ellipse, {
    x: 12.0,
    y: 0.48,
    w: 0.55,
    h: 0.55,
    fill: { color: theme.coverBadgeFill.replace('#', '') },
    line: { color: 'FFFFFF', width: 0.5 },
  });

  // Hero Title (Matching Preview Serif Design)
  const titleFontSize = coverData.title.length > 50 ? 28 : coverData.title.length > 32 ? 32 : 36;
  titleSlide.addText(coverData.title, {
    x: 0.8,
    y: 1.8,
    w: 11.5,
    h: 1.6,
    fontSize: titleFontSize,
    bold: true,
    color: 'FFFFFF',
    fontFace: 'Georgia',
  });

  // Subtitle / Tagline
  if (coverData.subtitle) {
    titleSlide.addText(coverData.subtitle, {
      x: 0.8,
      y: 3.5,
      w: 11.0,
      h: 1.1,
      fontSize: 15,
      italic: true,
      color: theme.coverSubtitleColor.replace('#', ''),
      fontFace: 'Georgia',
    });
  }

  // Presenter line
  titleSlide.addText(presenterName, {
    x: 0.8,
    y: 4.8,
    w: 8.0,
    h: 0.35,
    fontSize: 11,
    color: theme.coverPresenterColor.replace('#', ''),
    fontFace: 'Arial',
  });

  // Bottom Feature Pills (4 pills across 13.333" width)
  finalPills.forEach((pill, pi) => {
    titleSlide.addShape(pres.ShapeType.roundRect, {
      x: 0.8 + pi * 2.65,
      y: 6.2,
      w: 2.45,
      h: 0.45,
      fill: { color: theme.coverPillBg.replace('#', '') },
      rectRadius: 0.2,
      line: { color: 'FFFFFF', width: 0.5 },
    });
    titleSlide.addText(pill, {
      x: 0.8 + pi * 2.65,
      y: 6.2,
      w: 2.45,
      h: 0.45,
      fontSize: 10,
      bold: true,
      color: theme.coverPillText.replace('#', ''),
      align: 'center',
      valign: 'middle',
      fontFace: 'Arial',
    });
  });

  // Bottom page pill
  titleSlide.addShape(pres.ShapeType.roundRect, {
    x: 11.5,
    y: 6.2,
    w: 1.15,
    h: 0.45,
    fill: { color: '000000' },
    rectRadius: 0.1,
  });
  titleSlide.addText(`Page 1 / ${totalSlides}`, {
    x: 11.5,
    y: 6.2,
    w: 1.15,
    h: 0.45,
    fontSize: 10,
    color: 'FFFFFF',
    align: 'center',
    valign: 'middle',
    fontFace: 'Arial',
  });

  if (coverData.speakerNotes) {
    titleSlide.addNotes(coverData.speakerNotes);
  }

  // ── 2. Content Slides - Matching Theme Bento Design ───────────────────────
  slides.forEach((s, idx) => {
    const slideNumber = idx + 2;
    const slide = pres.addSlide();
    slide.background = { color: theme.contentBgHex };

    const kicker = detectPptSlideKicker(s.title, idx + 1);

    // Top header kicker
    slide.addText(kicker, {
      x: 0.8,
      y: 0.55,
      w: 8.0,
      h: 0.3,
      fontSize: 10,
      bold: true,
      color: theme.contentKickerColor,
      fontFace: 'Arial',
    });

    // Slide Title
    slide.addText(s.title, {
      x: 0.8,
      y: 0.88,
      w: 11.5,
      h: 0.65,
      fontSize: 22,
      bold: true,
      color: '111827',
      fontFace: 'Georgia',
    });

    // Parse bullets into left-column items vs takeaway
    const rawBullets = s.bullets;
    let takeaway = '';
    const items: Array<{ title: string; desc: string }> = [];

    for (const b of rawBullets) {
      const isTakeaway = /takeaway/i.test(b) || /key insight/i.test(b) || /conclusion/i.test(b);
      const boldMatch = /^\*\*(.*?)\*\*[\s:-]*(.*)$/.exec(b);
      const itemTitle = boldMatch ? boldMatch[1].trim() : b.slice(0, 32).trim();
      const itemDesc = boldMatch && boldMatch[2] ? boldMatch[2].trim() : b.replace(/^\*\*(.*?)\*\*/, '').trim() || itemTitle;

      if (isTakeaway && !takeaway) {
        takeaway = itemDesc || itemTitle;
      } else {
        items.push({ title: itemTitle, desc: itemDesc });
      }
    }

    if (!takeaway && items.length >= 2) {
      const last = items.pop()!;
      takeaway = last.desc || last.title;
    } else if (!takeaway && items.length === 1) {
      takeaway = items[0].desc;
    }

    // Left Column: Bullet items with circular icons
    const displayItems = items.slice(0, 3);
    displayItems.forEach((item, bi) => {
      const itemY = 1.8 + bi * 1.45;

      // Circle icon
      slide.addShape(pres.ShapeType.ellipse, {
        x: 0.8,
        y: itemY + 0.05,
        w: 0.38,
        h: 0.38,
        fill: { color: theme.contentItemBadgeFill },
      });

      // Item Title
      slide.addText(item.title, {
        x: 1.35,
        y: itemY,
        w: 6.0,
        h: 0.35,
        fontSize: 13,
        bold: true,
        color: '111827',
        fontFace: 'Arial',
      });

      // Item Description
      slide.addText(item.desc.replace(/\*\*/g, ''), {
        x: 1.35,
        y: itemY + 0.38,
        w: 6.0,
        h: 0.95,
        fontSize: 11,
        color: '4B5563',
        fontFace: 'Arial',
      });
    });

    // Right Column: Key Takeaway Bento Box
    slide.addShape(pres.ShapeType.roundRect, {
      x: 7.8,
      y: 1.8,
      w: 4.7,
      h: 4.4,
      fill: { color: theme.takeawayCardBg },
      line: { color: theme.takeawayCardBorder || 'E2E8F0', width: 1 },
      rectRadius: 0.2,
    });

    // Circle badge on takeaway card
    slide.addShape(pres.ShapeType.ellipse, {
      x: 8.2,
      y: 2.15,
      w: 0.42,
      h: 0.42,
      fill: { color: theme.takeawayBadgeFill },
    });

    // Label KEY TAKEAWAY
    slide.addText('KEY TAKEAWAY', {
      x: 8.2,
      y: 2.7,
      w: 3.9,
      h: 0.3,
      fontSize: 9.5,
      bold: true,
      color: theme.takeawayLabelColor,
      fontFace: 'Arial',
    });

    // Takeaway description
    slide.addText(takeaway || 'Strategic alignment and implementation insights.', {
      x: 8.2,
      y: 3.1,
      w: 3.9,
      h: 2.8,
      fontSize: 12.5,
      italic: true,
      color: '1F2937',
      fontFace: 'Georgia',
    });

    // Bottom right page indicator
    slide.addText(`Page ${slideNumber} / ${totalSlides}`, {
      x: 10.8,
      y: 6.6,
      w: 1.7,
      h: 0.35,
      fontSize: 10,
      color: '71717A',
      align: 'right',
      fontFace: 'Arial',
    });

    if (s.notes) {
      slide.addNotes(s.notes);
    }
  });

  const out = (await pres.write({ outputType: 'nodebuffer' })) as Buffer;
  return out;
}

async function generateDocxBuffer(title: string, markdown: string): Promise<Buffer> {
  const doc = buildUniversalDocx(title, markdown);
  return await Packer.toBuffer(doc);
}

export async function POST(req: Request) {
  try {
    const { title = 'Document', content = '', format = 'docx', themeId } = await req.json().catch(() => ({}));

    if (!content) {
      return new Response(JSON.stringify({ error: 'Content is required' }), { status: 400 });
    }

    if (format === 'pptx') {
      const buffer = await generatePptxBuffer(title, content, themeId);
      return new Response(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(title)}.pptx"`,
        },
      });
    }

    const buffer = await generateDocxBuffer(title, content);
    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(title)}.docx"`,
      },
    });
  } catch (err: any) {
    console.error('[Export-Document Error]:', err);
    return new Response(JSON.stringify({ error: err?.message || 'Export failed' }), { status: 500 });
  }
}
