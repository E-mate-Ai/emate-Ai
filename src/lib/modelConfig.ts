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
    badge: 'Flagship • Resilient Mesh',
    description: 'Proprietary AI study mentor with automatic failover across live free OpenRouter models',
    isFlagship: true,
    category: 'Flagship',
    pricing: 'free',
  },
  {
    id: 'openrouter/free',
    name: 'Auto Free Mesh',
    badge: 'Live Auto • Free',
    description: 'Dynamically routes to the highest-availability live free model on OpenRouter with zero credits needed',
    category: 'Other',
    pricing: 'free',
    contextLength: 200000,
  },
  {
    id: 'nvidia/nemotron-3.5-lightning:free',
    name: 'Nemotron 3.5 Lightning',
    badge: 'Ultra Fast • 1M Context',
    description: 'High-speed reasoning with 1M context window from NVIDIA',
    category: 'Other',
    pricing: 'free',
    contextLength: 1000000,
  },
  {
    id: 'poolside/laguna-s-2.1:free',
    name: 'Laguna S 2.1',
    badge: 'Coding & Logic • Free',
    description: 'High-performance coding agent model by Poolside',
    category: 'Other',
    pricing: 'free',
    contextLength: 262144,
  },
  {
    id: 'liquid/lfm-2.5-2.6b:free',
    name: 'Liquid LFM 2.5',
    badge: 'Compact • Free',
    description: 'Efficient reasoning and study assistant by Liquid AI',
    category: 'Other',
    pricing: 'free',
    contextLength: 65536,
  },
  {
    id: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    name: 'Nemotron 3 Ultra',
    badge: 'Frontier • 1M Context',
    description: 'Frontier reasoning and orchestration model from NVIDIA',
    category: 'Other',
    pricing: 'free',
    contextLength: 1000000,
  },
  {
    id: 'google/gemma-4-31b-it:free',
    name: 'Google Gemma 4 31B',
    badge: 'Google • Free',
    description: 'Instruction-tuned multimodal model from Google DeepMind',
    category: 'Google',
    pricing: 'free',
    contextLength: 262144,
  },
  {
    id: 'google/gemma-4-26b-a4b-it:free',
    name: 'Google Gemma 4 26B',
    badge: 'Google • Free',
    description: 'Mixture-of-Experts instruction model from Google DeepMind',
    category: 'Google',
    pricing: 'free',
    contextLength: 262144,
  },
  {
    id: 'cohere/north-mini-code:free',
    name: 'Cohere North Mini',
    badge: 'Code & STEM • Free',
    description: 'Agentic coding and problem solving model by Cohere',
    category: 'Other',
    pricing: 'free',
    contextLength: 256000,
  },
  {
    id: 'dots-studio/dots-3-note-preview:free',
    name: 'Dots3 Note Preview',
    badge: '512k Context • Free',
    description: 'Mixture-of-experts model for notes, study, and text analysis',
    category: 'Other',
    pricing: 'free',
    contextLength: 512000,
  },
  {
    id: 'nvidia/nemotron-3-super-120b-a12b:free',
    name: 'Nemotron 3 Super',
    badge: '120B MoE • Free',
    description: '120B hybrid MoE model from NVIDIA with rapid execution',
    category: 'Other',
    pricing: 'free',
    contextLength: 262144,
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
  activeEngineForEmate: 'openrouter/free',
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
 * The prioritized sequence of live, verified free OpenRouter models pooled into the
 * e-Mate resilient mesh.
 */
export const FREE_CASCADE_SLUGS: string[] = [
  'openrouter/free',
  'nvidia/nemotron-3.5-lightning:free',
  'poolside/laguna-s-2.1:free',
  'liquid/lfm-2.5-2.6b:free',
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'dots-studio/dots-3-note-preview:free',
  'cohere/north-mini-code:free',
  'google/gemma-4-31b-it:free',
  'google/gemma-4-26b-a4b-it:free',
];

/**
 * Returns the entire resilient cascade.
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
    return currentAdminConfig.activeEngineForEmate || 'openrouter/free';
  }
  // If the model is a known free model or custom slug, return directly
  return modelId;
}
