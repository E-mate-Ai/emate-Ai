import { listSkillDescriptions } from '@/lib/agent-skills/registry';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    return Response.json({ skills: listSkillDescriptions() }, {
      headers: { 'Cache-Control': 'private, max-age=60' },
    });
  } catch {
    return Response.json({ error: 'Skill catalog is temporarily unavailable.' }, { status: 503 });
  }
}
