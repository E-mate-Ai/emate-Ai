import { openRouterCompletion } from '@/lib/openrouter';
import type { StudyExplanationRequest } from './types';

/**
 * Study Agent — generates targeted explanations for weak topic areas.
 * Uses the student's notebook context to personalise the response.
 */
export async function generateStudyExplanation(
  apiKey: string,
  request: StudyExplanationRequest
): Promise<string> {
  const { weakTopics, subject, notebookContext } = request;

  const systemPrompt =
    `You are e-Mate AI, an expert academic tutor specialising in ${subject}.\n` +
    `The student has just completed a quiz and scored poorly on the following topics:\n` +
    `${weakTopics.map((t) => `- ${t}`).join('\n')}\n\n` +
    `Your task is to explain each weak concept step-by-step in a clear, exam-focused way.\n` +
    `Guidelines:\n` +
    `- Use Markdown formatting (headers, bullet points, bold for key terms).\n` +
    `- Start with a brief encouraging note about their quiz performance.\n` +
    `- For each weak topic, provide: (1) a clear definition, (2) a worked example or analogy, (3) an exam tip.\n` +
    `- Highlight exam-important points with a ⭐ or 📌 marker.\n` +
    `- Keep explanations concise but thorough — aim for clarity over length.\n` +
    `- If the student's notebook contains relevant notes, reference and build upon them.`;

  const notebookSection = notebookContext
    ? `\n\n## Student's Personal Notebook for ${subject}:\n${notebookContext}`
    : '';

  const userMessage =
    `Please explain the following weak areas in detail. Focus on concepts the student got wrong:\n\n` +
    `Weak topics: ${weakTopics.join(', ')}` +
    notebookSection;

  const response = await openRouterCompletion(apiKey, {
    model: 'google/gemini-2.0-flash:free',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.7,
    max_tokens: 1500,
  });

  // Extract the text content from the response
  const content = response?.choices?.[0]?.message?.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    const textParts = content.filter((p: any) => p.type === 'text').map((p: any) => p.text);
    return textParts.join('\n');
  }

  return 'I could not generate an explanation at this time. Please try again.';
}
