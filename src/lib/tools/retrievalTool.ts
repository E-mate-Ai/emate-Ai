import type { Tool } from './types';
import {
  retrieveAndRerankChunks,
  type TopKRetrievalOptions,
  type TopKRetrievalResult,
} from '@/lib/retrieval/topKRetrieval';

/**
 * Retrieval Tool
 * Executes two-stage dense semantic retrieval (pgvector) + hybrid re-ranking,
 * with intent-based summarize-then-retrieve routing for high-level queries.
 */
export const retrievalTool: Tool<TopKRetrievalOptions, TopKRetrievalResult> = {
  name: 'retrieval_tool',
  description:
    'Retrieves and re-ranks top-K relevant study material chunks from indexed course documents based on dense vector similarity and keyword overlap.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query or academic question to retrieve context for.',
      },
      k: {
        type: 'number',
        description: 'Number of top re-ranked chunks to return (default: 4-5).',
      },
      filterSubject: {
        type: 'string',
        description: 'Optional subject filter to restrict retrieval to a specific course.',
      },
      filterUserId: {
        type: 'string',
        description: 'Optional user ID to filter private uploaded sources.',
      },
    },
    required: ['query'],
  },
  execute: async (input: TopKRetrievalOptions): Promise<TopKRetrievalResult> => {
    return retrieveAndRerankChunks(input);
  },
};
