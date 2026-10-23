import PptxGenJS from 'pptxgenjs';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';

export const dynamic = 'force-dynamic';

function parsePresentationSlides(markdown: string): Array<{
  title: string;
  bullets: string[];
  notes?: string;
}> {
  const rawSections = markdown.split(/---SLIDE:[^-]*---/).filter((s) => s.trim().length > 0);

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

  const slides = parsePresentationSlides(markdown);

  // 1. Title Slide (Claude Navy & Amber Accent)
  const titleSlide = pres.addSlide();
  titleSlide.background = { color: '0F172A' };
  titleSlide.addText(title, {
    x: 0.8,
    y: 2.2,
    w: 8.4,
    h: 1.5,
    fontSize: 32,
    bold: true,
    color: 'F8FAFC',
    fontFace: 'Arial',
  });
  titleSlide.addText('Prepared with e-Mate AI Studio', {
    x: 0.8,
    y: 3.8,
    w: 8.4,
    h: 0.6,
    fontSize: 16,
    color: '94A3B8',
    fontFace: 'Arial',
  });
  titleSlide.addShape(pres.ShapeType.rect, {
    x: 0.8,
    y: 2.0,
    w: 2.0,
    h: 0.08,
    fill: { color: 'F59E0B' },
  });

  // 2. Content Slides
  slides.forEach((s, idx) => {
    const slide = pres.addSlide();
    slide.background = { color: 'F8FAFC' };

    slide.addShape(pres.ShapeType.rect, {
      x: 0,
      y: 0,
      w: '100%',
      h: 1.1,
      fill: { color: '0F172A' },
    });

    slide.addText(s.title, {
      x: 0.8,
      y: 0.25,
      w: 8.0,
      h: 0.7,
      fontSize: 22,
      bold: true,
      color: 'FFFFFF',
      fontFace: 'Arial',
    });

    slide.addText(`${idx + 1} / ${slides.length}`, {
      x: 8.2,
      y: 0.35,
      w: 1.5,
      h: 0.5,
      fontSize: 12,
      color: '94A3B8',
      align: 'right',
      fontFace: 'Arial',
    });

    const bulletItems = s.bullets.slice(0, 6).map((b) => {
      const cleaned = b.replace(/\*\*(.*?)\*\*/g, '$1');
      return {
        text: cleaned,
        options: {
          bullet: { type: 'bullet' as const },
          fontSize: 14,
          color: '334155',
          breakLine: true,
          paraSpaceAfter: 10,
        },
      };
    });

    if (bulletItems.length > 0) {
      slide.addText(bulletItems, {
        x: 0.8,
        y: 1.6,
        w: 8.4,
        h: 4.8,
        fontFace: 'Arial',
      });
    }

    if (s.notes) {
      slide.addNotes(s.notes);
    }
  });

  const out = (await pres.write({ outputType: 'nodebuffer' })) as Buffer;
  return out;
}

async function generateDocxBuffer(title: string, markdown: string): Promise<Buffer> {
  const lines = markdown.split('\n');
  const docParagraphs: any[] = [];

  docParagraphs.push(
    new Paragraph({
      text: title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 300, before: 100 },
    })
  );

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      docParagraphs.push(new Paragraph({ text: '', spacing: { after: 120 } }));
      continue;
    }

    if (trimmed.startsWith('# ')) {
      docParagraphs.push(
        new Paragraph({
          text: trimmed.replace(/^#\s+/, ''),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 240, after: 120 },
        })
      );
    } else if (trimmed.startsWith('## ')) {
      docParagraphs.push(
        new Paragraph({
          text: trimmed.replace(/^##\s+/, ''),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        })
      );
    } else if (trimmed.startsWith('### ')) {
      docParagraphs.push(
        new Paragraph({
          text: trimmed.replace(/^###\s+/, ''),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 160, after: 80 },
        })
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
      const content = trimmed.replace(/^[-*•]\s+/, '');
      docParagraphs.push(
        new Paragraph({
          text: content.replace(/\*\*(.*?)\*\*/g, '$1'),
          bullet: { level: 0 },
          spacing: { after: 80 },
        })
      );
    } else {
      docParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: trimmed.replace(/\*\*(.*?)\*\*/g, '$1'),
              size: 24,
            }),
          ],
          spacing: { after: 120 },
        })
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: docParagraphs,
      },
    ],
  });

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
