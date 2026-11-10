/**
 * Document Scanner & Conversion Engine
 * Automatically scans and identifies uploaded documents:
 * - If spreadsheet/tabular/excel content -> converts to editable .xls model
 * - If normal document/report/prose -> converts to editable .docx model
 */

import { parseTextToSpreadsheet, spreadsheetToMarkdown, type SpreadsheetData } from './spreadsheetExport';

export interface ScannedDocumentResult {
  detectedType: 'spreadsheet' | 'document';
  format: 'xls' | 'docx';
  title: string;
  summary: string;
  confidence: number;
  spreadsheetData?: SpreadsheetData;
  documentMarkdown: string;
}

export function detectIfSpreadsheetContent(
  fileName: string,
  mimeType: string = '',
  text: string = ''
): { isSpreadsheet: boolean; confidence: number; reason: string } {
  const ext = (fileName.split('.').pop() || '').toLowerCase();
  const lowerMime = mimeType.toLowerCase();
  const lowerText = text.toLowerCase();

  // 1. Direct file extension / mime match
  if (['xls', 'xlsx', 'csv', 'tsv'].includes(ext) || lowerMime.includes('spreadsheet') || lowerMime.includes('excel') || lowerMime.includes('csv')) {
    return { isSpreadsheet: true, confidence: 0.98, reason: 'File format indicates spreadsheet data' };
  }

  // 2. High density of Markdown table syntax (| ... | ... |)
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const tableLines = lines.filter((l) => l.startsWith('|') && l.endsWith('|'));
  if (tableLines.length >= 3 && tableLines.length / Math.max(1, lines.length) > 0.25) {
    return { isSpreadsheet: true, confidence: 0.92, reason: 'High density of tabular matrix structures' };
  }

  // 3. Tabular CSV-like lines with numbers
  const commaSeparatedLines = lines.filter((l) => (l.match(/,/g) || []).length >= 2);
  const numbersCount = (text.match(/\b\d+(\.\d+)?\b/g) || []).length;
  const wordsCount = (text.match(/\b[a-zA-Z]{3,}\b/g) || []).length;

  if (commaSeparatedLines.length >= 4 && numbersCount > 8 && numbersCount / Math.max(1, wordsCount) > 0.3) {
    return { isSpreadsheet: true, confidence: 0.88, reason: 'Numeric tabular/CSV ledger format detected' };
  }

  // 4. Financial / spreadsheet keywords with tables
  const spreadsheetKeywords = [
    'balance sheet',
    'income statement',
    'profit and loss',
    'ledger',
    'inventory list',
    'price list',
    'subtotal',
    'total amount',
    'unit price',
    'quantity',
    'qty',
    'debit',
    'credit',
    'column',
  ];
  const matchedKeywords = spreadsheetKeywords.filter((kw) => lowerText.includes(kw));
  if (matchedKeywords.length >= 3 && (tableLines.length >= 2 || commaSeparatedLines.length >= 3)) {
    return { isSpreadsheet: true, confidence: 0.85, reason: 'Financial / spreadsheet data terminology detected' };
  }

  return { isSpreadsheet: false, confidence: 0.9, reason: 'Standard narrative document structure' };
}

/**
 * Scans, classifies, and converts any uploaded document text into an editable model.
 */
export function scanAndConvertDocument(
  fileName: string,
  mimeType: string,
  rawContent: string
): ScannedDocumentResult {
  const cleanTitle = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ');
  const title = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

  const evaluation = detectIfSpreadsheetContent(fileName, mimeType, rawContent);

  if (evaluation.isSpreadsheet) {
    const spreadsheet = parseTextToSpreadsheet(rawContent, title);
    const markdown = spreadsheetToMarkdown(spreadsheet);

    return {
      detectedType: 'spreadsheet',
      format: 'xls',
      title,
      summary: `Spreadsheet with ${spreadsheet.headers.length} columns and ${spreadsheet.rows.length} rows. Ready to edit and export as .xls.`,
      confidence: evaluation.confidence,
      spreadsheetData: spreadsheet,
      documentMarkdown: `# ${title}\n\n*Scanned & Converted Spreadsheet Data*\n\n${markdown}`,
    };
  }

  // Normal Document -> Format as Executive / Standard Document for .docx
  let formattedMarkdown = rawContent.trim();
  if (!formattedMarkdown.startsWith('#')) {
    formattedMarkdown = `# ${title}\n\n*Converted Editable Document*\n\n${formattedMarkdown}`;
  }

  const wordCount = formattedMarkdown.split(/\s+/).filter(Boolean).length;

  return {
    detectedType: 'document',
    format: 'docx',
    title,
    summary: `Standard document containing ~${wordCount} words. Ready to edit and export as .docx.`,
    confidence: evaluation.confidence,
    documentMarkdown: formattedMarkdown,
  };
}

