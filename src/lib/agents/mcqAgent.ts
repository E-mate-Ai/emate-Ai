import { openRouterCompletion } from '@/lib/openrouter';
import type { QuizGenerationRequest, MCQQuiz } from './types';
import { validateAndNormalizeMCQQuiz } from '@/lib/tools/schemas';

/**
 * MCQ Agent — generates multiple-choice quizzes from notebook context.
 * Enforces strict JSON output format, validates against MCQQuiz schema,
 * and includes automatic 1-attempt retry on malformed output.
 */
export async function generateQuiz(
  apiKey: string,
  request: QuizGenerationRequest
): Promise<MCQQuiz> {
  const { subject, unit, count, difficulty, notebookContext } = request;

  // Fallback: when no subject is set, use General Computer Science
  const promptSubject = subject || 'General Computer Science';
  const promptUnit = unit || (subject ? '' : 'General Knowledge');

  const systemPrompt =
    `You are an expert exam question writer for ${promptSubject}.\n` +
    `Generate exactly ${count} multiple-choice questions at ${difficulty} difficulty level.\n` +
    `Focus area: ${promptUnit || `general ${promptSubject}`}\n\n` +
    `STRICT FORMAT RULES:\n` +
    `- Return ONLY a valid JSON array or { "questions": [...] } object — no markdown, no explanation, no text outside JSON.\n` +
    `- Each question object must have:\n` +
    `  {\n` +
    `    "question": "string — the question text",\n` +
    `    "options": ["A", "B", "C", "D"],\n` +
    `    "correctAnswer": 0,  // integer 0-3 index\n` +
    `    "topicTag": "string — specific sub-topic name",\n` +
    `    "explanation": "string — brief explanation of the correct answer"\n` +
    `  }\n` +
    `- Questions should test understanding, not just recall.\n` +
    `- Each option should be plausible.\n` +
    `- The "topicTag" should identify the specific concept being tested.\n` +
    `- Use ⭐ markers in explanations for exam-important points.`;

  const notebookSection = notebookContext
    ? `\n\n## Student's Personal Notebook (use this to create relevant questions):\n${notebookContext}`
    : '';

  const userMessage = `Generate ${count} ${difficulty}-level MCQ questions for ${promptSubject}${promptUnit ? ` — ${promptUnit}` : ''}.${notebookSection}`;

  // Attempt 1
  let rawText = '';
  try {
    const response = await openRouterCompletion(apiKey, {
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    rawText = extractContentText(response);
    const parsedJson = parseRawJson(rawText);
    const validation = validateAndNormalizeMCQQuiz(parsedJson, {
      subject: promptSubject,
      unit: promptUnit,
    });

    if (validation.valid && validation.data) {
      return validation.data;
    }
  } catch (err) {
    console.warn('[mcqAgent] Attempt 1 failed schema validation or parsing. Retrying with corrective prompt:', err);
  }

  // Attempt 2 (Automatic 1-attempt retry with stricter corrective prompt)
  console.log('[mcqAgent] Executing retry attempt for quiz generation...');
  const retryResponse = await openRouterCompletion(apiKey, {
    model: 'google/gemini-2.5-flash',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
      {
        role: 'assistant',
        content: rawText || '[]',
      },
      {
        role: 'user',
        content: 'Your previous response was not valid JSON. Please return STRICTLY a valid JSON array of question objects matching the required schema.',
      },
    ],
    temperature: 0.3,
    max_tokens: 2000,
  });

  const retryText = extractContentText(retryResponse);
  const retryParsed = parseRawJson(retryText);
  const retryValidation = validateAndNormalizeMCQQuiz(retryParsed, {
    subject: promptSubject,
    unit: promptUnit,
  });

  if (retryValidation.valid && retryValidation.data) {
    return retryValidation.data;
  }

  console.error('[mcqAgent] Quiz schema validation failed after retry:', retryValidation.error);
  throw new Error(`Quiz generation failed schema validation: ${retryValidation.error || 'Malformed output'}`);
}

function extractContentText(response: any): string {
  const content = response?.choices?.[0]?.message?.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .filter((p: any) => p.type === 'text')
      .map((p: any) => p.text)
      .join('');
  }
  return '';
}

/**
 * Robust JSON extraction handling markdown code fences, object wrapping, and trailing characters.
 */
function parseRawJson(raw: string): unknown {
  if (!raw || !raw.trim()) return null;

  // 1. Strip markdown code fences (```json ... ``` or ``` ... ```)
  let cleaned = raw.replace(/```(?:json)?\s*\n?/g, '').replace(/```\s*$/gm, '').trim();

  // Try direct parse first
  try {
    return JSON.parse(cleaned);
  } catch {
    /* fallback to substring extraction */
  }

  // 2. Find JSON Array [ ... ]
  const arrayStart = cleaned.indexOf('[');
  const arrayEnd = cleaned.lastIndexOf(']');
  if (arrayStart !== -1 && arrayEnd > arrayStart) {
    try {
      return JSON.parse(cleaned.slice(arrayStart, arrayEnd + 1));
    } catch {
      /* ignore */
    }
  }

  // 3. Find JSON Object { ... }
  const objStart = cleaned.indexOf('{');
  const objEnd = cleaned.lastIndexOf('}');
  if (objStart !== -1 && objEnd > objStart) {
    try {
      return JSON.parse(cleaned.slice(objStart, objEnd + 1));
    } catch {
      /* ignore */
    }
  }

  return null;
}
