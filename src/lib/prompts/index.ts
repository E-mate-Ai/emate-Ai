import { enforceContextBudget, countTokens } from './budget';

// ── 1. Prompt Versioning Registry ────────────────────────────────────────────

export const PROMPT_VERSIONS = {
  baseIdentity: '1.0.0',
  summarize: '1.0.0',
  qa: '1.0.0',
  quizGen: '1.0.0',
  chat: '1.0.0',
  contextInjectionSchema: '1.0.0',
} as const;

export type PromptFeature = keyof typeof PROMPT_VERSIONS;

// ── 2. Base System Identity ──────────────────────────────────────────────────

export const BASE_IDENTITY_PROMPT = `You are e-Mate AI, an expert AI academic tutor, study copilot, and exam preparation assistant designed for university and college students. Your primary mission is to help students deeply understand complex academic subjects, prepare efficiently for exams, master problem-solving, and excel in their coursework.

Core Guidelines:
- Answer naturally, conversationally, and directly to what the student asks.
- Use structured Markdown (headers, bold terms, bullet points, LaTeX math $...$ and $$...$$).
- Always highlight exam-important points with a ⭐ or 📌 marker.
- If the student's notebook contains relevant notes, reference them and build upon them.
- When generating flashcards, hidden answers, or self-testing Q&A pairs, wrap answers in collapsible HTML details tags:
  <details>
  <summary>Click to reveal answer</summary>
  **Answer:** your answer here
  </details>
- Strictly ground answers in provided documents or context; if the verified documents do not contain the answer to the question, explicitly state: "I couldn't find this in your uploaded sources." Do not fabricate or invent facts.`;

// ── 3. Shared Types & Schema ─────────────────────────────────────────────────

export interface RetrievedChunk {
  /** Unique chunk ID (e.g. "chunk_1", "doc1_p12") */
  id: string | number;
  /** Name or path of the source document (e.g. "Operating_Systems_Unit2.pdf") */
  source: string;
  /** Page number, slide number, or section header if available */
  pageOrSection?: string | number;
  /** Extracted text content of the chunk */
  text: string;
  /** Relevance similarity score (0.0 to 1.0, higher is more relevant) */
  relevanceScore?: number;
  /** Additional metadata (e.g., token count, creation timestamp) */
  metadata?: Record<string, unknown>;
}

export interface Citation {
  /** Source document ID or filename */
  sourceFileId?: string | number;
  /** Name of the source document (e.g. "Operating_Systems_Unit2.pdf") */
  sourceFileName: string;
  /** Page number, slide, or location if available */
  page?: number | string;
  /** Section title or header */
  section?: string;
  /** Unique chunk ID */
  chunkId: string | number;
  /** Short snippet preview from the cited chunk */
  previewText?: string;
  /** Similarity / relevance score from retrieval & re-ranking */
  relevanceScore?: number;
}

export interface ContextBudgetConfig {
  /** Maximum character allowance for retrieved context block (default: 12000 chars ≈ 3000 tokens) */
  maxCharacters?: number;
  /** Maximum estimated tokens (default: 3000 tokens) */
  maxTokens?: number;
  /** If true, never truncate mid-chunk; drops lowest-relevance chunks completely (default: true) */
  preserveWholeChunks?: boolean;
}

export interface FormattedContextResult {
  /** XML-structured formatted context string ready for injection */
  formattedText: string;
  /** Schema version applied during formatting */
  schemaVersion: string;
  /** Number of chunks successfully included in context */
  includedCount: number;
  /** Number of chunks dropped due to budget limit */
  droppedCount: number;
  /** Approximate token count of the formatted text (~4 chars per token) */
  approxTokens: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface PromptPayload {
  messages: ChatMessage[];
  meta: {
    promptFeature: PromptFeature;
    promptVersion: string;
    systemTokensApprox: number;
    contextChunksIncluded: number;
    contextChunksDropped: number;
  };
}

// ── 4. Context Formatting & Budget Truncation Strategy ──────────────────────

const DEFAULT_BUDGET: Required<ContextBudgetConfig> = {
  maxCharacters: 12000,
  maxTokens: 3000,
  preserveWholeChunks: true,
};

/** Rough token estimator (4 characters ≈ 1 token) */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Formats an array of retrieved chunks into a standardized, parseable XML format:
 * <retrieved_context>
 *   <context_block id="..." source="..." section="...">
 *   ...
 *   </context_block>
 * </retrieved_context>
 *
 * Enforces budget limits: prioritizes highest relevance chunks, dropping
 * lower-relevance chunks when the budget is reached. Never slices mid-chunk.
 */
export function formatRetrievedContext(
  chunks: RetrievedChunk[],
  config?: ContextBudgetConfig
): FormattedContextResult {
  if (!chunks || chunks.length === 0) {
    return {
      formattedText: '',
      schemaVersion: PROMPT_VERSIONS.contextInjectionSchema,
      includedCount: 0,
      droppedCount: 0,
      approxTokens: 0,
    };
  }

  const budget = { ...DEFAULT_BUDGET, ...config };
  const effectiveMaxChars = Math.min(budget.maxCharacters, budget.maxTokens * 4);

  // Sort chunks by relevance descending (if relevance scores exist), preserving original order as secondary
  const sortedChunks = [...chunks].sort((a, b) => {
    const scoreA = typeof a.relevanceScore === 'number' ? a.relevanceScore : 0.5;
    const scoreB = typeof b.relevanceScore === 'number' ? b.relevanceScore : 0.5;
    return scoreB - scoreA;
  });

  const includedBlocks: string[] = [];
  let currentLength = '<retrieved_context>\n</retrieved_context>\n'.length;
  let includedCount = 0;
  let droppedCount = 0;

  for (const chunk of sortedChunks) {
    const sectionAttr = chunk.pageOrSection !== undefined ? ` section="${escapeXmlAttr(String(chunk.pageOrSection))}"` : '';
    const scoreAttr = chunk.relevanceScore !== undefined ? ` score="${chunk.relevanceScore.toFixed(3)}"` : '';
    const blockString = `  <context_block id="${escapeXmlAttr(String(chunk.id))}" source="${escapeXmlAttr(chunk.source)}"${sectionAttr}${scoreAttr}>\n${chunk.text.trim()}\n  </context_block>\n`;

    if (currentLength + blockString.length <= effectiveMaxChars) {
      includedBlocks.push(blockString);
      currentLength += blockString.length;
      includedCount++;
    } else {
      // Exceeds budget: drop lowest-relevance chunk entirely (never truncate mid-chunk)
      droppedCount++;
    }
  }

  const formattedText = includedBlocks.length > 0
    ? `<retrieved_context>\n${includedBlocks.join('')}</retrieved_context>`
    : '';

  return {
    formattedText,
    schemaVersion: PROMPT_VERSIONS.contextInjectionSchema,
    includedCount,
    droppedCount,
    approxTokens: estimateTokenCount(formattedText),
  };
}

function escapeXmlAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ── 5. Feature 1: Summarization Prompt Builder ───────────────────────────────

export interface SummarizePromptOptions {
  subject?: string;
  unitOrTopic?: string;
  mode?: 'sprint' | 'comprehensive';
  /** Either structured retrieved chunks or raw document text */
  chunks?: RetrievedChunk[];
  rawText?: string;
  budget?: ContextBudgetConfig;
}

export function buildSummarizePrompt(options: SummarizePromptOptions): PromptPayload {
  const { subject, unitOrTopic, mode = 'sprint', chunks, rawText, budget } = options;
  const isSprint = mode === 'sprint';

  // 1. (a) Base identity & task instructions
  const systemPrompt = `${BASE_IDENTITY_PROMPT}

You are acting as the Academic Summarization Engine.
Your task is to produce a ${isSprint ? 'concise, high-yield revision summary' : 'comprehensive, structured study breakdown'} for university exam prep.

Formatting Requirements:
1. ## 🎯 Executive Overview (2-3 sentences synthesis)
2. ## 🔑 Core Concepts & Definitions
3. ## 📐 Formulas / Algorithms / Key Frameworks (LaTeX formatted: $...$ / $$...$$)
4. ## 📌 High-Yield Exam Points (marked with ⭐ or 📌)
5. ## ⚡ Quick Revision Self-Check (4-6 prompt questions)

Rules:
- Eliminate filler and preserve strict technical precision.
- Strictly summarize the provided context blocks. Do not introduce outside syllabus topics.`;

  // 2. (b) Context Injection
  let contextSection = '';
  let includedCount = 0;
  let droppedCount = 0;

  if (chunks && chunks.length > 0) {
    const formatted = formatRetrievedContext(chunks, budget);
    contextSection = `\n\nStudy Material to Summarize:\n${formatted.formattedText}`;
    includedCount = formatted.includedCount;
    droppedCount = formatted.droppedCount;
  } else if (rawText) {
    contextSection = `\n\nStudy Material to Summarize:\n\"\"\"\n${rawText}\n\"\"\"`;
    includedCount = 1;
  }

  // 3. User instruction (one-shot task)
  const metaDetails = [
    subject ? `Subject: ${subject}` : null,
    unitOrTopic ? `Target Topic/Unit: ${unitOrTopic}` : null,
    `Mode: ${isSprint ? 'Sprint Revision' : 'Comprehensive Module Study'}`,
  ].filter(Boolean).join(' | ');

  const userMessage = `${metaDetails ? `[${metaDetails}]\n\n` : ''}Please generate the exam-focused summary for the provided material.${contextSection}`;

  return {
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    meta: {
      promptFeature: 'summarize',
      promptVersion: PROMPT_VERSIONS.summarize,
      systemTokensApprox: estimateTokenCount(systemPrompt),
      contextChunksIncluded: includedCount,
      contextChunksDropped: droppedCount,
    },
  };
}

// ── 6. Feature 2: Document Q&A & Citation Prompt Builder ────────────────────

export interface QAPromptOptions {
  subject?: string;
  chunks: RetrievedChunk[];
  question: string;
  budget?: ContextBudgetConfig;
}

export function buildQAPrompt(options: QAPromptOptions): PromptPayload {
  const { subject, chunks, question, budget } = options;

  // 1. (a) Base identity & citation instructions
  const systemPrompt = `${BASE_IDENTITY_PROMPT}

You are acting as the Grounded Academic Q&A Engine.
Your task is to answer the student's question accurately using ONLY the information provided in the <retrieved_context> blocks.

Grounding & Citation Rules:
1. Answer strictly based on the provided <context_block> elements.
2. For every factual claim, include a bracketed citation matching the source attribute (e.g., [Source: OS_Unit2.pdf, Page 14] or [Doc: Slide 8]).
3. If the provided context DOES NOT contain sufficient information to answer the question, state:
   "I couldn't find this in your uploaded sources."
4. Never hallucinate facts, lecture references, or formulas not present in the context.`;

  // 2. (b) Context Injection
  const formatted = formatRetrievedContext(chunks, budget);
  const contextSection = formatted.formattedText
    ? `\n\n${formatted.formattedText}`
    : '\n\n<retrieved_context>\n  <!-- No context chunks retrieved -->\n</retrieved_context>';

  // 3. User instruction (one-shot task)
  const subjectHeader = subject ? `[Subject: ${subject}]\n\n` : '';
  const userMessage = `${subjectHeader}Context:${contextSection}\n\nStudent Question: ${question}`;

  return {
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    meta: {
      promptFeature: 'qa',
      promptVersion: PROMPT_VERSIONS.qa,
      systemTokensApprox: estimateTokenCount(systemPrompt),
      contextChunksIncluded: formatted.includedCount,
      contextChunksDropped: formatted.droppedCount,
    },
  };
}

// ── 7. Feature 3: Quiz & MCQ Generation Prompt Builder ──────────────────────

export interface QuizGenPromptOptions {
  subject: string;
  topics?: string[];
  questionCount?: number;
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
  chunks?: RetrievedChunk[];
  rawContext?: string;
  budget?: ContextBudgetConfig;
}

export function buildQuizGenPrompt(options: QuizGenPromptOptions): PromptPayload {
  const { subject, topics, questionCount = 5, difficulty = 'medium', chunks, rawContext, budget } = options;

  // 1. (a) Base identity & JSON schema instructions
  const systemPrompt = `${BASE_IDENTITY_PROMPT}

You are acting as the Academic Assessment & Quiz Generation Engine.
Generate rigorous, curriculum-aligned multiple-choice questions (MCQs) for university students based on the provided study context.

Output format must be strictly valid JSON matching this schema:
{
  "quizTitle": "string",
  "subject": "string",
  "questions": [
    {
      "id": 1,
      "question": "string",
      "options": ["A) option 1", "B) option 2", "C) option 3", "D) option 4"],
      "correctAnswer": "A",
      "explanation": "Detailed explanation of why A is correct and why other options are incorrect distractors.",
      "difficulty": "easy" | "medium" | "hard",
      "topic": "string",
      "examTip": "string"
    }
  ]
}

Distractor Rules:
- Distractors must represent common student misconceptions or calculation traps.
- Ensure only ONE unambiguously correct answer per question.`;

  // 2. (b) Context Injection
  let contextSection = '';
  let includedCount = 0;
  let droppedCount = 0;

  if (chunks && chunks.length > 0) {
    const formatted = formatRetrievedContext(chunks, budget);
    contextSection = `\n\nReference Material:\n${formatted.formattedText}`;
    includedCount = formatted.includedCount;
    droppedCount = formatted.droppedCount;
  } else if (rawContext) {
    contextSection = `\n\nReference Material:\n\"\"\"\n${rawContext}\n\"\"\"`;
    includedCount = 1;
  }

  // 3. User instruction (one-shot task)
  const reqDetails = [
    `Subject: ${subject}`,
    topics && topics.length > 0 ? `Target Topics: ${topics.join(', ')}` : null,
    `Question Count: ${questionCount}`,
    `Difficulty: ${difficulty}`,
  ].filter(Boolean).join('\n');

  const userMessage = `${reqDetails}${contextSection}\n\nPlease generate the JSON quiz.`;

  return {
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    meta: {
      promptFeature: 'quizGen',
      promptVersion: PROMPT_VERSIONS.quizGen,
      systemTokensApprox: estimateTokenCount(systemPrompt),
      contextChunksIncluded: includedCount,
      contextChunksDropped: droppedCount,
    },
  };
}

// ── 8. Feature 4: Interactive Chat & Tutor Prompt Builder ────────────────────

export interface ChatPromptOptions {
  subject?: string;
  unit?: string;
  mode?: 'sprint' | 'deep-dive';
  notebookContext?: string;
  retrievedChunks?: RetrievedChunk[];
  isGeneralChat?: boolean;
  historyMessages?: ChatMessage[];
  currentUserMessage: string;
  budget?: ContextBudgetConfig;
  maxHistoryMessages?: number;
  /** True when retrieval confidence is below threshold, triggering strict "not found" guidance */
  isGroundingWeak?: boolean;
}

export function buildChatPrompt(options: ChatPromptOptions): PromptPayload {
  const {
    subject,
    unit,
    mode = 'deep-dive',
    notebookContext,
    retrievedChunks,
    isGeneralChat,
    historyMessages = [],
    currentUserMessage,
    budget,
    maxHistoryMessages = 6,
  } = options;

  // 1. (a) Base identity & conversational instructions
  let systemPrompt = '';
  if (isGeneralChat || (!subject && !unit && !notebookContext && (!retrievedChunks || retrievedChunks.length === 0))) {
    systemPrompt = `${BASE_IDENTITY_PROMPT}\n\nYou are ready to assist with general study questions, problem-solving, and explanations across any topic.`;
  } else {
    const modeInstruction =
      mode === 'sprint'
        ? '\n\nMode: SPRINT — Give concise, bullet-pointed answers optimised for rapid last-minute revision. Prioritise key formulas, definitions, and high-yield exam tips.'
        : '\n\nMode: DEEP DIVE — Give thorough, step-by-step conceptual explanations with intuitive analogies, edge cases, and worked examples.';

    const contextSection =
      subject && unit
        ? `\n\nCurrent Academic Scope: Subject = ${subject}, Unit = ${unit}. Tailor all answers to this syllabus scope.`
        : subject
          ? `\n\nCurrent Academic Scope: Subject = ${subject}.`
          : '';

    systemPrompt = `${BASE_IDENTITY_PROMPT}${contextSection}${modeInstruction}`;
  }

  // 2. Apply Central Context Window Budget Enforcement
  const budgeted = enforceContextBudget({
    systemPrompt,
    retrievedChunks,
    notebookContext,
    historyMessages: historyMessages.slice(-maxHistoryMessages),
    currentUserMessage,
    maxInputTokens: budget?.maxTokens || undefined,
  });

  // 3. Assemble Verified Context & Notebook into Final System Prompt
  let finalSystemPrompt = budgeted.finalSystemPrompt;
  let includedCount = 0;
  let droppedCount = 0;

  if (budgeted.finalChunks && budgeted.finalChunks.length > 0) {
    const formatted = formatRetrievedContext(budgeted.finalChunks, budget);
    finalSystemPrompt += `\n\n## Verified Study Material Context:\n${formatted.formattedText}\n\nCitation Grounding Rules:\n- For any factual claims, definitions, or formulas drawing from the verified study context above, attach an inline citation marker matching the source attribute (e.g. [Source: filename.pdf, Page X] or [Doc: filename.pdf]).\n- If the verified study context above DOES NOT contain sufficient information to answer the student's question, explicitly state: "I couldn't find this in your uploaded sources."\n- Never fabricate citations or guess for knowledge not contained in the provided context blocks.`;
    includedCount = formatted.includedCount;
    droppedCount = formatted.droppedCount;
  }

  if (budgeted.finalNotebookContext) {
    finalSystemPrompt += `\n\n## Student's Personal Notebook for ${subject || 'this course'} (USE THIS to personalise answers):\n${budgeted.finalNotebookContext}\n\nAlways reference relevant notebook notes when answering.`;
  }

  if (options.isGroundingWeak) {
    finalSystemPrompt += `\n\n## Grounding Fallback Notice:\nThe verified study material in the student's notebook does NOT contain sufficient information or relevance to answer this query. Strictly state:\n"I couldn't find this in your uploaded sources."\nOffer to explain from general knowledge if the student wishes, but make it unmistakably clear that this is not verified in their course material.`;
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: finalSystemPrompt },
    ...budgeted.finalHistory,
    { role: 'user', content: currentUserMessage },
  ];

  return {
    messages,
    meta: {
      promptFeature: 'chat',
      promptVersion: PROMPT_VERSIONS.chat,
      systemTokensApprox: countTokens(finalSystemPrompt),
      contextChunksIncluded: includedCount,
      contextChunksDropped: budgeted.trimmedChunkCount + droppedCount,
    },
  };
}

/** Legacy helper for single system prompt string generation (backward compatibility) */
export function buildChatSystemPrompt(options: {
  subject?: string;
  unit?: string;
  mode?: 'sprint' | 'deep-dive';
  notebookContext?: string;
  isGeneralChat?: boolean;
}): string {
  const result = buildChatPrompt({
    ...options,
    currentUserMessage: '',
  });
  return result.messages[0].content;
}

export * from './promptCache';
export * from './budget';
