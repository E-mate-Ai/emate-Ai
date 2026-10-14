import { openRouterCompletion } from '@/lib/openrouter';
import { getFreeModelCascade } from '@/lib/modelConfig';
import type { QuizGenerationRequest, MCQQuiz } from './types';
import { validateAndNormalizeMCQQuiz } from '@/lib/tools/schemas';

async function getQuizModelOrder(apiKey: string): Promise<string[]> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://emate-ai.runs-on.dev',
        'X-Title': 'e-Mate AI',
      },
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`Model list returned ${response.status}`);

    const data = (await response.json()) as {
      data?: Array<{
        id?: string;
        context_length?: number;
        pricing?: { prompt?: string | number | null; completion?: string | number | null };
        architecture?: { input_modalities?: string[]; output_modalities?: string[] };
      }>;
    };
    const liveFreeModels = (data.data || [])
      .filter((candidate) => {
        const inputModalities = candidate.architecture?.input_modalities;
        const outputModalities = candidate.architecture?.output_modalities;
        return Boolean(
          candidate.id &&
          candidate.id !== 'openrouter/auto' &&
          candidate.pricing?.prompt != null &&
          candidate.pricing?.completion != null &&
          Number(candidate.pricing?.prompt) === 0 &&
          Number(candidate.pricing?.completion) === 0 &&
          (!inputModalities || inputModalities.includes('text')) &&
          (!outputModalities || outputModalities.includes('text'))
        );
      })
      .sort((a, b) => (b.context_length || 0) - (a.context_length || 0))
      .slice(0, 8)
      .map((candidate) => candidate.id!)
      .filter((model, index, models) => models.indexOf(model) === index);

    if (liveFreeModels.length) return liveFreeModels;
  } catch (error) {
    console.warn('[mcqAgent] Could not load live free models; using configured free-model fallback list.', error);
  }

  return getFreeModelCascade('emate').filter((model) => model !== 'openrouter/auto');
}

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
  const modelOrder = await getQuizModelOrder(apiKey);
  const completion = (
    model: string,
    messages: Parameters<typeof openRouterCompletion>[1]['messages'],
    temperature: number
  ) =>
    openRouterCompletion(apiKey, {
      model,
      fallbackModels: [],
      messages,
      temperature,
      max_tokens: 2000,
    });

  let lastRawText = '';
  let lastValidationError = 'The model returned an empty response.';
  let lastRequestError: unknown;

  // A provider can return HTTP 200 with an empty or malformed answer. Treat
  // that as a failed candidate too, and try the next live free model.
  for (const model of modelOrder) {
    try {
      const response = await completion(
        model,
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        0.7
      );
      const rawText = extractContentText(response);
      lastRawText = rawText;
      const validation = validateAndNormalizeMCQQuiz(parseRawJson(rawText), {
        subject: promptSubject,
        unit: promptUnit,
      });
      if (validation.valid && validation.data) return validation.data;
      lastValidationError = validation.error || (rawText.trim() ? 'Malformed quiz response.' : 'The model returned an empty response.');
      console.warn(`[mcqAgent] Model ${model} returned an unusable quiz response: ${lastValidationError}`);
    } catch (error) {
      lastRequestError = error;
      console.warn(`[mcqAgent] Model ${model} failed quiz generation; trying the next free model.`, error);
      if ((error as { status?: number })?.status === 401) throw error;
    }
  }

  // One strict-format retry handles providers that answer conversationally
  // before following the JSON requirement. It is skipped for an empty payload.
  const retryModel = modelOrder.find((model) => model) || 'google/gemini-2.0-flash:free';
  if (lastRawText.trim()) {
    try {
      const retryResponse = await completion(
        retryModel,
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
          { role: 'assistant', content: lastRawText },
          {
            role: 'user',
            content: 'Return only a valid JSON array of quiz question objects matching the required schema. Do not include markdown or commentary.',
          },
        ],
        0.3
      );
      const retryText = extractContentText(retryResponse);
      const retryValidation = validateAndNormalizeMCQQuiz(parseRawJson(retryText), {
        subject: promptSubject,
        unit: promptUnit,
      });
      if (retryValidation.valid && retryValidation.data) return retryValidation.data;
      lastValidationError = retryValidation.error || 'The model returned an empty response.';
    } catch (error) {
      lastRequestError = error;
    }
  }

  if (lastRawText.trim() || !lastRequestError) {
    throw new Error(`Quiz generation failed schema validation: ${lastValidationError}`);
  }
  throw lastRequestError instanceof Error ? lastRequestError : new Error('All free models failed to generate a quiz.');
}

function extractContentText(response: any): string {
  const content = response?.choices?.[0]?.message?.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .filter((part: any) => part && typeof part.text === 'string')
      .map((part: any) => part.text)
      .join('');
  }
  if (content && typeof content === 'object' && typeof content.text === 'string') {
    return content.text;
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
