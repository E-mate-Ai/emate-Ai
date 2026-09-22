import zlib from 'zlib';

/**
 * e-Mate AI — Document Ingestion & Parsing Engine
 * Supports PDF, DOCX, TXT, MD, JSON, CSV files with page/section structure preservation.
 */

export type SupportedFileType = 'pdf' | 'docx' | 'txt' | 'md' | 'json' | 'csv' | 'other';

export interface PageMapEntry {
  pageNumber: number;
  text: string;
  characterCount: number;
}

export interface SectionMapEntry {
  heading: string;
  level: number;
  text: string;
  pageNumber?: number;
}

export interface ParsedDocument {
  fileName: string;
  fileType: SupportedFileType;
  mimeType: string;
  fileSizeBytes: number;
  extractedText: string;
  pageMap?: PageMapEntry[];
  sectionMap?: SectionMapEntry[];
  totalCharacters: number;
  totalEstimatedWords: number;
  uploadedAt: string;
}

export class DocumentParsingError extends Error {
  public readonly code: string;
  public readonly fileName: string;
  public readonly fileType: SupportedFileType;
  public readonly statusCode: number;

  constructor(message: string, options: { code: string; fileName: string; fileType: SupportedFileType; statusCode?: number }) {
    super(message);
    this.name = 'DocumentParsingError';
    this.code = options.code;
    this.fileName = options.fileName;
    this.fileType = options.fileType;
    this.statusCode = options.statusCode ?? 400;
  }
}

/**
 * Detect file type from file extension or mime type
 */
export function detectFileType(fileName: string, mimeType?: string): SupportedFileType {
  const ext = fileName.toLowerCase().split('.').pop() || '';

  if (ext === 'pdf' || mimeType === 'application/pdf') return 'pdf';
  if (ext === 'docx' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx';
  if (ext === 'txt' || mimeType === 'text/plain') return 'txt';
  if (ext === 'md' || ext === 'markdown' || mimeType === 'text/markdown') return 'md';
  if (ext === 'json' || mimeType === 'application/json') return 'json';
  if (ext === 'csv' || mimeType === 'text/csv') return 'csv';

  return 'other';
}

// ── 1. Text / Markdown / Plain Document Parser ───────────────────────────────

export function parsePlainText(
  buffer: Buffer,
  fileName: string,
  fileType: SupportedFileType,
  mimeType: string
): ParsedDocument {
  // Strip UTF-8 BOM if present
  let text = buffer.toString('utf-8');
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }

  // Normalize line endings
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();

  if (!text) {
    throw new DocumentParsingError(`File "${fileName}" contains no readable text.`, {
      code: 'EMPTY_FILE',
      fileName,
      fileType,
      statusCode: 422,
    });
  }

  const sectionMap: SectionMapEntry[] = [];

  if (fileType === 'md' || fileName.endsWith('.md')) {
    // Extract markdown heading sections (#, ##, ###)
    const lines = text.split('\n');
    let currentHeading = 'Introduction';
    let currentLevel = 1;
    let currentSectionLines: string[] = [];

    for (const line of lines) {
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        if (currentSectionLines.length > 0) {
          sectionMap.push({
            heading: currentHeading,
            level: currentLevel,
            text: currentSectionLines.join('\n').trim(),
          });
          currentSectionLines = [];
        }
        currentLevel = headingMatch[1].length;
        currentHeading = headingMatch[2].trim();
      } else {
        currentSectionLines.push(line);
      }
    }

    if (currentSectionLines.length > 0) {
      sectionMap.push({
        heading: currentHeading,
        level: currentLevel,
        text: currentSectionLines.join('\n').trim(),
      });
    }
  }

  const words = text.split(/\s+/).filter(Boolean).length;

  return {
    fileName,
    fileType,
    mimeType,
    fileSizeBytes: buffer.length,
    extractedText: text,
    sectionMap: sectionMap.length > 0 ? sectionMap : undefined,
    totalCharacters: text.length,
    totalEstimatedWords: words,
    uploadedAt: new Date().toISOString(),
  };
}

// ── 2. DOCX Parser (Powered by mammoth) ──────────────────────────────────────

/**
 * Extracts raw text and heading structure from DOCX files using mammoth.
 */
export async function parseDocx(buffer: Buffer, fileName: string, mimeType: string): Promise<ParsedDocument> {
  try {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    const text = (result.value || '').trim();

    if (!text) {
      throw new Error('DOCX contains no extractable text.');
    }

    // Extract headings/sections via markdown conversion where possible
    let sectionMap: SectionMapEntry[] | undefined;
    try {
      const mdResult = await (mammoth as any).convertToMarkdown({ buffer });
      if (mdResult.value) {
        const lines = mdResult.value.split('\n');
        const sections: SectionMapEntry[] = [];
        let currentHeading = 'Document Start';
        let currentLevel = 1;
        let currentLines: string[] = [];

        for (const line of lines) {
          const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
          if (headingMatch) {
            if (currentLines.length > 0) {
              sections.push({
                heading: currentHeading,
                level: currentLevel,
                text: currentLines.join('\n').trim(),
              });
              currentLines = [];
            }
            currentLevel = headingMatch[1].length;
            currentHeading = headingMatch[2].trim();
          } else {
            currentLines.push(line);
          }
        }
        if (currentLines.length > 0) {
          sections.push({
            heading: currentHeading,
            level: currentLevel,
            text: currentLines.join('\n').trim(),
          });
        }
        if (sections.length > 0) {
          sectionMap = sections;
        }
      }
    } catch {
      // Markdown conversion is a nice-to-have for section hierarchy; fallback to raw text
    }

    const words = text.split(/\s+/).filter(Boolean).length;

    return {
      fileName,
      fileType: 'docx',
      mimeType,
      fileSizeBytes: buffer.length,
      extractedText: text,
      sectionMap,
      totalCharacters: text.length,
      totalEstimatedWords: words,
      uploadedAt: new Date().toISOString(),
    };
  } catch (err: any) {
    if (err instanceof DocumentParsingError) throw err;
    throw new DocumentParsingError(
      `Failed to parse DOCX file "${fileName}": ${err?.message || 'Corrupt or unsupported format'}`,
      {
        code: 'DOCX_PARSE_FAILED',
        fileName,
        fileType: 'docx',
        statusCode: 422,
      }
    );
  }
}

// ── 3. PDF Parser (Powered by pdf-parse) ─────────────────────────────────────

// Polyfill browser canvas globals required by pdfjs-dist / pdf-parse in serverless environments
function ensureCanvasGlobals() {
  if (typeof globalThis.DOMMatrix === 'undefined') {
    (globalThis as any).DOMMatrix = class DOMMatrix {
      a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
      m11 = 1; m12 = 0; m13 = 0; m14 = 0;
      m21 = 0; m22 = 1; m23 = 0; m24 = 0;
      m31 = 0; m32 = 0; m33 = 1; m34 = 0;
      m41 = 0; m42 = 0; m43 = 0; m44 = 1;
      is2D = true;
      isIdentity = true;
      multiply() { return this; }
      translate() { return this; }
      scale() { return this; }
      rotate() { return this; }
      inverse() { return this; }
      transformPoint(p: any) { return p; }
    };
  }
  if (typeof globalThis.Path2D === 'undefined') {
    (globalThis as any).Path2D = class Path2D {
      addPath() {}
      closePath() {}
      moveTo() {}
      lineTo() {}
      bezierCurveTo() {}
      quadraticCurveTo() {}
      arc() {}
      arcTo() {}
      ellipse() {}
      rect() {}
    };
  }
  if (typeof globalThis.ImageData === 'undefined') {
    (globalThis as any).ImageData = class ImageData {
      data: Uint8ClampedArray;
      width: number;
      height: number;
      constructor(widthOrData: any, height?: number) {
        if (typeof widthOrData === 'number') {
          this.width = widthOrData;
          this.height = height || 0;
          this.data = new Uint8ClampedArray(this.width * this.height * 4);
        } else {
          this.data = widthOrData;
          this.width = height || 0;
          this.height = this.data.length / (this.width * 4) || 0;
        }
      }
    };
  }
}

/**
 * Extracts text and per-page boundaries from PDF files using pdf-parse.
 */
export async function parsePdf(buffer: Buffer, fileName: string, mimeType: string): Promise<ParsedDocument> {
  try {
    ensureCanvasGlobals();
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();

    const pages: PageMapEntry[] = (result.pages || [])
      .map((page: any) => ({
        pageNumber: page.num,
        text: (page.text || '').trim(),
        characterCount: (page.text || '').trim().length,
      }))
      .filter((p: PageMapEntry) => p.text.length > 0);

    const fullText = (result.text || '').trim();

    if (!fullText) {
      throw new Error('PDF contains no extractable text (it may be scanned/image-only or encrypted).');
    }

    const words = fullText.split(/\s+/).filter(Boolean).length;

    return {
      fileName,
      fileType: 'pdf',
      mimeType,
      fileSizeBytes: buffer.length,
      extractedText: fullText,
      pageMap: pages.length > 0 ? pages : undefined,
      totalCharacters: fullText.length,
      totalEstimatedWords: words,
      uploadedAt: new Date().toISOString(),
    };
  } catch (err: any) {
    console.error('PDF parsing error detail:', err);
    if (err instanceof DocumentParsingError) throw err;
    throw new DocumentParsingError(
      `Failed to parse PDF "${fileName}": ${err?.message || 'Corrupt or unsupported PDF file.'}`,
      {
        code: 'PDF_PARSE_FAILED',
        fileName,
        fileType: 'pdf',
        statusCode: 422,
      }
    );
  }
}

// ── 4. Unified Entry Point ───────────────────────────────────────────────────

export interface ParseDocumentOptions {
  buffer: Buffer;
  fileName: string;
  mimeType?: string;
}

/**
 * Unified document parser function.
 * Dispatches to the appropriate parser based on file type and guarantees
 * a consistent ParsedDocument output.
 */
export async function parseDocument(options: ParseDocumentOptions): Promise<ParsedDocument> {
  const { buffer, fileName, mimeType = 'application/octet-stream' } = options;

  if (!buffer || buffer.length === 0) {
    throw new DocumentParsingError(`Uploaded file "${fileName}" is empty.`, {
      code: 'EMPTY_FILE',
      fileName,
      fileType: 'other',
      statusCode: 400,
    });
  }

  const fileType = detectFileType(fileName, mimeType);

  switch (fileType) {
    case 'pdf':
      return parsePdf(buffer, fileName, mimeType);

    case 'docx':
      return parseDocx(buffer, fileName, mimeType);

    case 'txt':
    case 'md':
    case 'json':
    case 'csv':
      return parsePlainText(buffer, fileName, fileType, mimeType);

    default:
      // Attempt UTF-8 text extraction for other extensions
      try {
        return parsePlainText(buffer, fileName, 'other', mimeType);
      } catch {
        throw new DocumentParsingError(
          `Unsupported file format for "${fileName}". Please upload PDF, DOCX, TXT, or Markdown documents.`,
          {
            code: 'UNSUPPORTED_FORMAT',
            fileName,
            fileType: 'other',
            statusCode: 415,
          }
        );
      }
  }
}
