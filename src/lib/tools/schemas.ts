/**
 * e-Mate AI — Structured Output Schemas & Validation Contracts
 *
 * Defines explicit JSON schemas and runtime validation guards for structured
 * responses (Quizzes, Citations, Study Reports, Summaries) to ensure
 * reliable frontend-backend contracts without fragile free-text parsing.
 */

import type { Citation } from '@/lib/prompts';
import type { MCQQuiz, MCQQuestion, StudyAnalyzerReport } from '@/lib/agents/types';

// ── 1. Citation Structured Contract ──────────────────────────────────────────

export interface CitationSchemaDefinition {
  sourceFileId?: string | number;
  sourceFileName: string;
  page?: string | number;
  section?: string;
  chunkId: string | number;
  previewText?: string;
  relevanceScore?: number;
}

export function validateCitation(item: unknown): item is Citation {
  if (!item || typeof item !== 'object') return false;
  const c = item as Record<string, unknown>;
  return (
    typeof c.sourceFileName === 'string' &&
    c.sourceFileName.trim().length > 0 &&
    (typeof c.chunkId === 'string' || typeof c.chunkId === 'number')
  );
}

export function validateCitations(items: unknown): { valid: boolean; data: Citation[]; error?: string } {
  if (!Array.isArray(items)) {
    return { valid: false, data: [], error: 'Citations payload must be an array.' };
  }
  const validated: Citation[] = [];
  for (const item of items) {
    if (validateCitation(item)) {
      validated.push(item);
    }
  }
  return { valid: true, data: validated };
}

// ── 2. MCQ Quiz Structured Contract ──────────────────────────────────────────

export interface ValidationResult<T> {
  valid: boolean;
  data?: T;
  error?: string;
}

/**
 * Normalizes and validates a single multiple-choice question.
 * Handles letter-based correct answers ("A", "B", "C", "D"), string indices ("0"),
 * and strips HTML or markdown formatting quirks.
 */
export function validateAndNormalizeMCQQuestion(
  raw: unknown,
  fallbackIndex = 0
): ValidationResult<MCQQuestion> {
  if (!raw || typeof raw !== 'object') {
    return { valid: false, error: `Question at index ${fallbackIndex} is not an object.` };
  }

  const q = raw as Record<string, unknown>;
  const questionText = typeof q.question === 'string' ? q.question.trim() : '';
  if (!questionText) {
    return { valid: false, error: `Question at index ${fallbackIndex} is missing question text.` };
  }

  // Normalize options (must be array of 4 strings)
  let rawOptions: unknown[] = [];
  if (Array.isArray(q.options)) {
    rawOptions = q.options;
  } else if (typeof q.options === 'object' && q.options !== null) {
    // If model output {"A": "...", "B": "...", "C": "...", "D": "..."}
    rawOptions = Object.values(q.options);
  }

  if (rawOptions.length < 2) {
    return { valid: false, error: `Question "${questionText.slice(0, 30)}..." has fewer than 2 options.` };
  }

  const stringOptions = rawOptions.map((opt) => String(opt ?? '').trim());
  // Pad to 4 options if 2 or 3 were returned
  while (stringOptions.length < 4) {
    stringOptions.push(`None of the above`);
  }

  // Clean option prefixes (e.g. "A) Option text" -> "Option text" or keep uniform)
  const normalizedOptions: [string, string, string, string] = [
    stringOptions[0],
    stringOptions[1],
    stringOptions[2],
    stringOptions[3],
  ];

  // Normalize correctAnswer to index (0-3)
  let correctIndex = 0;
  if (typeof q.correctAnswer === 'number') {
    correctIndex = Math.min(Math.max(Math.floor(q.correctAnswer), 0), 3);
  } else if (typeof q.correctAnswer === 'string') {
    const cleanAns = q.correctAnswer.trim().toUpperCase();
    if (cleanAns === 'A' || cleanAns === 'OPTION A' || cleanAns.startsWith('A)')) correctIndex = 0;
    else if (cleanAns === 'B' || cleanAns === 'OPTION B' || cleanAns.startsWith('B)')) correctIndex = 1;
    else if (cleanAns === 'C' || cleanAns === 'OPTION C' || cleanAns.startsWith('C)')) correctIndex = 2;
    else if (cleanAns === 'D' || cleanAns === 'OPTION D' || cleanAns.startsWith('D)')) correctIndex = 3;
    else {
      const parsedNum = parseInt(cleanAns, 10);
      correctIndex = !isNaN(parsedNum) && parsedNum >= 0 && parsedNum <= 3 ? parsedNum : 0;
    }
  }

  const topicTag = typeof q.topicTag === 'string' && q.topicTag.trim() ? q.topicTag.trim() : `Topic ${fallbackIndex + 1}`;
  const explanation = typeof q.explanation === 'string' ? q.explanation.trim() : '';

  return {
    valid: true,
    data: {
      id: String(q.id || `q-${Date.now()}-${fallbackIndex}`),
      question: questionText,
      options: normalizedOptions,
      correctAnswer: correctIndex,
      topicTag,
      explanation,
    },
  };
}

/**
 * Validates and normalizes an entire MCQ quiz payload.
 * Supports raw array of questions or wrapper objects ({ questions: [...] } / { quiz: [...] }).
 */
export function validateAndNormalizeMCQQuiz(
  raw: unknown,
  metadata?: { subject?: string; unit?: string }
): ValidationResult<MCQQuiz> {
  if (!raw) {
    return { valid: false, error: 'Empty quiz response payload.' };
  }

  let questionsArray: unknown[] | null = null;

  if (Array.isArray(raw)) {
    questionsArray = raw;
  } else if (typeof raw === 'object' && raw !== null) {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.questions)) {
      questionsArray = obj.questions;
    } else if (Array.isArray(obj.quiz)) {
      questionsArray = obj.quiz;
    } else if (Array.isArray(obj.data)) {
      questionsArray = obj.data;
    }
  }

  if (!questionsArray || questionsArray.length === 0) {
    return { valid: false, error: 'Could not find a valid questions array in LLM response.' };
  }

  const validatedQuestions: MCQQuestion[] = [];
  for (let i = 0; i < questionsArray.length; i++) {
    const result = validateAndNormalizeMCQQuestion(questionsArray[i], i);
    if (result.valid && result.data) {
      validatedQuestions.push(result.data);
    }
  }

  if (validatedQuestions.length === 0) {
    return { valid: false, error: 'All questions in quiz payload failed schema validation.' };
  }

  const rawObj = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const quizId = String(rawObj.id || `quiz-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  const subject = String(rawObj.subject || metadata?.subject || 'General Study');
  const unit = String(rawObj.unit || metadata?.unit || '');
  const createdAt = String(rawObj.createdAt || new Date().toISOString());

  return {
    valid: true,
    data: {
      id: quizId,
      subject,
      unit,
      questions: validatedQuestions,
      createdAt,
    },
  };
}

// ── 3. Study Analyzer Report Structured Contract ────────────────────────────

export function validateStudyAnalyzerReport(raw: unknown): raw is StudyAnalyzerReport {
  if (!raw || typeof raw !== 'object') return false;
  const r = raw as Record<string, unknown>;
  return (
    typeof r.id === 'string' &&
    typeof r.quizId === 'string' &&
    typeof r.overallScore === 'number' &&
    Array.isArray(r.weakAreas) &&
    Array.isArray(r.recommendations)
  );
}

// ── 4. Standard Frontend-Backend JSON Contracts Reference ───────────────────

/**
 * Summary of Structured Response Contracts in e-Mate AI:
 *
 * 1. Streamed Chat / QA:
 *    - Protocol: Server-Sent Events (SSE)
 *    - Token chunks: `data: "<delta_string>"\n\n`
 *    - Citation event: `data: {"type":"citations","citations":[CitationSchema]}\n\n`
 *    - Completion termination: `data: [DONE]\n\n`
 *
 * 2. Practice Quiz Generation (`/api/agents/generate-quiz` / `quiz_gen_tool`):
 *    - Protocol: Application/JSON
 *    - Body: `MCQQuiz` schema ({ id, subject, unit, questions: [MCQQuestion], createdAt })
 *
 * 3. Document Executive Summary (`summarizer_tool`):
 *    - Protocol: Application/JSON
 *    - Body: `DocumentSummaryResult` schema ({ summary: string, sectionSummaries?: Record<string, string> })
 */
