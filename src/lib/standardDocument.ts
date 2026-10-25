import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  Header,
  Footer,
  PageNumber,
} from 'docx';

export type DocumentTemplateType = 'resume' | 'academic' | 'invoice' | 'assignment' | 'executive';

export interface MarkdownTableData {
  headers: string[];
  rows: string[][];
}

export type MarkdownBlock =
  | { type: 'h1'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'bullet-list'; items: string[] }
  | { type: 'ordered-list'; items: string[] }
  | { type: 'table'; data: MarkdownTableData }
  | { type: 'blockquote'; text: string }
  | { type: 'callout'; text: string; icon?: string; calloutTitle?: string }
  | { type: 'equation'; formula: string; number?: string }
  | { type: 'contact-bar'; items: string[] }
  | { type: 'two-column-row'; left: string; right: string; isBold?: boolean; isItalic?: boolean }
  | { type: 'divider' };

export interface ParsedDocument {
  title: string;
  subtitle?: string;
  template: DocumentTemplateType;
  authorInfo?: {
    name?: string;
    email?: string;
    institution?: string;
    date?: string;
    contact?: string[];
  };
  metadata: {
    wordCount: number;
    readingTimeMinutes: number;
    date: string;
    docType: string;
  };
  blocks: MarkdownBlock[];
}

/** Automatically classifies a document into one of the 4 reference template archetypes. */
export function detectDocumentTemplate(title: string, markdown: string): DocumentTemplateType {
  const lower = `${title}\n${markdown}`.toLowerCase();

  if (
    lower.includes('curriculum vitae') ||
    lower.includes('resume') ||
    (lower.includes('work experience') && lower.includes('education')) ||
    (lower.includes('education') && lower.includes('leadership') && lower.includes('skills')) ||
    (lower.includes('gpa') && lower.includes('coursework'))
  ) {
    return 'resume';
  }

  if (
    lower.includes('purchase order') ||
    lower.includes('invoice') ||
    lower.includes('p.o. number') ||
    lower.includes('shipping terms') ||
    (lower.includes('vendor') && lower.includes('customer') && lower.includes('unit price')) ||
    (lower.includes('subtotal') && lower.includes('total amount'))
  ) {
    return 'invoice';
  }

  if (
    lower.includes('assignment #') ||
    lower.includes('problem set') ||
    lower.includes('homework #') ||
    (lower.includes('assignment') && (lower.includes('problem') || lower.includes('equation'))) ||
    (lower.includes('problem title') && lower.includes('theoretical'))
  ) {
    return 'assignment';
  }

  if (
    lower.includes('chapter 1') ||
    lower.includes('chapter one') ||
    lower.includes('the main ideas') ||
    lower.includes('textbook') ||
    lower.includes('tufte')
  ) {
    return 'academic';
  }

  return 'executive';
}

/** Parses markdown into structured document blocks. */
export function parseMarkdownDocument(markdown: string, fallbackTitle = 'Executive Document'): ParsedDocument {
  const rawLines = markdown.split(/\r?\n/);
  const blocks: MarkdownBlock[] = [];
  let title = fallbackTitle;
  let subtitle: string | undefined = undefined;

  let i = 0;
  const wordCount = markdown.trim().split(/\s+/).filter(Boolean).length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 220));
  const dateFormatted = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const template = detectDocumentTemplate(fallbackTitle, markdown);
  const authorInfo: ParsedDocument['authorInfo'] = {};

  while (i < rawLines.length) {
    const line = rawLines[i].trim();

    if (!line) { i++; continue; }

    // Horizontal Rule
    if (/^(\*\*\*|---|___)$/.test(line)) {
      blocks.push({ type: 'divider' });
      i++;
      continue;
    }

    // Document Title (# )
    if (line.startsWith('# ')) {
      const parsedTitle = line.replace(/^#\s+/, '').trim();
      if (!title || title === fallbackTitle) title = parsedTitle;
      blocks.push({ type: 'h1', text: parsedTitle });
      i++;
      continue;
    }

    // Heading 2
    if (line.startsWith('## ')) {
      blocks.push({ type: 'h2', text: line.replace(/^##\s+/, '').trim() });
      i++;
      continue;
    }

    // Heading 3 — detect two-column format like "### Goldman Sachs | New York, NY"
    if (line.startsWith('### ')) {
      const h3Text = line.replace(/^###\s+/, '').trim();
      if (h3Text.includes('|')) {
        const parts = h3Text.split('|').map((s) => s.trim());
        if (parts.length === 2) {
          blocks.push({ type: 'two-column-row', left: parts[0], right: parts[1], isBold: true });
          i++;
          continue;
        }
      }
      blocks.push({ type: 'h3', text: h3Text });
      i++;
      continue;
    }

    // Math Equation ($$...$$  or formula ending with (1) numbering)
    if (line.startsWith('$$') || (line.includes('=') && /\(\d+\)$/.test(line)) || line.startsWith('\\[')) {
      let formula = line;
      let eqNum: string | undefined = undefined;
      const numMatch = line.match(/\((\d+)\)$/);
      if (numMatch) {
        eqNum = numMatch[1];
        formula = line.replace(/\s*\(\d+\)$/, '').trim();
      }
      formula = formula.replace(/^\$\$|\$\$$/g, '').replace(/^\\\[|\\\]$/g, '').trim();
      blocks.push({ type: 'equation', formula, number: eqNum });
      i++;
      continue;
    }

    // Blockquote / Callout
    if (line.startsWith('>')) {
      const quoteLines: string[] = [];
      let isInfoCallout = false;
      while (i < rawLines.length && rawLines[i].trim().startsWith('>')) {
        const qLine = rawLines[i].trim().replace(/^>\s?/, '');
        if (qLine.includes('\u24d8') || /info:/i.test(qLine) || /\[!note\]/i.test(qLine)) isInfoCallout = true;
        quoteLines.push(qLine);
        i++;
      }
      const combined = quoteLines.join(' ');
      if (isInfoCallout) {
        const cleanCallout = combined.replace(/\[!note\]/i, '').replace(/^\u24d8\s*/, '').trim();
        blocks.push({ type: 'callout', text: cleanCallout, icon: '\u24d8', calloutTitle: 'Info' });
      } else {
        blocks.push({ type: 'blockquote', text: combined });
      }
      continue;
    }

    // Markdown Table
    if (line.startsWith('|') && line.endsWith('|')) {
      const tableLines: string[] = [];
      while (i < rawLines.length && rawLines[i].trim().startsWith('|') && rawLines[i].trim().endsWith('|')) {
        tableLines.push(rawLines[i].trim());
        i++;
      }
      if (tableLines.length >= 2) {
        const parseRow = (rowStr: string) =>
          rowStr.slice(1, -1).split('|').map((cell) => cell.trim());
        const headers = parseRow(tableLines[0]);
        const dataRows = tableLines.slice(1)
          .filter((row) => !/^[|\s-:]+$/.test(row))
          .map(parseRow);
        blocks.push({ type: 'table', data: { headers, rows: dataRows } });
        continue;
      }
    }

    // Two-column inline row  "Role | Date" or "phone | email | city" contact bar
    if (line.includes('|') && !line.startsWith('|') && !line.endsWith('|')) {
      const parts = line.split('|').map((s) => s.trim());
      if (parts.length === 2 && (parts[1].match(/\d{4}/) || parts[1].includes('\u2013') || parts[1].includes('-'))) {
        blocks.push({
          type: 'two-column-row',
          left: parts[0],
          right: parts[1],
          isItalic: parts[0].startsWith('*') && parts[0].endsWith('*'),
        });
        i++;
        continue;
      } else if (parts.length >= 2 && (parts.some(p => p.includes('@')) || parts.some(p => /\d{3}[-.\s]\d{3}/.test(p)))) {
        blocks.push({ type: 'contact-bar', items: parts });
        authorInfo.contact = parts;
        i++;
        continue;
      }
    }

    // Bullet List
    if (/^[-*\u2022]\s+/.test(line)) {
      const items: string[] = [];
      while (i < rawLines.length && /^[-*\u2022]\s+/.test(rawLines[i].trim())) {
        items.push(rawLines[i].trim().replace(/^[-*\u2022]\s+/, ''));
        i++;
      }
      blocks.push({ type: 'bullet-list', items });
      continue;
    }

    // Ordered List
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < rawLines.length && /^\d+\.\s+/.test(rawLines[i].trim())) {
        items.push(rawLines[i].trim().replace(/^\d+\.\s+/, ''));
        i++;
      }
      blocks.push({ type: 'ordered-list', items });
      continue;
    }

    // Normal Paragraph
    const pLines: string[] = [line];
    i++;
    while (
      i < rawLines.length &&
      rawLines[i].trim() &&
      !rawLines[i].trim().startsWith('#') &&
      !rawLines[i].trim().startsWith('|') &&
      !rawLines[i].trim().startsWith('>') &&
      !rawLines[i].trim().startsWith('$$') &&
      !/^[-*\u2022]\s+/.test(rawLines[i].trim()) &&
      !/^\d+\.\s+/.test(rawLines[i].trim())
    ) {
      pLines.push(rawLines[i].trim());
      i++;
    }

    const fullP = pLines.join(' ');
    if (!subtitle && blocks.length <= 1 && fullP.length < 160 && !fullP.includes('.')) subtitle = fullP;
    if (template === 'assignment' && blocks.length <= 2 && fullP.includes('@') && !authorInfo.email) {
      authorInfo.email = fullP;
    } else if (template === 'assignment' && blocks.length <= 3 && (fullP.includes('University') || fullP.includes('College') || fullP.includes('\u2014'))) {
      authorInfo.institution = fullP;
    }

    blocks.push({ type: 'paragraph', text: fullP });
  }

  const docTypeMap: Record<DocumentTemplateType, string> = {
    resume: 'Professional Resume / CV',
    academic: 'Textbook / Academic Chapter',
    invoice: 'Purchase Order / Business Form',
    assignment: 'Scientific Assignment / Problem Set',
    executive: 'Executive Document',
  };

  return {
    title,
    subtitle,
    template,
    authorInfo,
    metadata: {
      wordCount,
      readingTimeMinutes,
      date: dateFormatted,
      docType: docTypeMap[template],
    },
    blocks,
  };
}

/** Splits inline markdown into docx TextRuns. */
export function parseInlineRuns(
  text: string,
  options: { font?: string; size?: number; color?: string } = {}
): TextRun[] {
  const { font = 'Calibri', size = 22, color = '1E293B' } = options;
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  const parts = text.split(regex);
  const runs: TextRun[] = [];

  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith('**') && part.endsWith('**')) {
      runs.push(new TextRun({ text: part.slice(2, -2), bold: true, font, size, color: '0F172A' }));
    } else if (part.startsWith('*') && part.endsWith('*')) {
      runs.push(new TextRun({ text: part.slice(1, -1), italics: true, font, size, color: '334155' }));
    } else if (part.startsWith('`') && part.endsWith('`')) {
      runs.push(new TextRun({ text: part.slice(1, -1), font: 'Consolas', size: Math.max(18, size - 2), color: '2563EB' }));
    } else {
      runs.push(new TextRun({ text: part, font, size, color }));
    }
  }

  return runs.length > 0 ? runs : [new TextRun({ text, font, size, color })];
}

/**
 * Builds a Word (.docx) document styled to one of the 4 reference templates:
 * resume | academic | invoice | assignment | executive
 */
export function buildUniversalDocx(title: string, markdown: string, forcedTemplate?: DocumentTemplateType): Document {
  const docData = parseMarkdownDocument(markdown, title);
  const activeTemplate = forcedTemplate || docData.template;
  const docElements: (Paragraph | Table)[] = [];

  const isSerif = activeTemplate === 'academic' || activeTemplate === 'assignment';
  const mainFont = isSerif ? 'Georgia' : 'Calibri';

  const BORDER_COLOR = 'CBD5E1';
  const tableBorder = {
    top: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
    left: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
    right: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: 'E2E8F0' },
    insideVertical: { style: BorderStyle.SINGLE, size: 2, color: 'E2E8F0' },
  };

  // ── 1. Template-Specific Document Header ────────────────────────────────

  if (activeTemplate === 'resume') {
    // Candidate name large & bold
    docElements.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: 0, after: 60 },
        children: [
          new TextRun({ text: docData.title.toUpperCase(), bold: true, size: 44, color: '000000', font: 'Georgia' }),
        ],
      })
    );
    // Contact bar or horizontal rule
    if (docData.authorInfo?.contact?.length) {
      docElements.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          border: { bottom: { style: BorderStyle.SINGLE, size: 10, color: '000000' } },
          spacing: { before: 0, after: 200 },
          children: [
            new TextRun({ text: docData.authorInfo.contact.join('   |   '), size: 19, color: '333333', font: 'Calibri' }),
          ],
        })
      );
    } else {
      docElements.push(
        new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 10, color: '000000' } }, spacing: { before: 0, after: 180 } })
      );
    }
  } else if (activeTemplate === 'assignment') {
    // PHYS101 archetype – centered title + author block
    docElements.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 80 },
        children: [new TextRun({ text: docData.title, bold: true, size: 38, color: '0F172A', font: 'Georgia' })],
      })
    );
    if (docData.subtitle) {
      docElements.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 40, after: 40 },
          children: [new TextRun({ text: docData.subtitle, size: 24, color: '1E293B', font: 'Georgia' })],
        })
      );
    }
    if (docData.authorInfo?.email) {
      docElements.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 20, after: 40 },
          children: [new TextRun({ text: docData.authorInfo.email, size: 20, color: '475569', font: 'Consolas' })],
        })
      );
    }
    docElements.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 40, after: 280 },
        children: [
          new TextRun({
            text: docData.authorInfo?.institution || `e-Mate University \u2014 ${docData.metadata.date}`,
            italics: true, size: 22, color: '475569', font: 'Georgia',
          }),
        ],
      })
    );
  } else if (activeTemplate === 'invoice') {
    // TemplateLAB archetype – navy blue header
    docElements.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.NONE },
          bottom: { style: BorderStyle.SINGLE, size: 8, color: '003366' },
          left: { style: BorderStyle.NONE },
          right: { style: BorderStyle.NONE },
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 60, type: WidthType.PERCENTAGE },
                margins: { top: 80, bottom: 80, left: 0, right: 100 },
                children: [
                  new Paragraph({ children: [new TextRun({ text: 'EMATE ENTERPRISES', bold: true, size: 24, color: '003366', font: 'Calibri' })] }),
                  new Paragraph({ children: [new TextRun({ text: 'contact@emate.ai  |  (800) 555-0199', size: 18, color: '64748B' })] }),
                ],
              }),
              new TableCell({
                width: { size: 40, type: WidthType.PERCENTAGE },
                margins: { top: 80, bottom: 80, left: 100, right: 0 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [new TextRun({ text: docData.title.toUpperCase(), bold: true, size: 36, color: '003366', font: 'Calibri' })],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [new TextRun({ text: `DATE: ${docData.metadata.date}`, size: 18, color: '334155' })],
                  }),
                ],
              }),
            ],
          }),
        ],
      })
    );
    docElements.push(new Paragraph({ text: '', spacing: { after: 180 } }));
  } else if (activeTemplate === 'academic') {
    // Kaobook / Tufte archetype
    docElements.push(
      new Paragraph({
        spacing: { before: 0, after: 140 },
        children: [new TextRun({ text: docData.title, bold: true, size: 44, color: '0F172A', font: 'Georgia' })],
      })
    );
    if (docData.subtitle) {
      docElements.push(
        new Paragraph({
          spacing: { before: 0, after: 200 },
          children: [new TextRun({ text: docData.subtitle, italics: true, size: 24, color: '475569', font: 'Georgia' })],
        })
      );
    }
  } else {
    // Executive / Universal Report template
    docElements.push(
      new Paragraph({
        heading: HeadingLevel.TITLE,
        spacing: { before: 0, after: 80 },
        children: [new TextRun({ text: docData.title, bold: true, size: 44, color: '0F172A', font: mainFont })],
      })
    );
    if (docData.subtitle) {
      docElements.push(
        new Paragraph({
          spacing: { before: 0, after: 100 },
          children: [new TextRun({ text: docData.subtitle, italics: true, size: 24, color: '475569', font: mainFont })],
        })
      );
    }
    docElements.push(
      new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 10, color: '0F172A' } },
        spacing: { before: 40, after: 240 },
        children: [
          new TextRun({ text: 'e-Mate AI Studio', bold: true, size: 19, color: '475569', font: mainFont }),
          new TextRun({ text: '   \u2022   ', size: 19, color: '94A3B8', font: mainFont }),
          new TextRun({ text: docData.metadata.date, size: 19, color: '64748B', font: mainFont }),
        ],
      })
    );
  }

  // ── 2. Render Blocks ─────────────────────────────────────────────────────

  let skipFirstH1 = true;
  for (const block of docData.blocks) {
    if (block.type === 'h1') {
      if (skipFirstH1) { skipFirstH1 = false; continue; }
      docElements.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 320, after: 120 },
          children: [new TextRun({ text: block.text, bold: true, size: 32, color: '0F172A', font: mainFont })],
        })
      );
    } else if (block.type === 'h2') {
      if (activeTemplate === 'resume') {
        docElements.push(
          new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: '000000' } },
            spacing: { before: 240, after: 80 },
            children: [new TextRun({ text: block.text.toUpperCase(), bold: true, size: 24, color: '000000', font: 'Georgia' })],
          })
        );
      } else {
        docElements.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 260, after: 100 },
            children: [new TextRun({ text: block.text, bold: true, size: 26, color: activeTemplate === 'invoice' ? '003366' : '1E293B', font: mainFont })],
          })
        );
      }
    } else if (block.type === 'h3') {
      docElements.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 180, after: 80 },
          children: [new TextRun({ text: block.text, bold: true, size: 24, color: '334155', font: mainFont })],
        })
      );
    } else if (block.type === 'two-column-row') {
      docElements.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 65, type: WidthType.PERCENTAGE },
                  margins: { top: 30, bottom: 30, left: 0, right: 60 },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: block.left.replace(/^\*+|\*+$/g, ''),
                          bold: block.isBold || !block.isItalic,
                          italics: block.isItalic,
                          size: 21, color: '000000', font: mainFont,
                        }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: 35, type: WidthType.PERCENTAGE },
                  margins: { top: 30, bottom: 30, left: 60, right: 0 },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.RIGHT,
                      children: [
                        new TextRun({
                          text: block.right.replace(/^\*+|\*+$/g, ''),
                          bold: block.isBold,
                          italics: block.isItalic,
                          size: 21, color: '333333', font: mainFont,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        })
      );
    } else if (block.type === 'equation') {
      // Centered formula with right-aligned number
      docElements.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 90, type: WidthType.PERCENTAGE },
                  margins: { top: 120, bottom: 120, left: 0, right: 0 },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: block.formula, italics: true, size: 24, color: '0F172A', font: 'Georgia' })],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: 10, type: WidthType.PERCENTAGE },
                  margins: { top: 120, bottom: 120, left: 0, right: 0 },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.RIGHT,
                      children: [new TextRun({ text: block.number ? `(${block.number})` : '', size: 22, color: '475569', font: 'Georgia' })],
                    }),
                  ],
                }),
              ],
            }),
          ],
        })
      );
    } else if (block.type === 'callout') {
      docElements.push(
        new Paragraph({
          spacing: { before: 140, after: 160 },
          indent: { left: 300, right: 200 },
          border: { left: { style: BorderStyle.SINGLE, size: 20, color: '0F172A', space: 10 } },
          children: [
            new TextRun({ text: '\u24d8 Info: ', bold: true, size: 21, color: '0F172A', font: mainFont }),
            ...parseInlineRuns(block.text, { size: 21, color: '334155', font: mainFont }),
          ],
        })
      );
    } else if (block.type === 'blockquote') {
      docElements.push(
        new Paragraph({
          spacing: { before: 120, after: 160 },
          indent: { left: 400 },
          border: { left: { style: BorderStyle.SINGLE, size: 16, color: activeTemplate === 'invoice' ? '003366' : '2563EB', space: 10 } },
          children: parseInlineRuns(block.text, { size: 22, color: '334155', font: mainFont }),
        })
      );
    } else if (block.type === 'contact-bar') {
      docElements.push(
        new Paragraph({
          spacing: { before: 0, after: 120 },
          children: [new TextRun({ text: block.items.join('   |   '), size: 19, color: '333333', font: 'Calibri' })],
        })
      );
    } else if (block.type === 'bullet-list') {
      for (const item of block.items) {
        docElements.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { before: 30, after: 40, line: 260 },
            children: parseInlineRuns(item, { size: 21, color: '1E293B', font: mainFont }),
          })
        );
      }
      docElements.push(new Paragraph({ text: '', spacing: { after: 60 } }));
    } else if (block.type === 'ordered-list') {
      block.items.forEach((item, numIdx) => {
        docElements.push(
          new Paragraph({
            spacing: { before: 30, after: 40, line: 260 },
            indent: { left: 360 },
            children: [
              new TextRun({ text: `${numIdx + 1}.  `, bold: true, color: '0F172A', size: 21, font: mainFont }),
              ...parseInlineRuns(item, { size: 21, color: '1E293B', font: mainFont }),
            ],
          })
        );
      });
      docElements.push(new Paragraph({ text: '', spacing: { after: 60 } }));
    } else if (block.type === 'table') {
      const { headers, rows } = block.data;
      if (headers.length > 0) {
        const isNavyHeader = activeTemplate === 'invoice';
        const headerBg = isNavyHeader ? '003366' : 'F1F5F9';
        const headerTextColor = isNavyHeader ? 'FFFFFF' : '0F172A';
        const tableRows: TableRow[] = [
          new TableRow({
            tableHeader: true,
            children: headers.map(
              (h) => new TableCell({
                shading: { fill: headerBg },
                margins: { top: 120, bottom: 120, left: 140, right: 140 },
                children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 20, color: headerTextColor, font: mainFont })] })],
              })
            ),
          }),
          ...rows.map((row, rIdx) =>
            new TableRow({
              children: row.map((cell) =>
                new TableCell({
                  shading: { fill: rIdx % 2 === 1 ? 'F8FAFC' : 'FFFFFF' },
                  margins: { top: 90, bottom: 90, left: 140, right: 140 },
                  children: [new Paragraph({ children: parseInlineRuns(cell, { size: 20, color: '1E293B', font: mainFont }) })],
                })
              ),
            })
          ),
        ];
        docElements.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: tableBorder, rows: tableRows }));
        docElements.push(new Paragraph({ text: '', spacing: { after: 160 } }));
      }
    } else if (block.type === 'divider') {
      docElements.push(
        new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' } }, spacing: { before: 120, after: 160 } })
      );
    } else {
      // Normal paragraph
      docElements.push(
        new Paragraph({
          spacing: { after: 120, line: 260 },
          children: parseInlineRuns(block.text, { size: 22, color: '1E293B', font: mainFont }),
        })
      );
    }
  }

  // ── 3. Section: margins, headers, footers ────────────────────────────────

  const footerAlignment = activeTemplate === 'assignment' ? AlignmentType.CENTER : AlignmentType.RIGHT;

  return new Document({
    sections: [
      {
        properties: {
          page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
        },
        headers: {
          default: new Header({
            children: activeTemplate === 'resume' ? [] : [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: docData.title, size: 16, color: '94A3B8', font: mainFont })],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: footerAlignment,
                children: activeTemplate === 'assignment' ? [
                  new TextRun({ children: [PageNumber.CURRENT], size: 18, color: '475569', font: 'Georgia' }),
                ] : [
                  new TextRun({ text: 'e-Mate AI Studio   |   Page ', size: 16, color: '94A3B8', font: mainFont }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '94A3B8', font: mainFont }),
                  new TextRun({ text: ' of ', size: 16, color: '94A3B8', font: mainFont }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: '94A3B8', font: mainFont }),
                ],
              }),
            ],
          }),
        },
        children: docElements,
      },
    ],
  });
}
