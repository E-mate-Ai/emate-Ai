import type { SupabaseClient } from '@supabase/supabase-js';
import type { RetrievedChunk } from '@/lib/prompts';
import { createClient as createSupabaseServer } from '@/lib/supabase/server';

/**
 * e-Mate AI — Vector Search & Retrieval Engine (pgvector)
 * Interacts with Supabase Postgres match_document_chunks RPC
 * to retrieve top-K most semantically relevant document chunks.
 */

export interface VectorSearchParams {
  /** 768-dimensional float array embedding for query */
  queryEmbedding: number[];
  /** Maximum number of chunks to retrieve (default: 5) */
  matchCount?: number;
  /** Filter to a specific document ID (optional) */
  filterDocumentId?: string;
  /** Filter to a specific user ID (optional) */
  filterUserId?: string;
  /** Minimum cosine similarity threshold (0.0 to 1.0, default: 0.0) */
  similarityThreshold?: number;
  /** Optional pre-instantiated Supabase client */
  supabaseClient?: SupabaseClient;
}

export interface MatchedChunkRow {
  id: string;
  document_id: string;
  source: string;
  page_or_section: string | null;
  text: string;
  position_index: number;
  heading: string | null;
  heading_level: number | null;
  page_number: number | null;
  metadata: Record<string, unknown>;
  similarity: number;
}

/**
 * Executes a cosine similarity search against pgvector in Supabase Postgres.
 * Returns chunks structured according to RetrievedChunk with relevanceScore populated.
 */
export async function searchSimilarChunks(
  params: VectorSearchParams
): Promise<RetrievedChunk[]> {
  const {
    queryEmbedding,
    matchCount = 5,
    filterDocumentId = null,
    filterUserId = null,
    similarityThreshold = 0.0,
  } = params;

  if (!queryEmbedding || queryEmbedding.length !== 768) {
    throw new Error(
      `Invalid query embedding: expected 768 dimensions (Gemini text-embedding-004), received ${queryEmbedding?.length ?? 0}.`
    );
  }

  const supabase = params.supabaseClient || (await createSupabaseServer());

  const { data, error } = await supabase.rpc('match_document_chunks', {
    query_embedding: queryEmbedding,
    match_count: matchCount,
    filter_document_id: filterDocumentId,
    filter_user_id: filterUserId,
    similarity_threshold: similarityThreshold,
  });

  if (error) {
    throw new Error(`Vector similarity query failed: ${error.message}`);
  }

  if (!data || !Array.isArray(data)) {
    return [];
  }

  return (data as MatchedChunkRow[]).map((row) => ({
    id: row.id,
    source: row.source,
    pageOrSection: row.page_or_section || undefined,
    text: row.text,
    relevanceScore: Number(row.similarity.toFixed(4)),
    metadata: {
      ...row.metadata,
      documentId: row.document_id,
      positionIndex: row.position_index,
      heading: row.heading || undefined,
      headingLevel: row.heading_level || undefined,
      pageNumber: row.page_number || undefined,
    },
  }));
}

/**
 * Test & verification helper: Generates a deterministic 768-dim normalized dummy vector.
 */
export function createDummyVector(activeDimensionIndex = 0, magnitude = 1.0): number[] {
  const vec = new Array(768).fill(0);
  if (activeDimensionIndex < 768) {
    vec[activeDimensionIndex] = magnitude;
  }
  return vec;
}
