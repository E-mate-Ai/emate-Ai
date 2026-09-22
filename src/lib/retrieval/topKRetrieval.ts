import type { SupabaseClient } from '@supabase/supabase-js';
import type { RetrievedChunk } from '@/lib/prompts';
import { generateEmbedding } from './embeddings';
import { searchSimilarChunks } from './vectorSearch';
import { rerankChunks, type RerankOptions } from './reranker';
import { classifyQueryIntent, type QueryIntent } from './queryClassifier';
import { createClient as createSupabaseServer } from '@/lib/supabase/server';

/**
 * e-Mate AI — Top-K Semantic Retrieval & Summarize-then-Retrieve Engine
 * Implements intent routing (broad executive summary vs fine-grained chunks)
 * followed by two-stage dense pgvector retrieval + hybrid lexical/structural re-ranking.
 */

export interface TopKRetrievalOptions {
  /** The search query or question from the student */
  query: string;
  /** Number of final chunks to return after re-ranking (default: 5) */
  k?: number;
  /** Number of candidate chunks to retrieve in stage 1 before re-ranking (default: max(k * 3, 15)) */
  candidateK?: number;
  /** Filter to a specific document ID (optional) */
  filterDocumentId?: string;
  /** Filter to a specific user ID (optional) */
  filterUserId?: string;
  /** Filter to a specific subject (optional) */
  filterSubject?: string;
  /** Minimum similarity score threshold (0.0 - 1.0, default: 0.0) */
  similarityThreshold?: number;
  /** Optional custom re-ranking weights */
  rerankOptions?: RerankOptions;
  /** Whether to apply stage-2 re-ranking (default: true) */
  enableReranking?: boolean;
  /** Whether to enable summarize-then-retrieve routing for broad queries (default: true) */
  enableSummarizeThenRetrieve?: boolean;
  /** Optional pre-instantiated Supabase client */
  supabaseClient?: SupabaseClient;
}

export interface TopKRetrievalResult {
  query: string;
  queryIntent: QueryIntent;
  k: number;
  candidatesFetched: number;
  totalRetrieved: number;
  isReranked: boolean;
  isSummarizedPath: boolean;
  executionTimeMs: number;
  chunks: RetrievedChunk[];
}

/**
 * Executes the summarize-then-retrieve or fine-grained retrieval pipeline:
 * 1. Intent Classification: Detects if query is broad (summary/overview) vs narrow (factual detail).
 * 2. Broad Path: Injects stored document-level summary blocks + high-yield anchor chunks.
 * 3. Narrow Path: Executes Stage 1 dense vector retrieval + Stage 2 hybrid lexical/structural re-ranking.
 */
export async function retrieveAndRerankChunks(
  options: TopKRetrievalOptions
): Promise<TopKRetrievalResult> {
  const startTime = Date.now();
  const {
    query,
    k = 5,
    candidateK = Math.max(k * 3, 15),
    filterDocumentId,
    filterUserId,
    filterSubject,
    similarityThreshold = 0.0,
    rerankOptions,
    enableReranking = true,
    enableSummarizeThenRetrieve = true,
    supabaseClient,
  } = options;

  if (!query || query.trim() === '') {
    return {
      query,
      queryIntent: 'FINE_GRAINED_RAG',
      k,
      candidatesFetched: 0,
      totalRetrieved: 0,
      isReranked: false,
      isSummarizedPath: false,
      executionTimeMs: 0,
      chunks: [],
    };
  }

  // 1. Classify query intent (Broad Summary vs Narrow Detail)
  const classification = classifyQueryIntent(query);
  const isBroadQuery = classification.intent === 'BROAD_SUMMARY';

  // 2. Broad Path: Check for stored document-level summaries if enabled
  if (enableSummarizeThenRetrieve && isBroadQuery) {
    try {
      const supabase = supabaseClient || (await createSupabaseServer());
      let docQuery = supabase
        .from('documents')
        .select('id, file_name, summary, subject, total_chunks')
        .not('summary', 'is', null);

      if (filterDocumentId) {
        docQuery = docQuery.eq('id', filterDocumentId);
      }
      if (filterUserId) {
        docQuery = docQuery.eq('user_id', filterUserId);
      }
      if (filterSubject) {
        docQuery = docQuery.eq('subject', filterSubject);
      }

      const { data: docsWithSummaries } = await docQuery.limit(3);

      if (docsWithSummaries && docsWithSummaries.length > 0) {
        const summaryChunks: RetrievedChunk[] = docsWithSummaries
          .filter((d: any) => d.summary && d.summary.trim().length > 10)
          .map((d: any) => ({
            id: `summary_${d.id}`,
            source: d.file_name || 'Document Overview',
            pageOrSection: 'Document Summary',
            text: `[EXECUTIVE SUMMARY — ${d.file_name}]:\n${d.summary.trim()}`,
            relevanceScore: 0.99,
            metadata: {
              isDocumentSummary: true,
              parentDocumentId: d.id,
              totalChunks: d.total_chunks,
            },
          }));

        if (summaryChunks.length > 0) {
          // Fetch up to 2 specific anchor chunks to complement the summary
          let anchorChunks: RetrievedChunk[] = [];
          try {
            const queryEmbedding = await generateEmbedding(query.trim());
            const candidates = await searchSimilarChunks({
              queryEmbedding,
              matchCount: 2,
              filterDocumentId,
              filterUserId,
              similarityThreshold,
              supabaseClient,
            });
            anchorChunks = candidates.slice(0, 2);
          } catch {
            // Anchor chunks optional on broad path
          }

          const combinedChunks = [...summaryChunks, ...anchorChunks];
          const executionTimeMs = Date.now() - startTime;

          console.log(
            `[Retrieval Strategy] 📑 Summarize-then-Retrieve served ${summaryChunks.length} summary block(s) + ${anchorChunks.length} anchor chunk(s) in ${executionTimeMs}ms`
          );

          return {
            query,
            queryIntent: 'BROAD_SUMMARY',
            k,
            candidatesFetched: summaryChunks.length + anchorChunks.length,
            totalRetrieved: combinedChunks.length,
            isReranked: false,
            isSummarizedPath: true,
            executionTimeMs,
            chunks: combinedChunks,
          };
        }
      }
    } catch (err) {
      console.warn('[TopK Retrieval] Document summary fetch failed, proceeding with fine-grained retrieval:', err);
    }
  }

  // 3. Narrow Path: Dense pgvector retrieval + hybrid re-ranking
  const queryEmbedding = await generateEmbedding(query.trim());

  const candidates = await searchSimilarChunks({
    queryEmbedding,
    matchCount: enableReranking ? candidateK : k,
    filterDocumentId,
    filterUserId,
    similarityThreshold,
    supabaseClient,
  });

  let finalChunks = candidates;
  if (enableReranking && candidates.length > 0) {
    finalChunks = rerankChunks(query, candidates, {
      ...rerankOptions,
      finalK: k,
    });
  } else {
    finalChunks = candidates.slice(0, k);
  }

  const executionTimeMs = Date.now() - startTime;
  console.log(
    `[Retrieval Strategy] 🔍 Fine-Grained Retrieval (candidates: ${candidates.length} → top-${finalChunks.length}) served in ${executionTimeMs}ms`
  );

  return {
    query,
    queryIntent: classification.intent,
    k,
    candidatesFetched: candidates.length,
    totalRetrieved: finalChunks.length,
    isReranked: enableReranking,
    isSummarizedPath: false,
    executionTimeMs,
    chunks: finalChunks,
  };
}

/**
 * Legacy alias for retrieveAndRerankChunks (backward compatibility).
 */
export async function retrieveTopKChunks(
  options: TopKRetrievalOptions
): Promise<TopKRetrievalResult> {
  return retrieveAndRerankChunks(options);
}
export * from './queryClassifier';
export * from './guardrail';
