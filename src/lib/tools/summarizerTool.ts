import type { Tool } from './types';
import {
  generateDocumentSummary,
  type DocumentSummaryResult,
} from '@/lib/ingestion/summarizer';
import type { ParsedDocument } from '@/lib/ingestion/documentParser';
import type { DocumentChunk } from '@/lib/ingestion/chunker';

export interface SummarizerToolInput {
  document: ParsedDocument;
  chunks: DocumentChunk[];
  options?: {
    apiKey?: string;
    model?: string;
  };
}

/**
 * Summarizer Tool
 * Generates structured, high-yield document executive summaries during ingestion or on-demand.
 */
export const summarizerTool: Tool<SummarizerToolInput, DocumentSummaryResult> = {
  name: 'summarizer_tool',
  description:
    'Generates a high-yield executive summary and core topic outline for an entire document or reading material.',
  inputSchema: {
    type: 'object',
    properties: {
      document: {
        type: 'object',
        description: 'Parsed document metadata and extracted text.',
      },
      chunks: {
        type: 'array',
        description: 'Array of chunked segments from the document.',
      },
    },
    required: ['document', 'chunks'],
  },
  execute: async (input: SummarizerToolInput): Promise<DocumentSummaryResult> => {
    return generateDocumentSummary(input.document, input.chunks, input.options);
  },
};
