// ─────────────────────────────────────────────────────────────────────────────
// e-Mate AI Task-Aware Generation Orchestrator
// ─────────────────────────────────────────────────────────────────────────────

import {
  TaskType,
  OutputModality,
  UnifiedModelMetadata,
  UnifiedGenerationResult,
  OutputBlock,
  TextOutputBlock,
  ImageOutputBlock,
  CodeOutputBlock,
  StructuredDataOutputBlock,
  FileOutputBlock,
  StatusOutputBlock,
  ErrorOutputBlock,
} from './types';
import { resolveModelForTask, getModelMetadata } from './registry';
import { getProviderAdapter } from './adapters';

export interface OrchestrationRequest {
  taskId?: string;
  prompt: string;
  messages?: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string | Array<Record<string, unknown>>;
  }>;
  requestedModelId?: string;
  explicitTaskType?: TaskType;
  attachments?: Array<{
    fileName?: string;
    mimeType?: string;
    data?: string;
    text?: string;
  }>;
  subject?: string;
  unit?: string;
  apiKey?: string;
  stream?: boolean;
}

/**
 * Deterministic Task Classifier
 * Interprets prompt patterns and attachments to identify generation intent
 * without requiring an extra expensive LLM classification round-trip.
 */
export function classifyTask(
  prompt: string,
  attachments?: Array<{ mimeType?: string; fileName?: string }>,
  explicitType?: TaskType
): { taskType: TaskType; targetModality: OutputModality; hasVisionInput: boolean } {
  const hasVisionInput = Boolean(
    attachments?.some((att) =>
      att.mimeType?.startsWith('image/') ||
      /\.(png|jpe?g|webp|gif|svg)$/i.test(att.fileName || '')
    )
  );

  if (explicitType) {
    const modalityMap: Record<TaskType, OutputModality> = {
      image_generation: 'image',
      coding: 'code',
      structured_data: 'structured_data',
      document_generation: 'document',
      writing: 'text',
      study_assistance: 'text',
      general_chat: 'text',
    };
    return {
      taskType: explicitType,
      targetModality: modalityMap[explicitType] || 'text',
      hasVisionInput,
    };
  }

  const p = prompt.trim().toLowerCase();

  // 1. Image Generation Intent
  const isImagePrompt =
    p.startsWith('/image') ||
    p.startsWith('/img') ||
    /\b(generate (an? )?image|draw (an? )?image|create a visual|illustrate|render a diagram|photorealistic picture of)\b/i.test(p);

  if (isImagePrompt) {
    return { taskType: 'image_generation', targetModality: 'image', hasVisionInput };
  }

  // 2. Code Generation Intent
  const isCodePrompt =
    /\b(write (the )?(code|script|function|component|program|api)|implement (in |a )?(typescript|javascript|python|java|c\+\+|html|css|sql|rust|go)|multi-file project|scaffold (a )?project)\b/i.test(p) ||
    /```[\s\S]*```/.test(prompt);

  if (isCodePrompt) {
    return { taskType: 'coding', targetModality: 'code', hasVisionInput };
  }

  // 3. Structured Data Intent
  const isStructuredDataPrompt =
    /\b(output (as |in )?(json|csv|yaml)|format as json|generate a csv|database schema|json array|tabular data)\b/i.test(p);

  if (isStructuredDataPrompt) {
    return { taskType: 'structured_data', targetModality: 'structured_data', hasVisionInput };
  }

  // 4. Document / Study Guide Generation Intent
  const isDocPrompt =
    /\b(study guide|revision sheet|summary notes|chapter outline|comprehensive syllabus notes|executive summary)\b/i.test(p);

  if (isDocPrompt) {
    return { taskType: 'document_generation', targetModality: 'document', hasVisionInput };
  }

  return { taskType: 'study_assistance', targetModality: 'text', hasVisionInput };
}

/**
 * Parses markdown code blocks into structured CodeOutputBlock or multi-file items
 */
export function extractCodeBlocks(text: string): {
  cleanText: string;
  codeBlocks: Array<{ language: string; code: string; filename?: string }>;
} {
  const codeRegex = /```([a-zA-Z0-9_-]+)?(?:\s+(?:filename=([^\n]+)|([a-zA-Z0-9_.-]+)))?\n([\s\S]*?)```/g;
  const blocks: Array<{ language: string; code: string; filename?: string }> = [];
  let cleanText = text;

  let match;
  while ((match = codeRegex.exec(text)) !== null) {
    const language = (match[1] || 'plaintext').trim().toLowerCase();
    const filename = (match[2] || match[3] || '').trim();
    const code = match[4].trimEnd();
    blocks.push({ language, code, filename: filename || undefined });
  }

  return { cleanText, codeBlocks: blocks };
}

/**
 * Main Task Orchestrator Execution
 */
export async function orchestrateGeneration(
  request: OrchestrationRequest
): Promise<UnifiedGenerationResult> {
  const taskId = request.taskId || `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const { taskType, targetModality, hasVisionInput } = classifyTask(
    request.prompt,
    request.attachments,
    request.explicitTaskType
  );

  // 1. Resolve optimal model & check capability
  const resolution = resolveModelForTask(request.requestedModelId, taskType, hasVisionInput);
  const selectedModel = resolution.model;
  const adapter = getProviderAdapter(selectedModel.provider);

  const blocks: OutputBlock[] = [];
  const now = new Date().toISOString();

  // If fallback occurred, notify transparently as requested
  if (resolution.fallbackOccurred && resolution.reason) {
    const statusBlock: StatusOutputBlock = {
      id: `${taskId}-fallback-notice`,
      type: 'status',
      state: 'fallback',
      message: resolution.reason,
      selectedModel: selectedModel.name,
      fallbackFromModel: request.requestedModelId,
      timestamp: now,
    };
    blocks.push(statusBlock);
  }

  // 2. Execute Image Generation Pipeline
  if (taskType === 'image_generation') {
    try {
      const cleanPrompt = request.prompt
        .replace(/^\/(image|img)\s+/i, '')
        .replace(/^generate (an? )?image of\s+/i, '')
        .trim();

      const imageResult = await adapter.generateImage({
        prompt: cleanPrompt,
        model: selectedModel,
        apiKey: request.apiKey,
      });

      const imageBlock: ImageOutputBlock = {
        id: `${taskId}-img`,
        type: 'image',
        url: imageResult.imageUrl,
        prompt: cleanPrompt,
        revisedPrompt: imageResult.revisedPrompt,
        model: selectedModel.name,
        provider: selectedModel.provider,
        timestamp: new Date().toISOString(),
      };
      blocks.push(imageBlock);

      return {
        taskId,
        taskType,
        modelUsed: selectedModel.id,
        providerUsed: selectedModel.provider,
        fallbackOccurred: resolution.fallbackOccurred,
        fallbackFromModel: resolution.fallbackOccurred ? request.requestedModelId : undefined,
        blocks,
      };
    } catch (err: any) {
      const errorBlock: ErrorOutputBlock = {
        id: `${taskId}-err`,
        type: 'error',
        code: 'image_generation_failed',
        message: err?.message || 'Image generation failed. Please try a different prompt.',
        recoverable: true,
        suggestedAction: 'Retry image generation with alternative phrasing',
        timestamp: new Date().toISOString(),
      };
      blocks.push(errorBlock);
      return {
        taskId,
        taskType,
        modelUsed: selectedModel.id,
        providerUsed: selectedModel.provider,
        fallbackOccurred: resolution.fallbackOccurred,
        blocks,
      };
    }
  }

  // 3. Execute Text / Code / Structured Generation Pipeline
  try {
    const messages = request.messages && request.messages.length > 0
      ? request.messages
      : [{ role: 'user' as const, content: request.prompt }];

    const textResult = await adapter.generateText({
      model: selectedModel,
      messages,
      apiKey: request.apiKey,
    });

    // Check for code blocks
    const { codeBlocks } = extractCodeBlocks(textResult.text);

    if (codeBlocks.length > 0 && taskType === 'coding') {
      const primaryCode = codeBlocks[0];
      const codeBlock: CodeOutputBlock = {
        id: `${taskId}-code`,
        type: 'code',
        language: primaryCode.language,
        code: primaryCode.code,
        files: codeBlocks.map((b) => ({
          filename: b.filename || `snippet.${b.language === 'typescript' ? 'ts' : b.language === 'python' ? 'py' : 'txt'}`,
          language: b.language,
          content: b.code,
        })),
        timestamp: new Date().toISOString(),
      };
      blocks.push(codeBlock);
    }

    const textBlock: TextOutputBlock = {
      id: `${taskId}-text`,
      type: 'text',
      text: textResult.text,
      timestamp: new Date().toISOString(),
    };
    blocks.push(textBlock);

    return {
      taskId,
      taskType,
      modelUsed: selectedModel.id,
      providerUsed: selectedModel.provider,
      fallbackOccurred: resolution.fallbackOccurred,
      fallbackFromModel: resolution.fallbackOccurred ? request.requestedModelId : undefined,
      blocks,
      usage: textResult.usage,
    };
  } catch (err: any) {
    const errorBlock: ErrorOutputBlock = {
      id: `${taskId}-err`,
      type: 'error',
      code: 'generation_failed',
      message: err?.message || 'Generation failed. Please try again or choose another model.',
      recoverable: true,
      timestamp: new Date().toISOString(),
    };
    blocks.push(errorBlock);
    return {
      taskId,
      taskType,
      modelUsed: selectedModel.id,
      providerUsed: selectedModel.provider,
      fallbackOccurred: resolution.fallbackOccurred,
      blocks,
    };
  }
}
