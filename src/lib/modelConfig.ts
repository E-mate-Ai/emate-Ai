// ─────────────────────────────────────────────────────────────────────────────
// e-Mate Model & Routing Configuration
// Central configuration for the proprietary 'emate' flagship model and all
// 100% free OpenRouter models available to users.
// ─────────────────────────────────────────────────────────────────────────────

export interface AIModelDefinition {
  id: string;
  name: string;
  badge: string;
  description: string;
  isFlagship?: boolean;
  category: 'Flagship' | 'Google' | 'Meta' | 'DeepSeek' | 'Qwen' | 'Mistral' | 'Other';
  pricing: 'free';
  contextLength?: number;
}

/**
 * All 100% free models connected from OpenRouter, with 'emate' at the helm.
 */
export const ALL_FREE_MODELS: AIModelDefinition[] = [
  {
    id: 'emate',
    name: 'e-Mate',
    badge: 'Flagship • 17-Model Auto-Mesh',
    description: 'Proprietary study mentor with silent automatic failover across 17 free OpenRouter models',
    isFlagship: true,
    category: 'Flagship',
    pricing: 'free',
  },
  {
    id: 'google/gemini-2.0-flash:free',
    name: 'Gemini 2.0 Flash',
    badge: 'Fastest • Free',
    description: 'Ultra-fast multimodal reasoning with instant responses',
    category: 'Google',
    pricing: 'free',
    contextLength: 1048576,
  },
  {
    id: 'google/gemini-2.0-flash-exp:free',
    name: 'Gemini 2.0 Flash Exp',
    badge: 'Experimental • Free',
    description: 'Latest bleeding-edge Gemini experimental build',
    category: 'Google',
    pricing: 'free',
    contextLength: 1048576,
  },
  {
    id: 'google/gemini-2.0-pro-exp:free',
    name: 'Gemini 2.0 Pro Exp',
    badge: 'Deep Reasoning • Free',
    description: 'Powerful multi-step problem solving & long-form analysis',
    category: 'Google',
    pricing: 'free',
    contextLength: 2097152,
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Llama 3.3 70B',
    badge: 'High Intelligence • Free',
    description: 'Top-tier open weights model matching proprietary frontier capabilities',
    category: 'Meta',
    pricing: 'free',
    contextLength: 131072,
  },
  {
    id: 'meta-llama/llama-3.2-3b-instruct:free',
    name: 'Llama 3.2 3B',
    badge: 'Ultra Fast • Free',
    description: 'Compact high-speed conversational assistant',
    category: 'Meta',
    pricing: 'free',
    contextLength: 131072,
  },
  {
    id: 'meta-llama/llama-3.1-8b-instruct:free',
    name: 'Llama 3.1 8B',
    badge: 'Concise • Free',
    description: 'Solid everyday chat and study buddy',
    category: 'Meta',
    pricing: 'free',
    contextLength: 131072,
  },
  {
    id: 'meta-llama/llama-3.2-11b-vision-instruct:free',
    name: 'Llama 3.2 11B Vision',
    badge: 'Vision • Free',
    description: 'Multimodal image and text understanding',
    category: 'Meta',
    pricing: 'free',
    contextLength: 131072,
  },
  {
    id: 'deepseek/deepseek-r1:free',
    name: 'DeepSeek R1',
    badge: 'Math & Logic • Free',
    description: 'Open-weights reasoning champion for STEM proofs, derivations & logic',
    category: 'DeepSeek',
    pricing: 'free',
    contextLength: 65536,
  },
  {
    id: 'deepseek/deepseek-chat:free',
    name: 'DeepSeek V3',
    badge: 'General Chat • Free',
    description: 'State-of-the-art general knowledge, coding and dialogue',
    category: 'DeepSeek',
    pricing: 'free',
    contextLength: 65536,
  },
  {
    id: 'qwen/qwen-2.5-coder-32b-instruct:free',
    name: 'Qwen 2.5 Coder 32B',
    badge: 'Code Specialist • Free',
    description: 'Exceptional programming, debugging, algorithms and syntax analysis',
    category: 'Qwen',
    pricing: 'free',
    contextLength: 32768,
  },
  {
    id: 'qwen/qwen-2.5-7b-instruct:free',
    name: 'Qwen 2.5 7B',
    badge: 'Fast Study • Free',
    description: 'Lightweight multilingual instruction follower',
    category: 'Qwen',
    pricing: 'free',
    contextLength: 32768,
  },
  {
    id: 'mistralai/mistral-small-3:free',
    name: 'Mistral Small 3',
    badge: 'Compact Logic • Free',
    description: 'Efficient European frontier model with rapid execution',
    category: 'Mistral',
    pricing: 'free',
    contextLength: 32768,
  },
  {
    id: 'mistralai/mistral-7b-instruct:free',
    name: 'Mistral 7B',
    badge: 'Classic • Free',
    description: 'Reliable reasoning and summarization workhorse',
    category: 'Mistral',
    pricing: 'free',
    contextLength: 32768,
  },
  {
    id: 'microsoft/phi-3-medium-128k-instruct:free',
    name: 'Phi-3 Medium 128k',
    badge: '128k Context • Free',
    description: 'Dense architectural efficiency with large context window',
    category: 'Other',
    pricing: 'free',
    contextLength: 131072,
  },
  {
    id: 'cognitivecomputations/dolphin3.0-r1-mistral-24b:free',
    name: 'Dolphin 3.0 R1 Mistral',
    badge: 'Uncensored • Free',
    description: 'Fine-tuned reasoning and multi-turn instruction adherence',
    category: 'Other',
    pricing: 'free',
    contextLength: 32768,
  },
  {
    id: 'openrouter/auto',
    name: 'OpenRouter Auto',
    badge: 'Live Auto • Free',
    description: 'Dynamically routes to the highest-availability live free model',
    category: 'Other',
    pricing: 'free',
  },
];

export interface AdminModelConfig {
  activeEngineForEmate: string; // The underlying model slug that powers 'emate'
  enabledModelIds: string[]; // Models permitted to appear in the user switcher
  modelSelectorEnabled: boolean; // Global admin flag for model switcher UI
  updatedAt: string;
}

// Global runtime model config (synced by admin panel)
let currentAdminConfig: AdminModelConfig = {
  activeEngineForEmate: 'google/gemini-2.0-flash:free',
  enabledModelIds: ALL_FREE_MODELS.map((m) => m.id),
  modelSelectorEnabled: true,
  updatedAt: new Date().toISOString(),
};

export function getAdminModelConfig(): AdminModelConfig {
  return currentAdminConfig;
}

export function updateAdminModelConfig(patch: Partial<AdminModelConfig>): AdminModelConfig {
  currentAdminConfig = {
    ...currentAdminConfig,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  return currentAdminConfig;
}

/**
 * The prioritized sequence of all 16 free OpenRouter models pooled into the
 * e-Mate resilient mesh.
 */
export const FREE_CASCADE_SLUGS: string[] = [
  'google/gemini-2.0-flash:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'deepseek/deepseek-chat:free',
  'deepseek/deepseek-r1:free',
  'google/gemini-2.0-flash-exp:free',
  'qwen/qwen-2.5-coder-32b-instruct:free',
  'mistralai/mistral-small-3:free',
  'google/gemini-2.0-pro-exp:free',
  'meta-llama/llama-3.1-8b-instruct:free',
  'qwen/qwen-2.5-7b-instruct:free',
  'mistralai/mistral-7b-instruct:free',
  'meta-llama/llama-3.2-3b-instruct:free',
  'meta-llama/llama-3.2-11b-vision-instruct:free',
  'microsoft/phi-3-medium-128k-instruct:free',
  'cognitivecomputations/dolphin3.0-r1-mistral-24b:free',
  'openrouter/auto',
];

/**
 * Returns the entire 17-model resilient cascade.
 * The primary candidate is tried first (based on admin config or user selection),
 * followed by all other free models in priority order.
 */
export function getFreeModelCascade(preferredModel?: string): string[] {
  const primary = preferredModel && preferredModel !== 'emate'
    ? resolveModelId(preferredModel)
    : resolveModelId('emate');

  const ordered = [primary, ...FREE_CASCADE_SLUGS];
  // Deduplicate while preserving first appearance
  return ordered.filter((m, i, arr) => arr.indexOf(m) === i);
}

/**
 * Resolve any model id (such as 'emate' or legacy names) to a real, valid
 * OpenRouter model slug.
 */
export function resolveModelId(modelId: string): string {
  if (!modelId || modelId === 'emate') {
    return currentAdminConfig.activeEngineForEmate || 'google/gemini-2.0-flash:free';
  }
  // If the model is a known free model or custom slug, return directly
  return modelId;
}
