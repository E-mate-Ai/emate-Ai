import { NextResponse } from 'next/server';
import { getAdminSettings } from '@/lib/adminSettings';

export const dynamic = 'force-dynamic';

export async function GET() {
  const settings = await getAdminSettings();
  const flags = Object.fromEntries(settings.flags.map(({ id, enabled }) => [id, enabled]));

  return NextResponse.json(
    {
      flags,
      modelConfig: {
        activeEngineForEmate: settings.modelConfig.activeEngineForEmate,
        enabledModelIds: settings.modelConfig.enabledModelIds,
        modelSelectorEnabled: settings.modelConfig.modelSelectorEnabled,
      },
    },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } }
  );
}
