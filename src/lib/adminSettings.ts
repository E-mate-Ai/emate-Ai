import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { ALL_FREE_MODELS } from '@/lib/modelConfig';

export type FeatureFlagId =
  | 'maintenanceMode'
  | 'referralProgram'
  | 'openrouterModelSelector'
  | 'newStudyMode'
  | 'experimentalAI';

export type AdminFeatureFlag = {
  id: FeatureFlagId;
  label: string;
  enabled: boolean;
  description: string;
  updatedAt: string;
};

export type RuntimeModelConfig = {
  activeEngineForEmate: string;
  enabledModelIds: string[];
  modelSelectorEnabled: boolean;
  updatedAt: string;
};

export const DEFAULT_FEATURE_FLAGS: AdminFeatureFlag[] = [
  {
    id: 'maintenanceMode',
    label: 'Maintenance mode',
    enabled: false,
    description: 'Pause chat requests and show a maintenance notice in the workspace.',
    updatedAt: '',
  },
  {
    id: 'referralProgram',
    label: 'Referral program',
    enabled: true,
    description: 'Show invite links and accept referral codes.',
    updatedAt: '',
  },
  {
    id: 'openrouterModelSelector',
    label: 'OpenRouter model selector',
    enabled: true,
    description: 'Let users choose a model in the chat composer.',
    updatedAt: '',
  },
  {
    id: 'newStudyMode',
    label: 'Study mode',
    enabled: true,
    description: 'Show the study workspace and study-specific suggestions.',
    updatedAt: '',
  },
  {
    id: 'experimentalAI',
    label: 'Experimental AI models',
    enabled: false,
    description: 'Show experimental free models in the model selector.',
    updatedAt: '',
  },
];

const DEFAULT_MODEL_CONFIG: RuntimeModelConfig = {
  activeEngineForEmate: 'openrouter/free',
  enabledModelIds: ALL_FREE_MODELS.map((model) => model.id),
  modelSelectorEnabled: true,
  updatedAt: '',
};

type AdminSettingsResult = {
  flags: AdminFeatureFlag[];
  modelConfig: RuntimeModelConfig;
  storageAvailable: boolean;
  storageError: string | null;
};

function getAdminSettingsClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function normalizeModelConfig(value: unknown): RuntimeModelConfig {
  if (!value || typeof value !== 'object') return { ...DEFAULT_MODEL_CONFIG };
  const candidate = value as Partial<RuntimeModelConfig>;
  const modelIds = new Set(ALL_FREE_MODELS.map((model) => model.id));
  const activeEngine = candidate.activeEngineForEmate;
  const enabledModelIds = Array.isArray(candidate.enabledModelIds)
    ? candidate.enabledModelIds.filter((id): id is string => typeof id === 'string' && modelIds.has(id))
    : DEFAULT_MODEL_CONFIG.enabledModelIds;

  return {
    activeEngineForEmate:
      typeof activeEngine === 'string' && modelIds.has(activeEngine)
        ? activeEngine
        : DEFAULT_MODEL_CONFIG.activeEngineForEmate,
    enabledModelIds,
    modelSelectorEnabled: typeof candidate.modelSelectorEnabled === 'boolean'
      ? candidate.modelSelectorEnabled
      : DEFAULT_MODEL_CONFIG.modelSelectorEnabled,
    updatedAt: typeof candidate.updatedAt === 'string' ? candidate.updatedAt : '',
  };
}

export async function getAdminSettings(): Promise<AdminSettingsResult> {
  const db = getAdminSettingsClient();
  if (!db) {
    return {
      flags: DEFAULT_FEATURE_FLAGS,
      modelConfig: DEFAULT_MODEL_CONFIG,
      storageAvailable: false,
      storageError: 'Admin settings require NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    };
  }

  const settingKeys = [
    ...DEFAULT_FEATURE_FLAGS.map((flag) => `feature_flag:${flag.id}`),
    'model_config',
  ];
  const { data, error } = await db
    .from('admin_settings')
    .select('setting_key, value, updated_at')
    .in('setting_key', settingKeys);

  if (error) {
    return {
      flags: DEFAULT_FEATURE_FLAGS,
      modelConfig: DEFAULT_MODEL_CONFIG,
      storageAvailable: false,
      storageError: `Admin settings could not be loaded: ${error.message}`,
    };
  }

  const rows = new Map((data ?? []).map((row) => [row.setting_key as string, row]));
  const flags = DEFAULT_FEATURE_FLAGS.map((flag) => {
    const row = rows.get(`feature_flag:${flag.id}`);
    const storedEnabled = row?.value && typeof row.value === 'object'
      ? (row.value as { enabled?: unknown }).enabled
      : undefined;
    return {
      ...flag,
      enabled: typeof storedEnabled === 'boolean' ? storedEnabled : flag.enabled,
      updatedAt: row?.updated_at || flag.updatedAt,
    };
  });

  const modelRow = rows.get('model_config');
  const selectorFlag = flags.find((flag) => flag.id === 'openrouterModelSelector');
  const modelConfig = normalizeModelConfig(modelRow?.value);
  modelConfig.modelSelectorEnabled = selectorFlag?.enabled ?? true;
  modelConfig.updatedAt = modelRow?.updated_at || modelConfig.updatedAt;

  return { flags, modelConfig, storageAvailable: true, storageError: null };
}

export async function saveFeatureFlag(flagId: FeatureFlagId, enabled: boolean): Promise<AdminFeatureFlag> {
  const db = getAdminSettingsClient();
  if (!db) throw new Error('Admin settings are read-only until Supabase service role storage is configured.');

  const flag = DEFAULT_FEATURE_FLAGS.find((item) => item.id === flagId);
  if (!flag) throw new Error('Unknown feature flag.');
  const updatedAt = new Date().toISOString();
  const { error } = await db.from('admin_settings').upsert(
    { setting_key: `feature_flag:${flagId}`, value: { enabled }, updated_at: updatedAt },
    { onConflict: 'setting_key' }
  );
  if (error) throw new Error(`Unable to save setting: ${error.message}`);
  return { ...flag, enabled, updatedAt };
}

export async function saveModelConfig(patch: Partial<RuntimeModelConfig>): Promise<RuntimeModelConfig> {
  const db = getAdminSettingsClient();
  if (!db) throw new Error('Admin settings are read-only until Supabase service role storage is configured.');

  const current = await getAdminSettings();
  if (!current.storageAvailable) throw new Error(current.storageError || 'Admin settings storage is unavailable.');
  const updatedAt = new Date().toISOString();
  const next = normalizeModelConfig({ ...current.modelConfig, ...patch, updatedAt });
  const { error } = await db.from('admin_settings').upsert(
    {
      setting_key: 'model_config',
      value: {
        activeEngineForEmate: next.activeEngineForEmate,
        enabledModelIds: next.enabledModelIds,
        updatedAt,
      },
      updated_at: updatedAt,
    },
    { onConflict: 'setting_key' }
  );
  if (error) throw new Error(`Unable to save model configuration: ${error.message}`);
  return next;
}
