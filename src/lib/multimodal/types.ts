// ─────────────────────────────────────────────────────────────────────────────
// e-Mate AI Unified Multimodal Generation System — Type Definitions
// ─────────────────────────────────────────────────────────────────────────────

export type TaskType =
  | 'general_chat'
  | 'writing'
  | 'coding'
  | 'image_generation'
  | 'structured_data'
  | 'document_generation'
  | 'study_assistance';

export type InputModality = 'text' | 'image' | 'audio' | 'document';
export type OutputModality = 'text' | 'image' | 'code' | 'structured_data' | 'document';

export type ProviderId = 'openrouter' | 'openai' | 'anthropic' | 'google' | 'perplexity';

export interface ModelCapability {
  supportsText: boolean;
  supportsStreaming: boolean;
  supportsVisionInput: boolean;
  supportsImageGeneration: boolean;
  supportsCodeGeneration: boolean;
  supportsStructuredOutput: boolean;
  supportsToolCalling: boolean;
}

export interface UnifiedModelMetadata {
  /** Stable internal model ID (e.g. 'emate', 'openrouter/free', 'black-forest-labs/flux-1-schnell') */
  id: string;
  /** Human-readable display name */
  name: string;
  /** Provider responsible for servicing this model */
  provider: ProviderId;
  /** Upstream provider slug/identifier */
  providerModelId: string;
  /** Brief description of strengths */
  description: string;
  /** Badge / visual chip text */
  badge: string;
  /** Category for UI grouping */
  category: 'Flagship' | 'Google' | 'Meta' | 'NVIDIA' | 'DeepSeek' | 'Anthropic' | 'OpenAI' | 'Other';
  /** Supported input modalities */
  inputModalities: InputModality[];
  /** Supported output modalities */
  outputModalities: OutputModality[];
  /** Detailed capability flags */
  capabilities: ModelCapability;
  /** Context window limit in tokens */
  contextLength?: number;
  /** Whether the model is 100% free with zero token credits needed */
  isFree: boolean;
  /** Flagship model tag */
  isFlagship?: boolean;
  /** Fallback model if this model rate-limits or fails */
  fallbackModelId?: string;
  /** Verification status */
  status: 'verified' | 'experimental' | 'deprecated';
}

// ─────────────────────────────────────────────────────────────────────────────
// Common Output Schema
// ─────────────────────────────────────────────────────────────────────────────

export type OutputBlockType =
  | 'text'
  | 'code'
  | 'image'
  | 'file'
  | 'structured_data'
  | 'status'
  | 'error';

export interface BaseOutputBlock {
  id: string;
  type: OutputBlockType;
  timestamp: string;
}

export interface TextOutputBlock extends BaseOutputBlock {
  type: 'text';
  text: string;
  citations?: Array<{
    title: string;
    source: string;
    snippet?: string;
    pageNumber?: number;
  }>;
}

export interface CodeFileItem {
  filename: string;
  language: string;
  content: string;
  description?: string;
}

export interface CodeOutputBlock extends BaseOutputBlock {
  type: 'code';
  language: string;
  code: string;
  explanation?: string;
  files?: CodeFileItem[];
}

export interface ImageOutputBlock extends BaseOutputBlock {
  type: 'image';
  url: string;
  prompt: string;
  aspectRatio?: string;
  revisedPrompt?: string;
  model: string;
  provider: ProviderId;
}

export interface FileOutputBlock extends BaseOutputBlock {
  type: 'file';
  artifactId: string;
  filename: string;
  mimeType: string;
  sizeBytes?: number;
  downloadUrl: string;
  format: 'csv' | 'json' | 'markdown' | 'txt' | 'pdf' | 'html';
  summary?: string;
}

export interface StructuredDataOutputBlock extends BaseOutputBlock {
  type: 'structured_data';
  format: 'json' | 'csv' | 'table';
  data: unknown;
  schemaTitle?: string;
}

export interface StatusOutputBlock extends BaseOutputBlock {
  type: 'status';
  state: 'pending' | 'processing' | 'routing' | 'retrying' | 'fallback' | 'complete';
  message: string;
  selectedModel?: string;
  fallbackFromModel?: string;
}

export interface ErrorOutputBlock extends BaseOutputBlock {
  type: 'error';
  code: string;
  message: string;
  recoverable: boolean;
  suggestedAction?: string;
}

export type OutputBlock =
  | TextOutputBlock
  | CodeOutputBlock
  | ImageOutputBlock
  | FileOutputBlock
  | StructuredDataOutputBlock
  | StatusOutputBlock
  | ErrorOutputBlock;

export interface UnifiedGenerationResult {
  taskId: string;
  taskType: TaskType;
  modelUsed: string;
  providerUsed: ProviderId;
  fallbackOccurred: boolean;
  fallbackFromModel?: string;
  blocks: OutputBlock[];
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}
