/**
 * e-Mate AI — Query Intent Classifier & Router
 * Determines whether a query is broad/document-level (requiring executive summary)
 * or fine-grained/specific (requiring top-K vector chunk retrieval & re-ranking).
 */

export type QueryIntent = 'BROAD_SUMMARY' | 'FINE_GRAINED_RAG';

export interface QueryClassificationResult {
  intent: QueryIntent;
  confidence: number;
  reason: string;
}

// Regular expressions matching broad document-level and summary intents
const BROAD_SUMMARY_PATTERNS = [
  /\b(summarize|summary|overview|abstract|synopsis|tldr|tl;dr)\b/i,
  /\bwhat\s+(is|are)\s+(this|the)\s+(file|document|paper|pdf|book|notes|module|chapter|unit)\s+(about|covering|discussing)\b/i,
  /\b(give\s+me\s+an?\s+overview|high[\s-]level\s+summary|key\s+takeaways|main\s+points|main\s+ideas|main\s+topics|table\s+of\s+contents)\b/i,
  /\b(explain\s+the\s+entire\s+document|what\s+does\s+this\s+(doc|file|pdf|note)\s+say|outline\s+this)\b/i,
  /\b(briefly\s+explain\s+what\s+this\s+is|what\s+is\s+covered\s+in\s+this)\b/i,
];

// Regular expressions that indicate specific factual inquiries even if words like "summary" are mentioned
const NARROW_OVERRIDE_PATTERNS = [
  /\b(formula|equation|proof|calculate|derive|algorithm|pseudocode|code|syntax|step[\s-]by[\s-]step\s+solution)\b/i,
  /\b(page\s+\d+|slide\s+\d+|section\s+\d+|line\s+\d+)\b/i,
  /\b(difference\s+between|compare\s+.+\s+and\s+|pros\s+and\s+cons\s+of)\b/i,
  /\b(why\s+does|how\s+does\s+.+\s+work|what\s+is\s+the\s+definition\s+of)\b/i,
];

/**
 * Classifies a user's query into BROAD_SUMMARY or FINE_GRAINED_RAG.
 */
export function classifyQueryIntent(query: string): QueryClassificationResult {
  const normalized = query.trim().toLowerCase();

  // 1. Check if narrow override applies (e.g. "what is the formula for deadlock avoidance")
  for (const pattern of NARROW_OVERRIDE_PATTERNS) {
    if (pattern.test(normalized)) {
      const result: QueryClassificationResult = {
        intent: 'FINE_GRAINED_RAG',
        confidence: 0.9,
        reason: 'matched_specific_detail_pattern',
      };
      logClassification(query, result);
      return result;
    }
  }

  // 2. Check broad summary patterns
  for (const pattern of BROAD_SUMMARY_PATTERNS) {
    if (pattern.test(normalized)) {
      const result: QueryClassificationResult = {
        intent: 'BROAD_SUMMARY',
        confidence: 0.95,
        reason: 'matched_broad_summary_pattern',
      };
      logClassification(query, result);
      return result;
    }
  }

  // 3. Short single-word or 2-word overview triggers
  if (['overview', 'summary', 'tldr', 'recap', 'brief'].includes(normalized)) {
    const result: QueryClassificationResult = {
      intent: 'BROAD_SUMMARY',
      confidence: 1.0,
      reason: 'exact_overview_keyword',
    };
    logClassification(query, result);
    return result;
  }

  // Default: Fine-grained chunk retrieval for maximal factual precision
  const defaultResult: QueryClassificationResult = {
    intent: 'FINE_GRAINED_RAG',
    confidence: 0.85,
    reason: 'default_factual_search',
  };
  logClassification(query, defaultResult);
  return defaultResult;
}

function logClassification(query: string, result: QueryClassificationResult) {
  const icon = result.intent === 'BROAD_SUMMARY' ? '📑 [BROAD SUMMARY PATH]' : '🔍 [FINE-GRAINED CHUNKS]';
  console.log(
    `[Query Intent] ${icon} Query: "${query.slice(0, 60)}" | Intent: ${result.intent} | Reason: ${result.reason} (Confidence: ${result.confidence})`
  );
}
