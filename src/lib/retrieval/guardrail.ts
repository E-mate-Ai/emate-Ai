import type { TopKRetrievalResult } from './topKRetrieval';

/**
 * e-Mate AI — Retrieval Confidence & Hallucination Guardrail
 *
 * Evaluates dense + hybrid similarity scores of retrieved context chunks.
 * When candidate relevance falls below the confidence threshold, triggers
 * the "not found in source" fallback to prevent ungrounded hallucinations.
 */

/**
 * Minimum hybrid relevance score threshold for fine-grained factual RAG.
 * Chunks below this threshold indicate low semantic & lexical correlation
 * with the student's specific question.
 */
export const MIN_RETRIEVAL_CONFIDENCE_THRESHOLD = 0.28;

export interface GuardrailEvaluation {
  /** True if retrieval cleared confidence checks or is on a verified broad path */
  isConfident: boolean;
  /** Highest relevance score among candidate chunks (0.0 to 1.0) */
  bestScore: number;
  /** Effective confidence threshold used for evaluation */
  threshold: number;
  /** Diagnostic classification reason */
  reason:
    | 'CONFIDENT_RETRIEVAL'
    | 'BROAD_SUMMARY_PATH'
    | 'NO_CHUNKS'
    | 'LOW_RELEVANCE_SCORE';
}

/**
 * Evaluates whether retrieved chunks provide sufficient grounding confidence
 * to answer the user's question without hallucinating.
 */
export function evaluateRetrievalConfidence(
  result: TopKRetrievalResult | null | undefined,
  threshold = MIN_RETRIEVAL_CONFIDENCE_THRESHOLD
): GuardrailEvaluation {
  if (!result) {
    return {
      isConfident: false,
      bestScore: 0,
      threshold,
      reason: 'NO_CHUNKS',
    };
  }

  // 1. Broad summary path uses verified document-level executive summaries
  if (result.isSummarizedPath || result.queryIntent === 'BROAD_SUMMARY') {
    return {
      isConfident: true,
      bestScore: 0.99,
      threshold,
      reason: 'BROAD_SUMMARY_PATH',
    };
  }

  // 2. Zero chunks retrieved
  if (!result.chunks || result.chunks.length === 0) {
    console.log(
      `[Hallucination Guardrail] ⚠️ No chunks retrieved for query "${result.query}". Triggering ungrounded fallback.`
    );
    return {
      isConfident: false,
      bestScore: 0,
      threshold,
      reason: 'NO_CHUNKS',
    };
  }

  // 3. Evaluate maximum hybrid relevance score across top retrieved chunks
  const bestScore = Math.max(
    ...result.chunks.map((c) =>
      typeof c.relevanceScore === 'number' ? c.relevanceScore : 0
    )
  );

  if (bestScore < threshold) {
    console.log(
      `[Hallucination Guardrail] ⚠️ Low retrieval confidence for query "${result.query}" (best score: ${bestScore.toFixed(
        3
      )} < threshold: ${threshold}). Triggering "not found in source" fallback.`
    );
    return {
      isConfident: false,
      bestScore,
      threshold,
      reason: 'LOW_RELEVANCE_SCORE',
    };
  }

  console.log(
    `[Hallucination Guardrail] ✅ High retrieval confidence for query "${result.query}" (best score: ${bestScore.toFixed(
      3
    )} >= threshold: ${threshold}).`
  );

  return {
    isConfident: true,
    bestScore,
    threshold,
    reason: 'CONFIDENT_RETRIEVAL',
  };
}
