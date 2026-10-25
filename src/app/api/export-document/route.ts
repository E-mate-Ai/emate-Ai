import PptxGenJS from 'pptxgenjs';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import {
  omitModelTitleSlide,
  extractPresentationCoverData,
} from '@/lib/presentationCover';
import { buildUniversalDocx } from '@/lib/standardDocument';

export const dynamic = 'force-dynamic';

function parsePresentationSlides(markdown: string): Array<{
  title: string;
  bullets: string[];
  notes?: string;
}> {
  const presentationContent = omitModelTitleSlide(markdown);
  const rawSections = presentationContent.split(/---SLIDE:[^-]*---/).filter((s) => s.trim().length > 0);

  if (rawSections.length > 0) {
    return rawSections.map((sec, idx) => {
      const lines = sec.trim().split('\n');
      const titleLine = lines.find((l) => l.trim().startsWith('## ') || l.trim().startsWith('# '));
      const title = titleLine ? titleLine.replace(/^#{1,2}\s+/, '').trim() : `Slide ${idx + 1}`;

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
        bullets: bullets.length > 0 ? bullets : [sec.replace(/^#{1,6}\s+.*$/gm, '').trim().slice(0, 200)],
        notes,
      };
    });
  }

  const h2Parts = markdown.split(/(?=^##\s+)/m).filter(Boolean);
  if (h2Parts.length > 1) {
    return h2Parts.map((part, idx) => {
      const lines = part.trim().split('\n');
      const title = lines[0].replace(/^##\s+/, '').trim();
      const bullets = lines
        .slice(1)
        .filter((l) => l.trim().length > 0)
        .map((l) => l.replace(/^[-*•]\s+/, '').trim());
      return {
        title: title || `Slide ${idx + 1}`,
        bullets: bullets.length > 0 ? bullets : ['Content slide overview'],
      };
    });
  }

  return [{ title: 'Overview', bullets: [markdown.slice(0, 300)] }];
}

async function generatePptxBuffer(title: string, markdown: string): Promise<Buffer> {
  const pres = new PptxGenJS();
  pres.layout = 'LAYOUT_16x9';
  pres.author = 'e-Mate AI';
  pres.company = 'e-Mate AI Studio';
  pres.title = title;

  const coverData = extractPresentationCoverData(markdown, title);
  const slides = parsePresentationSlides(markdown);
  const totalSlides = slides.length + 1;

  // 1. Title Slide - matching the dark zinc & amber presentation design
  const titleSlide = pres.addSlide();
  titleSlide.background = { color: '18181B' };

  // Top header rule & kicker
  titleSlide.addText('TITLE SLIDE', {
    x: 0.8,
    y: 0.35,
    w: 6.0,
    h: 0.4,
    fontSize: 11,
    bold: true,
    color: 'F59E0B',
    fontFace: 'Arial',
  });
  titleSlide.addText(`1 / ${totalSlides}`, {
    x: 7.5,
    y: 0.35,
    w: 5.0,
    h: 0.4,
    fontSize: 11,
    color: '71717A',
    align: 'right',
    fontFace: 'Arial',
  });
  titleSlide.addShape(pres.ShapeType.line, {
    x: 0.8,
    y: 0.8,
    w: 11.7,
    h: 0,
    line: { color: '27272A', width: 1 },
  });

  // Hero Title
  titleSlide.addText(coverData.title, {
    x: 0.8,
    y: 1.6,
    w: 11.7,
    h: 1.8,
    fontSize: 34,
    bold: true,
    color: 'FFFFFF',
    fontFace: 'Arial',
  });

  // Amber accent bar
  titleSlide.addShape(pres.ShapeType.rect, {
    x: 0.8,
    y: 3.6,
    w: 1.2,
    h: 0.07,
    fill: { color: 'F59E0B' },
    line: { color: 'F59E0B' },
  });

  // Subtitle / Overview
  if (coverData.subtitle) {
    titleSlide.addText(coverData.subtitle, {
      x: 0.8,
      y: 3.9,
      w: 11.0,
      h: 1.8,
      fontSize: 17,
      color: 'D4D4D8',
      fontFace: 'Arial',
    });
  }

  // Footer divider & brand
  titleSlide.addShape(pres.ShapeType.line, {
    x: 0.8,
    y: 6.6,
    w: 11.7,
    h: 0,
    line: { color: '27272A', width: 1 },
  });
  titleSlide.addText('e-Mate AI Studio', {
    x: 0.8,
    y: 6.75,
    w: 4.0,
    h: 0.4,
    fontSize: 10,
    color: '71717A',
    fontFace: 'Arial',
  });
  titleSlide.addText(`1 / ${totalSlides}`, {
    x: 7.5,
    y: 6.75,
    w: 5.0,
    h: 0.4,
    fontSize: 10,
    color: '71717A',
    align: 'right',
    fontFace: 'Arial',
  });

  if (coverData.speakerNotes) {
    titleSlide.addNotes(coverData.speakerNotes);
  }

  // 2. Content Slides - perfectly matching dark zinc & amber design
  slides.forEach((s, idx) => {
    const slideNumber = idx + 2;
    const slide = pres.addSlide();
    slide.background = { color: '18181B' };

    // Top header kicker
    slide.addText(`SLIDE ${slideNumber}`, {
      x: 0.8,
      y: 0.35,
      w: 6.0,
      h: 0.4,
      fontSize: 11,
      bold: true,
      color: 'F59E0B',
      fontFace: 'Arial',
    });
    slide.addText(`${slideNumber} / ${totalSlides}`, {
      x: 7.5,
      y: 0.35,
      w: 5.0,
      h: 0.4,
      fontSize: 11,
      color: '71717A',
      align: 'right',
      fontFace: 'Arial',
    });
    slide.addShape(pres.ShapeType.line, {
      x: 0.8,
      y: 0.8,
      w: 11.7,
      h: 0,
      line: { color: '27272A', width: 1 },
    });

    // Slide Title
    slide.addText(s.title, {
      x: 0.8,
      y: 1.05,
      w: 11.7,
      h: 0.8,
      fontSize: 22,
      bold: true,
      color: 'FFFFFF',
      fontFace: 'Arial',
    });

    const bulletItems = s.bullets.slice(0, 6).map((b) => {
      const cleaned = b.replace(/\*\*(.*?)\*\*/g, '$1');
      return {
        text: cleaned,
        options: {
          bullet: { type: 'bullet' as const, color: 'F59E0B' },
          fontSize: 14,
          color: 'E4E4E7',
          breakLine: true,
          paraSpaceAfter: 12,
        },
      };
    });

    if (bulletItems.length > 0) {
      slide.addText(bulletItems, {
        x: 0.8,
        y: 2.05,
        w: 11.7,
        h: 4.3,
        fontFace: 'Arial',
      });
    }

    // Footer divider & brand
    slide.addShape(pres.ShapeType.line, {
      x: 0.8,
      y: 6.6,
      w: 11.7,
      h: 0,
      line: { color: '27272A', width: 1 },
    });
    slide.addText('e-Mate AI Studio', {
      x: 0.8,
      y: 6.75,
      w: 4.0,
      h: 0.4,
      fontSize: 10,
      color: '71717A',
      fontFace: 'Arial',
    });
    slide.addText(`${slideNumber} / ${totalSlides}`, {
      x: 7.5,
      y: 6.75,
      w: 5.0,
      h: 0.4,
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
    const { title = 'Document', content = '', format = 'docx' } = await req.json().catch(() => ({}));

    if (!content) {
      return new Response(JSON.stringify({ error: 'Content is required' }), { status: 400 });
    }

    if (format === 'pptx') {
      const buffer = await generatePptxBuffer(title, content);
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
