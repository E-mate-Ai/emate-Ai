import type { Tool } from './types';
import type { RetrievedChunk, Citation } from '@/lib/prompts';

export interface CitationFormatterInput {
  chunks: RetrievedChunk[];
  maxPreviewChars?: number;
}

/**
 * Citation Formatter Tool
 * Transforms raw retrieved context chunks into standardized structured Citation objects.
 */
export const citationFormatterTool: Tool<CitationFormatterInput, Citation[]> = {
  name: 'citation_formatter_tool',
  description:
    'Transforms retrieved context chunks into standardized structured Citation metadata objects for response grounding.',
  inputSchema: {
    type: 'object',
    properties: {
      chunks: {
        type: 'array',
        description: 'Array of retrieved chunks to format citations for.',
      },
      maxPreviewChars: {
        type: 'number',
        description: 'Maximum characters for preview text snippets (default: 180).',
      },
    },
    required: ['chunks'],
  },
  execute: async (input: CitationFormatterInput): Promise<Citation[]> => {
    const { chunks, maxPreviewChars = 180 } = input;
    if (!chunks || chunks.length === 0) return [];

    return chunks.map((c: any) => ({
      sourceFileId: c.metadata?.document_id || c.source,
      sourceFileName: c.source,
      page: c.pageOrSection,
      section: typeof c.pageOrSection === 'string' ? c.pageOrSection : undefined,
      chunkId: c.id,
      previewText: typeof c.text === 'string' ? c.text.slice(0, maxPreviewChars) : undefined,
      relevanceScore: c.relevanceScore,
    }));
  },
};
