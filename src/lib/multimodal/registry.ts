// ─────────────────────────────────────────────────────────────────────────────
// e-Mate AI Unified Multimodal Model Registry & Capability Engine
// ─────────────────────────────────────────────────────────────────────────────

import { UnifiedModelMetadata, TaskType, OutputModality } from './types';

/**
 * Master Registry of verified models in the e-Mate AI system.
 * Modalities, capabilities, and context limits are verified against actual provider endpoints.
 */
export const MASTER_MODEL_REGISTRY: UnifiedModelMetadata[] = [
  // ── 1. Flagship Models ─────────────────────────────────────────────────────
  {
    id: 'emate',
    name: 'e-Mate Mentor',
    provider: 'openrouter',
    providerModelId: 'openrouter/free',
    description: 'Proprietary AI academic mentor with dynamic resilient mesh failover',
    badge: 'Flagship • Resilient',
    category: 'Flagship',
    inputModalities: ['text', 'image'],
    outputModalities: ['text', 'code', 'structured_data', 'document'],
    capabilities: {
      supportsText: true,
      supportsStreaming: true,
      supportsVisionInput: true,
      supportsImageGeneration: false, // Routed to Flux when image requested
      supportsCodeGeneration: true,
      supportsStructuredOutput: true,
      supportsToolCalling: true,
    },
    contextLength: 200000,
    isFree: true,
    isFlagship: true,
    fallbackModelId: 'openrouter/free',
    status: 'verified',
  },
  {
    id: 'auto',
    name: 'Auto (Task Optimized)',
    provider: 'openrouter',
    providerModelId: 'openrouter/free',
    description: 'Automatically picks the optimal model based on your requested task (code, image, vision, text)',
    badge: 'Smart Auto Router',
    category: 'Flagship',
    inputModalities: ['text', 'image'],
    outputModalities: ['text', 'image', 'code', 'structured_data', 'document'],
    capabilities: {
      supportsText: true,
      supportsStreaming: true,
      supportsVisionInput: true,
      supportsImageGeneration: true,
      supportsCodeGeneration: true,
      supportsStructuredOutput: true,
      supportsToolCalling: true,
    },
    contextLength: 262144,
    isFree: true,
    isFlagship: true,
    fallbackModelId: 'emate',
    status: 'verified',
  },

  // ── 2. Dedicated Image Generation Engine ───────────────────────────────────
  {
    id: 'black-forest-labs/flux-1-schnell',
    name: 'FLUX.1 Schnell',
    provider: 'openrouter',
    providerModelId: 'black-forest-labs/flux-1-schnell',
    description: 'State-of-the-art 12B parameter visual synthesis engine for diagrams, charts, and illustrations',
    badge: 'Image Gen • 12B',
    category: 'Other',
    inputModalities: ['text'],
    outputModalities: ['image'],
    capabilities: {
      supportsText: false,
      supportsStreaming: false,
      supportsVisionInput: false,
      supportsImageGeneration: true,
      supportsCodeGeneration: false,
      supportsStructuredOutput: false,
      supportsToolCalling: false,
    },
    isFree: true,
    fallbackModelId: undefined,
    status: 'verified',
  },

  // ── 3. Google Multimodal & Vision Models ──────────────────────────────────
  {
    id: 'google/gemma-4-31b-it:free',
    name: 'Google Gemma 4 31B',
    provider: 'openrouter',
    providerModelId: 'google/gemma-4-31b-it:free',
    description: 'Instruction-tuned multimodal model from Google DeepMind with image perception',
    badge: 'Google • Vision Input',
    category: 'Google',
    inputModalities: ['text', 'image'],
    outputModalities: ['text', 'code', 'structured_data', 'document'],
    capabilities: {
      supportsText: true,
      supportsStreaming: true,
      supportsVisionInput: true,
      supportsImageGeneration: false,
      supportsCodeGeneration: true,
      supportsStructuredOutput: true,
      supportsToolCalling: true,
    },
    contextLength: 262144,
    isFree: true,
    fallbackModelId: 'openrouter/free',
    status: 'verified',
  },
  {
    id: 'google/gemma-4-26b-a4b-it:free',
    name: 'Google Gemma 4 26B',
    provider: 'openrouter',
    providerModelId: 'google/gemma-4-26b-a4b-it:free',
    description: 'High efficiency mixture-of-experts model from Google DeepMind',
    badge: 'Google • MoE Vision',
    category: 'Google',
    inputModalities: ['text', 'image'],
    outputModalities: ['text', 'code', 'structured_data'],
    capabilities: {
      supportsText: true,
      supportsStreaming: true,
      supportsVisionInput: true,
      supportsImageGeneration: false,
      supportsCodeGeneration: true,
      supportsStructuredOutput: true,
      supportsToolCalling: true,
    },
    contextLength: 262144,
    isFree: true,
    fallbackModelId: 'openrouter/free',
    status: 'verified',
  },

  // ── 4. NVIDIA Frontier & Long-Context Models ──────────────────────────────
  {
    id: 'nvidia/nemotron-3.5-lightning:free',
    name: 'Nemotron 3.5 Lightning',
    provider: 'openrouter',
    providerModelId: 'nvidia/nemotron-3.5-lightning:free',
    description: 'Ultra-fast STEM reasoning and textbook analysis with massive 1,000,000 token context',
    badge: '1M Context • Fast',
    category: 'NVIDIA',
    inputModalities: ['text'],
    outputModalities: ['text', 'code', 'structured_data', 'document'],
    capabilities: {
      supportsText: true,
      supportsStreaming: true,
      supportsVisionInput: false,
      supportsImageGeneration: false,
      supportsCodeGeneration: true,
      supportsStructuredOutput: true,
      supportsToolCalling: true,
    },
    contextLength: 1000000,
    isFree: true,
    fallbackModelId: 'openrouter/free',
    status: 'verified',
  },
  {
    id: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    name: 'Nemotron 3 Ultra 550B',
    provider: 'openrouter',
    providerModelId: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    description: 'Frontier 550B MoE reasoning engine for complex mathematics and academic research',
    badge: '550B MoE • 1M Context',
    category: 'NVIDIA',
    inputModalities: ['text'],
    outputModalities: ['text', 'code', 'structured_data', 'document'],
    capabilities: {
      supportsText: true,
      supportsStreaming: true,
      supportsVisionInput: false,
      supportsImageGeneration: false,
      supportsCodeGeneration: true,
      supportsStructuredOutput: true,
      supportsToolCalling: true,
    },
    contextLength: 1000000,
    isFree: true,
    fallbackModelId: 'openrouter/free',
    status: 'verified',
  },
  {
    id: 'nvidia/nemotron-3-super-120b-a12b:free',
    name: 'Nemotron 3 Super 120B',
    provider: 'openrouter',
    providerModelId: 'nvidia/nemotron-3-super-120b-a12b:free',
    description: 'High-throughput 120B reasoning model from NVIDIA',
    badge: '120B MoE • Fast',
    category: 'NVIDIA',
    inputModalities: ['text'],
    outputModalities: ['text', 'code', 'structured_data'],
    capabilities: {
      supportsText: true,
      supportsStreaming: true,
      supportsVisionInput: false,
      supportsImageGeneration: false,
      supportsCodeGeneration: true,
      supportsStructuredOutput: true,
      supportsToolCalling: true,
    },
    contextLength: 262144,
    isFree: true,
    fallbackModelId: 'openrouter/free',
    status: 'verified',
  },

  // ── 5. Specialized Coding & Logic Models ──────────────────────────────────
  {
    id: 'poolside/laguna-s-2.1:free',
    name: 'Laguna S 2.1 Code',
    provider: 'openrouter',
    providerModelId: 'poolside/laguna-s-2.1:free',
    description: 'Specialized software engineering and multi-file code generation agent',
    badge: 'Code & Logic Agent',
    category: 'Other',
    inputModalities: ['text'],
    outputModalities: ['text', 'code', 'structured_data'],
    capabilities: {
      supportsText: true,
      supportsStreaming: true,
      supportsVisionInput: false,
      supportsImageGeneration: false,
      supportsCodeGeneration: true,
      supportsStructuredOutput: true,
      supportsToolCalling: true,
    },
    contextLength: 262144,
    isFree: true,
    fallbackModelId: 'openrouter/free',
    status: 'verified',
  },
  {
    id: 'cohere/north-mini-code:free',
    name: 'Cohere North Mini',
    provider: 'openrouter',
    providerModelId: 'cohere/north-mini-code:free',
    description: 'High precision code synthesis, debugging, and algorithms solver',
    badge: 'Code & STEM Solver',
    category: 'Other',
    inputModalities: ['text'],
    outputModalities: ['text', 'code', 'structured_data'],
    capabilities: {
      supportsText: true,
      supportsStreaming: true,
      supportsVisionInput: false,
      supportsImageGeneration: false,
      supportsCodeGeneration: true,
      supportsStructuredOutput: true,
      supportsToolCalling: true,
    },
    contextLength: 256000,
    isFree: true,
    fallbackModelId: 'openrouter/free',
    status: 'verified',
  },

  // ── 6. Study, Notes & Synthesis ───────────────────────────────────────────
  {
    id: 'dots-studio/dots-3-note-preview:free',
    name: 'Dots3 Note Preview',
    provider: 'openrouter',
    providerModelId: 'dots-studio/dots-3-note-preview:free',
    description: 'Mixture-of-experts model specialized in notes distillation, outlines, and document drafting',
    badge: '512k Context • Notes',
    category: 'Other',
    inputModalities: ['text'],
    outputModalities: ['text', 'document', 'structured_data'],
    capabilities: {
      supportsText: true,
      supportsStreaming: true,
      supportsVisionInput: false,
      supportsImageGeneration: false,
      supportsCodeGeneration: true,
      supportsStructuredOutput: true,
      supportsToolCalling: true,
    },
    contextLength: 512000,
    isFree: true,
    fallbackModelId: 'openrouter/free',
    status: 'verified',
  },
  {
    id: 'liquid/lfm-2.5-2.6b:free',
    name: 'Liquid LFM 2.5',
    provider: 'openrouter',
    providerModelId: 'liquid/lfm-2.5-2.6b:free',
    description: 'Ultra-lightweight, lightning fast conversational assistant by Liquid AI',
    badge: 'Ultra Fast • Instant',
    category: 'Other',
    inputModalities: ['text'],
    outputModalities: ['text'],
    capabilities: {
      supportsText: true,
      supportsStreaming: true,
      supportsVisionInput: false,
      supportsImageGeneration: false,
      supportsCodeGeneration: false,
      supportsStructuredOutput: true,
      supportsToolCalling: false,
    },
    contextLength: 65536,
    isFree: true,
    fallbackModelId: 'openrouter/free',
    status: 'verified',
  },
  {
    id: 'openrouter/free',
    name: 'Auto Free Mesh',
    provider: 'openrouter',
    providerModelId: 'openrouter/free',
    description: 'Live auto-routing through OpenRouter free tier with zero token cost',
    badge: 'Dynamic Free Mesh',
    category: 'Other',
    inputModalities: ['text'],
    outputModalities: ['text', 'code', 'structured_data'],
    capabilities: {
      supportsText: true,
      supportsStreaming: true,
      supportsVisionInput: false,
      supportsImageGeneration: false,
      supportsCodeGeneration: true,
      supportsStructuredOutput: true,
      supportsToolCalling: true,
    },
    contextLength: 200000,
    isFree: true,
    fallbackModelId: undefined,
    status: 'verified',
  },
];

/** Lookup a model definition by internal ID */
export function getModelMetadata(modelId: string): UnifiedModelMetadata | undefined {
  if (!modelId) return undefined;
  return MASTER_MODEL_REGISTRY.find(
    (m) => m.id.toLowerCase() === modelId.toLowerCase() || m.providerModelId.toLowerCase() === modelId.toLowerCase()
  );
}

/** Check if a model supports a specific output modality */
export function modelSupportsOutput(model: UnifiedModelMetadata, modality: OutputModality): boolean {
  return model.outputModalities.includes(modality);
}

/** Check if a model supports vision input */
export function modelSupportsVision(model: UnifiedModelMetadata): boolean {
  return model.capabilities.supportsVisionInput;
}

/**
 * Find the optimal model for a given task and input conditions.
 * If user selected an explicit model:
 *   - If compatible with the requested modality and inputs, uses user selection.
 *   - If incompatible (e.g. user selected text-only model but requested an image),
 *     gracefully routes to the dedicated capable model and flags the fallback.
 */
export function resolveModelForTask(
  requestedModelId: string | undefined,
  taskType: TaskType,
  hasVisionInput: boolean
): {
  model: UnifiedModelMetadata;
  fallbackOccurred: boolean;
  reason?: string;
} {
  const defaultModel = MASTER_MODEL_REGISTRY.find((m) => m.id === 'emate') || MASTER_MODEL_REGISTRY[0];

  // 1. Task: Image Generation
  if (taskType === 'image_generation') {
    const fluxModel = MASTER_MODEL_REGISTRY.find((m) => m.id === 'black-forest-labs/flux-1-schnell')!;
    if (requestedModelId && requestedModelId !== 'auto' && requestedModelId !== fluxModel.id) {
      const requested = getModelMetadata(requestedModelId);
      if (!requested?.capabilities.supportsImageGeneration) {
        return {
          model: fluxModel,
          fallbackOccurred: true,
          reason: `Model '${requested?.name || requestedModelId}' does not support raw image generation. Auto-routed to FLUX.1 Schnell image engine.`,
        };
      }
    }
    return { model: fluxModel, fallbackOccurred: false };
  }

  // 2. Task with Vision Input (attachments)
  if (hasVisionInput) {
    if (requestedModelId && requestedModelId !== 'auto' && requestedModelId !== 'emate') {
      const requested = getModelMetadata(requestedModelId);
      if (requested && !requested.capabilities.supportsVisionInput) {
        const visionModel = MASTER_MODEL_REGISTRY.find((m) => m.capabilities.supportsVisionInput)!;
        return {
          model: visionModel,
          fallbackOccurred: true,
          reason: `Model '${requested.name}' is text-only. Switched to vision-capable model '${visionModel.name}' to inspect your uploaded image.`,
        };
      }
    }
    // Route to vision-capable model
    const visionModel =
      MASTER_MODEL_REGISTRY.find((m) => m.id === 'google/gemma-4-31b-it:free') ||
      MASTER_MODEL_REGISTRY.find((m) => m.capabilities.supportsVisionInput) ||
      defaultModel;
    return { model: visionModel, fallbackOccurred: false };
  }

  // 3. User explicitly chose a valid model
  if (requestedModelId && requestedModelId !== 'auto') {
    const requested = getModelMetadata(requestedModelId);
    if (requested) {
      // Validate code gen capability
      if (taskType === 'coding' && !requested.capabilities.supportsCodeGeneration) {
        const codeModel = MASTER_MODEL_REGISTRY.find((m) => m.id === 'poolside/laguna-s-2.1:free') || defaultModel;
        return {
          model: codeModel,
          fallbackOccurred: true,
          reason: `Selected model '${requested.name}' is compact text-only. Switched to '${codeModel.name}' for full code generation.`,
        };
      }
      return { model: requested, fallbackOccurred: false };
    }
  }

  // 4. Auto Mode: Select model based on task
  if (taskType === 'coding') {
    const codeModel =
      MASTER_MODEL_REGISTRY.find((m) => m.id === 'poolside/laguna-s-2.1:free') ||
      MASTER_MODEL_REGISTRY.find((m) => m.id === 'cohere/north-mini-code:free') ||
      defaultModel;
    return { model: codeModel, fallbackOccurred: false };
  }

  if (taskType === 'document_generation') {
    const docModel =
      MASTER_MODEL_REGISTRY.find((m) => m.id === 'dots-studio/dots-3-note-preview:free') ||
      MASTER_MODEL_REGISTRY.find((m) => m.id === 'nvidia/nemotron-3.5-lightning:free') ||
      defaultModel;
    return { model: docModel, fallbackOccurred: false };
  }

  return { model: defaultModel, fallbackOccurred: false };
}
