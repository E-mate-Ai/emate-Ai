import type { RetrievedChunk, ChatMessage } from './index';

/**
 * e-Mate AI — Central Context Window Budget Engine
 * Defines token allowances per request component, accurate token estimation,
 * and deterministic truncation priority order (history -> chunks -> notes)
 * preserving whole-chunk boundaries.
 */

export const CONTEXT_BUDGET = {
  /** Hard ceiling on total prompt input tokens (system + context + history + user query) */
  MAX_INPUT_TOKENS: 4800,
  /** Hard ceiling on total request tokens including completion generation */
  MAX_TOTAL_REQUEST_TOKENS: 6000,
  /** Reserved tokens for assistant generation */
  RESERVED_OUTPUT_TOKENS: 1200,

  /** Component target budgets */
  TARGET_SYSTEM_TOKENS: 800,
  TARGET_RETRIEVED_CONTEXT_TOKENS: 2400,
  TARGET_HISTORY_TOKENS: 1000,
  TARGET_USER_QUERY_TOKENS: 600,
} as const;

export type ContextBudgetConfig = typeof CONTEXT_BUDGET;

/**
 * Accurate token estimator for academic and multimodal text.
 * Combines word-based multiplier (1 word ≈ 1.33 tokens) and character bounds (~3.8 chars/token).
 */
export function countTokens(text: string | null | undefined): number {
  if (!text || text.length === 0) return 0;
  const words = text.trim().split(/\s+/).length;
  const byWords = Math.ceil(words * 1.33);
  const byChars = Math.ceil(text.length / 3.8);
  return Math.max(byWords, byChars);
}

export interface BudgetEnforcementInput {
  systemPrompt: string;
  retrievedChunks?: RetrievedChunk[];
  notebookContext?: string;
  historyMessages?: ChatMessage[];
  currentUserMessage: string;
  maxInputTokens?: number;
}

export interface BudgetEnforcementResult {
  finalSystemPrompt: string;
  finalChunks: RetrievedChunk[];
  finalHistory: ChatMessage[];
  finalNotebookContext?: string;
  totalTokens: number;
  tokensSaved: number;
  trimmedHistoryCount: number;
  trimmedChunkCount: number;
  isTrimmed: boolean;
}

/**
 * Enforces the context window budget on all assembled prompt components.
 * Trimming Priority Order:
 * 1. Drop oldest conversation history turns first (preserves recent conversational context).
 * 2. Drop lowest-relevance retrieved chunks whole (preserves whole-chunk boundaries, never clips mid-chunk).
 * 3. Trim student notebook context to fit remaining space.
 * 4. Current user message and core system identity are NEVER dropped.
 */
export function enforceContextBudget(
  input: BudgetEnforcementInput
): BudgetEnforcementResult {
  const maxBudget = input.maxInputTokens || CONTEXT_BUDGET.MAX_INPUT_TOKENS;

  const baseSystemTokens = countTokens(input.systemPrompt);
  const userQueryTokens = countTokens(input.currentUserMessage);

  // Mandatory non-negotiable minimum (base system + user message)
  const nonNegotiableTokens = baseSystemTokens + userQueryTokens;
  let remainingBudget = Math.max(0, maxBudget - nonNegotiableTokens);

  let activeHistory = [...(input.historyMessages || [])];
  let activeChunks = [...(input.retrievedChunks || [])];
  let activeNotebook = input.notebookContext || '';

  const initialHistoryTokens = activeHistory.reduce((acc, m) => acc + countTokens(m.content), 0);
  const initialChunkTokens = activeChunks.reduce((acc, c) => acc + countTokens(c.text), 0);
  const initialNotebookTokens = countTokens(activeNotebook);
  const initialTotal = nonNegotiableTokens + initialHistoryTokens + initialChunkTokens + initialNotebookTokens;

  let trimmedHistoryCount = 0;
  let trimmedChunkCount = 0;

  // ── Step 1: Trim conversation history if total exceeds budget ────────────
  let currentTotal = initialTotal;

  if (currentTotal > maxBudget && activeHistory.length > 0) {
    while (activeHistory.length > 0 && currentTotal > maxBudget) {
      const droppedMsg = activeHistory.shift(); // drop oldest turn first
      if (droppedMsg) {
        const msgTokens = countTokens(droppedMsg.content);
        currentTotal -= msgTokens;
        trimmedHistoryCount += 1;
      }
    }
  }

  // ── Step 2: Drop lowest-relevance chunks whole if still over budget ──────
  if (currentTotal > maxBudget && activeChunks.length > 0) {
    // Sort chunks ascending by relevance score (lowest relevance first to drop)
    activeChunks.sort((a, b) => {
      const scoreA = typeof a.relevanceScore === 'number' ? a.relevanceScore : 0.5;
      const scoreB = typeof b.relevanceScore === 'number' ? b.relevanceScore : 0.5;
      return scoreA - scoreB;
    });

    while (activeChunks.length > 0 && currentTotal > maxBudget) {
      const droppedChunk = activeChunks.shift(); // drop lowest relevance chunk whole
      if (droppedChunk) {
        const chunkTokens = countTokens(droppedChunk.text);
        currentTotal -= chunkTokens;
        trimmedChunkCount += 1;
      }
    }

    // Restore remaining chunks to descending relevance order
    activeChunks.sort((a, b) => {
      const scoreA = typeof a.relevanceScore === 'number' ? a.relevanceScore : 0.5;
      const scoreB = typeof b.relevanceScore === 'number' ? b.relevanceScore : 0.5;
      return scoreB - scoreA;
    });
  }

  // ── Step 3: Trim notebook context if still over budget ───────────────────
  if (currentTotal > maxBudget && activeNotebook) {
    const excess = currentTotal - maxBudget;
    const allowedChars = Math.max(200, (countTokens(activeNotebook) - excess) * 3.5);
    activeNotebook = activeNotebook.slice(0, allowedChars) + '...';
    currentTotal = nonNegotiableTokens +
      activeHistory.reduce((acc, m) => acc + countTokens(m.content), 0) +
      activeChunks.reduce((acc, c) => acc + countTokens(c.text), 0) +
      countTokens(activeNotebook);
  }

  const tokensSaved = Math.max(0, initialTotal - currentTotal);
  const isTrimmed = trimmedHistoryCount > 0 || trimmedChunkCount > 0 || tokensSaved > 0;

  // ── Log telemetry ────────────────────────────────────────────────────────
  if (isTrimmed) {
    console.log(
      `[Context Budget] ✂️ Trimmed ${trimmedHistoryCount} history turn(s) & ${trimmedChunkCount} chunk(s) | Final Input: ~${currentTotal} tokens (Budget: ${maxBudget}, Saved: ~${tokensSaved} tokens)`
    );
  } else {
    console.log(
      `[Context Budget] ✅ Within Budget | Input: ~${currentTotal} tokens / ${maxBudget} budget ceiling`
    );
  }

  return {
    finalSystemPrompt: input.systemPrompt,
    finalChunks: activeChunks,
    finalHistory: activeHistory,
    finalNotebookContext: activeNotebook || undefined,
    totalTokens: currentTotal,
    tokensSaved,
    trimmedHistoryCount,
    trimmedChunkCount,
    isTrimmed,
  };
}
