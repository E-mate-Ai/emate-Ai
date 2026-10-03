import { NextResponse } from 'next/server';
import { ALL_FREE_MODELS, getAdminModelConfig } from '@/lib/modelConfig';

export async function GET() {
  const adminConfig = getAdminModelConfig();
  const allowedSet = new Set(adminConfig.enabledModelIds);

  try {
    const res = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://emate-ai.runs-on.dev',
        'X-Title': 'e-Mate AI',
      },
      next: { revalidate: 1800 },
    });

    let liveFreeModels: Array<{ id: string; name: string; tag?: string }> = [];

    if (res.ok) {
      const data = await res.json();
      liveFreeModels = (data.data || [])
        .filter((model: any) => {
          const pricing = model.pricing || {};
          const isZeroCost = pricing.prompt === '0' && pricing.completion === '0';
          const isFreeSlug = typeof model.id === 'string' && model.id.endsWith(':free');
          return isZeroCost || isFreeSlug;
        })
        .map((m: any) => ({
          id: m.id,
          name: m.name || m.id,
          tag: 'Free',
        }));
    }

    // Merge static known free models with live free models (removing duplicates)
    const modelMap = new Map<string, { id: string; name: string; tag?: string; isFlagship?: boolean }>();

    // 1. Ensure e-Mate is always the primary flagship model
    modelMap.set('emate', {
      id: 'emate',
      name: 'e-Mate',
      tag: 'Flagship • Free',
      isFlagship: true,
    });

    // 2. Add our rich curated list of all free models
    for (const m of ALL_FREE_MODELS) {
      if (m.id !== 'emate' && allowedSet.has(m.id)) {
        modelMap.set(m.id, {
          id: m.id,
          name: m.name,
          tag: m.badge,
        });
      }
    }

    // 3. Add any additional live free models discovered from OpenRouter
    for (const m of liveFreeModels) {
      if (!modelMap.has(m.id) && (allowedSet.size === 0 || allowedSet.has(m.id))) {
        modelMap.set(m.id, m);
      }
    }

    return NextResponse.json({ models: Array.from(modelMap.values()) });
  } catch {
    // Robust fallback to ALL_FREE_MODELS
    const fallbackList = ALL_FREE_MODELS.filter((m) => allowedSet.size === 0 || allowedSet.has(m.id)).map((m) => ({
      id: m.id,
      name: m.name,
      tag: m.badge,
      isFlagship: m.isFlagship,
    }));
    return NextResponse.json({ models: fallbackList });
  }
}
