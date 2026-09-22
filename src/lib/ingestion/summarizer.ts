import { openRouterCompletion } from '@/lib/openrouter';
import type { ParsedDocument } from './documentParser';
import type { DocumentChunk } from './chunker';

export interface DocumentSummaryResult {
  summary: string;
  sectionSummaries?: Record<string, string>;
  isExtractiveFallback?: boolean;
}

/**
 * Generates an executive document-level summary (and optional section summaries)
 * at ingestion time using OpenRouter fast model with local extractive fallback.
 */
export async function generateDocumentSummary(
  document: ParsedDocument,
  chunks: DocumentChunk[],
  options?: { apiKey?: string; model?: string }
): Promise<DocumentSummaryResult> {
  const apiKey =
    options?.apiKey ||
    process.env.OPENROUTER_SERVER_FREE_KEY ||
    process.env.OPENROUTER_API_KEY;

  // Build condensed source text representing the document (up to ~3500 words)
  let sampledText = '';
  if (chunks.length <= 6) {
    sampledText = chunks.map((c) => c.text).join('\n\n');
  } else {
    // Sample first 3 chunks (introduction/scope), middle section headings/chunks, and last chunk
    const head = chunks.slice(0, 3).map((c) => c.text);
    const middle = chunks
      .slice(3, -2)
      .filter((c) => c.metadata?.heading || c.positionIndex % 3 === 0)
      .slice(0, 6)
      .map((c) => `[Section ${c.pageOrSection || ''}]: ${c.text.slice(0, 300)}...`);
    const tail = chunks.slice(-1).map((c) => c.text);
    sampledText = [...head, ...middle, ...tail].join('\n\n');
  }

  if (apiKey && apiKey !== 'your-openrouter-api-key-here' && sampledText.trim().length > 50) {
    try {
      const prompt = `You are an expert academic summarizer. Generate a concise, high-yield executive summary for the document "${document.fileName}".
Include:
1. 🎯 Overview: 2-3 sentence synthesis of what this document covers.
2. 🔑 Key Topics: Bullet points of the core modules, chapters, or concepts.
3. 📌 Exam / Practical Significance: 1-2 sentence takeaway of the most important takeaways.

Document Text:
"""
${sampledText.slice(0, 14000)}
"""`;

      const response = await openRouterCompletion(apiKey, {
        model: options?.model || 'google/gemini-2.0-flash',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 600,
      });

      const choiceContent = (response as any)?.choices?.[0]?.message?.content;
      if (typeof choiceContent === 'string' && choiceContent.trim().length > 20) {
        return {
          summary: choiceContent.trim(),
        };
      }
    } catch (err) {
      console.warn('[Document Summarizer] LLM summary generation failed, falling back to extractive summary:', err);
    }
  }

  // Local extractive fallback
  const leadText = document.extractedText?.slice(0, 450) || chunks[0]?.text?.slice(0, 450) || 'Study document.';
  const headings = chunks
    .map((c) => c.metadata?.heading)
    .filter((h): h is string => Boolean(h && h.trim()))
    .slice(0, 5);

  const fallbackSummary = `🎯 Overview: ${document.fileName} (${document.fileType.toUpperCase()}, ${chunks.length} sections, ~${document.totalEstimatedWords || 0} words).\n\n` +
    `🔑 Content Highlights: ${leadText.replace(/\s+/g, ' ').trim()}...\n\n` +
    (headings.length > 0 ? `📌 Main Sections: ${headings.join(' • ')}` : '');

  return {
    summary: fallbackSummary,
    isExtractiveFallback: true,
  };
}
