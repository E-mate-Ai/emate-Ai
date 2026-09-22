import type { RetrievedChunk } from '@/lib/prompts';

/**
 * e-Mate AI — Hybrid Re-Ranking Engine
 *
 * Implements a fast, zero-dependency hybrid re-scorer that combines:
 * 1. Dense semantic similarity (from pgvector cosine distance)
 * 2. Sparse lexical / keyword BM25-style term frequency & exact phrase matching
 * 3. Heading / structural section match boosting
 *
 * Solves dense-only retrieval drift without requiring a paid re-ranking API.
 */

export interface RerankOptions {
  /** Target final top-K chunks to return after re-ranking (default: 5) */
  finalK?: number;
  /** Weight assigned to vector cosine similarity (default: 0.60) */
  vectorWeight?: number;
  /** Weight assigned to lexical keyword overlap (default: 0.25) */
  lexicalWeight?: number;
  /** Weight assigned to heading / structural section match (default: 0.15) */
  headingWeight?: number;
}

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about',
  'into', 'over', 'after', 'what', 'how', 'why', 'when', 'where', 'who',
  'which', 'that', 'this', 'these', 'those', 'and', 'or', 'not', 'can',
  'could', 'should', 'would', 'do', 'does', 'did', 'explain', 'tell', 'me',
]);

/**
 * Tokenizes text into significant keywords, ignoring common stop words.
 */
function extractSignificantKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

/**
 * Computes lexical keyword overlap & exact phrase matching score (0.0 to 1.0).
 */
function computeLexicalScore(query: string, chunkText: string): number {
  const queryKeywords = extractSignificantKeywords(query);
  if (queryKeywords.length === 0) return 0.5;

  const normalizedChunk = chunkText.toLowerCase();
  let matches = 0;
  let phraseBonus = 0;

  // Check for whole query exact phrase match
  const cleanQuery = query.toLowerCase().trim();
  if (cleanQuery.length > 5 && normalizedChunk.includes(cleanQuery)) {
    phraseBonus = 0.3;
  }

  // Check individual keyword occurrences
  for (const keyword of queryKeywords) {
    if (normalizedChunk.includes(keyword)) {
      matches++;
    }
  }

  const keywordRatio = matches / queryKeywords.length;
  return Math.min(1.0, keywordRatio * 0.7 + phraseBonus);
}

/**
 * Computes heading / section structural match score (0.0 to 1.0).
 */
function computeHeadingScore(query: string, heading?: string): number {
  if (!heading) return 0.0;

  const queryKeywords = extractSignificantKeywords(query);
  if (queryKeywords.length === 0) return 0.0;

  const normalizedHeading = heading.toLowerCase();
  let matches = 0;

  for (const keyword of queryKeywords) {
    if (normalizedHeading.includes(keyword)) {
      matches++;
    }
  }

  return matches / queryKeywords.length;
}

/**
 * Re-ranks a list of candidate chunks retrieved from vector search.
 */
export function rerankChunks(
  query: string,
  candidates: RetrievedChunk[],
  options?: RerankOptions
): RetrievedChunk[] {
  if (!candidates || candidates.length === 0) return [];

  const {
    finalK = 5,
    vectorWeight = 0.60,
    lexicalWeight = 0.25,
    headingWeight = 0.15,
  } = options || {};

  const scoredCandidates = candidates.map((chunk) => {
    const vectorScore = chunk.relevanceScore ?? 0.5;
    const lexicalScore = computeLexicalScore(query, chunk.text);
    const heading = (chunk.metadata as any)?.heading || chunk.pageOrSection;
    const headingScore = computeHeadingScore(query, heading);

    const combinedScore =
      vectorWeight * vectorScore +
      lexicalWeight * lexicalScore +
      headingWeight * headingScore;

    return {
      ...chunk,
      relevanceScore: Number(combinedScore.toFixed(4)),
      metadata: {
        ...chunk.metadata,
        rerankScores: {
          combined: Number(combinedScore.toFixed(4)),
          vector: Number(vectorScore.toFixed(4)),
          lexical: Number(lexicalScore.toFixed(4)),
          heading: Number(headingScore.toFixed(4)),
        },
      },
    };
  });

  // Sort descending by combined score
  scoredCandidates.sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0));

  return scoredCandidates.slice(0, finalK);
}
