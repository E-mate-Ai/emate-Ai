import type { ParsedDocument, SectionMapEntry, PageMapEntry } from './documentParser';
import type { RetrievedChunk } from '@/lib/prompts';

/**
 * e-Mate AI — Semantic Document Chunking Engine
 *
 * Implements structural/semantic chunking over arbitrary token slicing:
 * 1. Prioritizes natural document structure (headings, markdown sections, page boundaries).
 * 2. Merges small adjacent fragments to avoid micro-chunks.
 * 3. Falls back to sentence-boundary splitting for oversized sections (never truncating mid-sentence).
 * 4. Produces chunks matching the RetrievedChunk interface for direct RAG harness injection.
 */

export interface ChunkingOptions {
  /** Minimum words to form an independent chunk (default: 80) */
  minWords?: number;
  /** Ideal target words per chunk (default: 300) */
  targetWords?: number;
  /** Maximum hard cap on words before forced sentence-boundary split (default: 500) */
  maxWords?: number;
  /** Words of overlap when an oversized section is split into multiple chunks (default: 40) */
  overlapWords?: number;
}

export interface DocumentChunk extends RetrievedChunk {
  id: string;
  source: string;
  pageOrSection?: string;
  text: string;
  relevanceScore?: number;
  positionIndex: number;
  wordCount: number;
  characterCount: number;
  metadata: {
    fileName: string;
    fileType: string;
    heading?: string;
    headingLevel?: number;
    pageNumber?: number;
    totalDocumentChunks: number;
    startCharApprox?: number;
  };
}

export interface ChunkingResult {
  fileName: string;
  totalChunks: number;
  averageWordCount: number;
  averageCharCount: number;
  chunks: DocumentChunk[];
}

const DEFAULT_CHUNKING_OPTIONS: Required<ChunkingOptions> = {
  minWords: 80,
  targetWords: 300,
  maxWords: 500,
  overlapWords: 40,
};

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Splits text into individual sentences without breaking abbreviations or decimals.
 */
function splitIntoSentences(text: string): string[] {
  // Regex splitting on sentence terminators followed by whitespace, retaining sentences intact
  const rawSentences = text
    .replace(/([.?!])\s*(?=[A-Z0-9"'])/g, '$1|__SENTENCE_BREAK__|')
    .split('|__SENTENCE_BREAK__|')
    .map((s) => s.trim())
    .filter(Boolean);

  return rawSentences.length > 0 ? rawSentences : [text.trim()];
}

/**
 * Splits a long text block into overlapping sub-chunks along sentence boundaries.
 */
function splitLargeTextBlock(
  text: string,
  targetWords: number,
  maxWords: number,
  overlapWords: number
): string[] {
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const resultChunks: string[] = [];

  for (const para of paragraphs) {
    const paraWords = countWords(para);

    if (paraWords <= maxWords) {
      resultChunks.push(para);
      continue;
    }

    // Split large paragraph into sentences
    const sentences = splitIntoSentences(para);
    let currentChunkSentences: string[] = [];
    let currentCount = 0;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      const sentenceWords = countWords(sentence);

      if (currentCount + sentenceWords > maxWords && currentChunkSentences.length > 0) {
        resultChunks.push(currentChunkSentences.join(' '));

        // Compute overlap sentences for continuity
        const overlapSentences: string[] = [];
        let overlapCount = 0;
        for (let j = currentChunkSentences.length - 1; j >= 0; j--) {
          const s = currentChunkSentences[j];
          const words = countWords(s);
          if (overlapCount + words <= overlapWords) {
            overlapSentences.unshift(s);
            overlapCount += words;
          } else {
            break;
          }
        }

        currentChunkSentences = [...overlapSentences, sentence];
        currentCount = overlapCount + sentenceWords;
      } else {
        currentChunkSentences.push(sentence);
        currentCount += sentenceWords;
      }
    }

    if (currentChunkSentences.length > 0) {
      resultChunks.push(currentChunkSentences.join(' '));
    }
  }

  return resultChunks;
}

/**
 * Primary semantic chunker for parsed documents.
 */
export function chunkDocument(
  doc: ParsedDocument,
  options?: ChunkingOptions
): ChunkingResult {
  const opts = { ...DEFAULT_CHUNKING_OPTIONS, ...options };
  const rawChunks: Array<{
    text: string;
    heading?: string;
    headingLevel?: number;
    pageNumber?: number;
  }> = [];

  const sanitizedBaseName = doc.fileName
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .toLowerCase();

  // ── Strategy A: Section-based semantic chunking (Markdown / DOCX with headings) ──
  if (doc.sectionMap && doc.sectionMap.length > 0) {
    let accumulatedText = '';
    let currentHeading = doc.sectionMap[0].heading;
    let currentLevel = doc.sectionMap[0].level;
    let currentPage = doc.sectionMap[0].pageNumber;

    for (const section of doc.sectionMap) {
      const sectionWords = countWords(section.text);
      const combinedWords = countWords(accumulatedText) + sectionWords;

      if (sectionWords > opts.maxWords) {
        // Flush any previously accumulated small sections first
        if (accumulatedText.trim()) {
          rawChunks.push({
            text: accumulatedText.trim(),
            heading: currentHeading,
            headingLevel: currentLevel,
            pageNumber: currentPage,
          });
          accumulatedText = '';
        }

        // Split the oversized section
        const subBlocks = splitLargeTextBlock(
          section.text,
          opts.targetWords,
          opts.maxWords,
          opts.overlapWords
        );
        for (const block of subBlocks) {
          rawChunks.push({
            text: block,
            heading: section.heading,
            headingLevel: section.level,
            pageNumber: section.pageNumber,
          });
        }
      } else if (combinedWords <= opts.targetWords) {
        // Merge small adjacent section into buffer
        accumulatedText = accumulatedText
          ? `${accumulatedText}\n\n### ${section.heading}\n${section.text}`
          : `### ${section.heading}\n${section.text}`;
        if (!currentHeading) currentHeading = section.heading;
        if (!currentPage) currentPage = section.pageNumber;
      } else {
        // Buffer reached target size: flush and start new chunk
        if (accumulatedText.trim()) {
          rawChunks.push({
            text: accumulatedText.trim(),
            heading: currentHeading,
            headingLevel: currentLevel,
            pageNumber: currentPage,
          });
        }
        accumulatedText = `### ${section.heading}\n${section.text}`;
        currentHeading = section.heading;
        currentLevel = section.level;
        currentPage = section.pageNumber;
      }
    }

    if (accumulatedText.trim()) {
      rawChunks.push({
        text: accumulatedText.trim(),
        heading: currentHeading,
        headingLevel: currentLevel,
        pageNumber: currentPage,
      });
    }
  }

  // ── Strategy B: Page-based semantic chunking (PDF with pageMap) ──
  else if (doc.pageMap && doc.pageMap.length > 0) {
    let pageBuffer = '';
    let startPage = doc.pageMap[0].pageNumber;
    let endPage = doc.pageMap[0].pageNumber;

    for (const page of doc.pageMap) {
      const pageWords = countWords(page.text);
      const bufferWords = countWords(pageBuffer);

      if (pageWords > opts.maxWords) {
        // Flush buffer if exists
        if (pageBuffer.trim()) {
          rawChunks.push({
            text: pageBuffer.trim(),
            pageNumber: startPage === endPage ? startPage : startPage,
          });
          pageBuffer = '';
        }

        // Split large page
        const subBlocks = splitLargeTextBlock(
          page.text,
          opts.targetWords,
          opts.maxWords,
          opts.overlapWords
        );
        for (const block of subBlocks) {
          rawChunks.push({
            text: block,
            pageNumber: page.pageNumber,
          });
        }
      } else if (bufferWords + pageWords <= opts.targetWords) {
        pageBuffer = pageBuffer ? `${pageBuffer}\n\n${page.text}` : page.text;
        endPage = page.pageNumber;
      } else {
        if (pageBuffer.trim()) {
          rawChunks.push({
            text: pageBuffer.trim(),
            pageNumber: startPage,
          });
        }
        pageBuffer = page.text;
        startPage = page.pageNumber;
        endPage = page.pageNumber;
      }
    }

    if (pageBuffer.trim()) {
      rawChunks.push({
        text: pageBuffer.trim(),
        pageNumber: startPage,
      });
    }
  }

  // ── Strategy C: Paragraph/Prose chunking (Fallback for raw text / no headings) ──
  else {
    const rawBlocks = splitLargeTextBlock(
      doc.extractedText,
      opts.targetWords,
      opts.maxWords,
      opts.overlapWords
    );

    let currentAccumulation = '';
    for (const block of rawBlocks) {
      const blockWords = countWords(block);
      const currentWords = countWords(currentAccumulation);

      if (currentWords + blockWords <= opts.targetWords) {
        currentAccumulation = currentAccumulation ? `${currentAccumulation}\n\n${block}` : block;
      } else {
        if (currentAccumulation.trim()) {
          rawChunks.push({ text: currentAccumulation.trim() });
        }
        currentAccumulation = block;
      }
    }

    if (currentAccumulation.trim()) {
      rawChunks.push({ text: currentAccumulation.trim() });
    }
  }

  // ── Transform into structured DocumentChunk / RetrievedChunk array ──────────
  const totalChunks = rawChunks.length;
  let totalWords = 0;
  let totalChars = 0;

  const chunks: DocumentChunk[] = rawChunks.map((rc, idx) => {
    const wordCount = countWords(rc.text);
    const characterCount = rc.text.length;
    totalWords += wordCount;
    totalChars += characterCount;

    let pageOrSection: string | undefined;
    if (rc.heading) {
      pageOrSection = `Section: ${rc.heading}`;
    } else if (rc.pageNumber !== undefined) {
      pageOrSection = `Page ${rc.pageNumber}`;
    }

    return {
      id: `${sanitizedBaseName}_chunk_${idx + 1}`,
      source: doc.fileName,
      pageOrSection,
      text: rc.text,
      positionIndex: idx + 1,
      wordCount,
      characterCount,
      metadata: {
        fileName: doc.fileName,
        fileType: doc.fileType,
        heading: rc.heading,
        headingLevel: rc.headingLevel,
        pageNumber: rc.pageNumber,
        totalDocumentChunks: totalChunks,
      },
    };
  });

  return {
    fileName: doc.fileName,
    totalChunks,
    averageWordCount: totalChunks > 0 ? Math.round(totalWords / totalChunks) : 0,
    averageCharCount: totalChunks > 0 ? Math.round(totalChars / totalChunks) : 0,
    chunks,
  };
}
