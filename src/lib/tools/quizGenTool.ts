import type { Tool } from './types';
import { generateQuiz } from '@/lib/agents/mcqAgent';
import type { QuizGenerationRequest, MCQQuiz } from '@/lib/agents/types';

export interface QuizGenToolInput {
  apiKey?: string;
  request: QuizGenerationRequest;
}

/**
 * Quiz Generator Tool
 * Generates curriculum-aligned MCQ quizzes with distractors, explanations, and exam tips.
 */
export const quizGenTool: Tool<QuizGenToolInput, MCQQuiz> = {
  name: 'quiz_gen_tool',
  description:
    'Generates rigorous multiple-choice practice quizzes with explanations and exam tips from syllabus and notebook context.',
  inputSchema: {
    type: 'object',
    properties: {
      subject: {
        type: 'string',
        description: 'Target subject/course name (e.g. "Data Structures").',
      },
      unit: {
        type: 'string',
        description: 'Specific unit or topic to test.',
      },
      count: {
        type: 'number',
        description: 'Number of questions to generate (e.g. 5, 10).',
      },
      difficulty: {
        type: 'string',
        description: 'Difficulty level ("easy", "medium", "hard").',
        enum: ['easy', 'medium', 'hard'],
      },
      notebookContext: {
        type: 'string',
        description: 'Optional student notes to personalize questions from.',
      },
    },
    required: ['subject', 'count', 'difficulty'],
  },
  execute: async (input: QuizGenToolInput): Promise<MCQQuiz> => {
    const key =
      input.apiKey ||
      process.env.OPENROUTER_SERVER_FREE_KEY ||
      process.env.OPENROUTER_API_KEY ||
      '';
    return generateQuiz(key, input.request);
  },
};
