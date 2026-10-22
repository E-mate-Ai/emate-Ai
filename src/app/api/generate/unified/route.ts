// ─────────────────────────────────────────────────────────────────────────────
// Unified Multimodal Generation API Route
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server';
import { orchestrateGeneration, classifyTask } from '@/lib/multimodal/orchestrator';
import { resolveModelForTask } from '@/lib/multimodal/registry';
import { getProviderAdapter } from '@/lib/multimodal/adapters';
import { createClient as createSupabaseServer } from '@/lib/supabase/server';
import { getGuestCredits } from '@/lib/credits';

export const dynamic = 'force-dynamic';

function getCookie(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  const match = cookieHeader.split(';').find((c) => c.trim().startsWith(`${name}=`));
  return match ? decodeURIComponent(match.trim().slice(name.length + 1)) : undefined;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      prompt,
      messages,
      model: requestedModelId,
      taskType: explicitTaskType,
      attachments,
      stream = false,
      userApiKey: bodyKey,
    } = body;

    if (!prompt && (!messages || messages.length === 0)) {
      return NextResponse.json(
        { error: 'Prompt or conversation messages are required.' },
        { status: 400 }
      );
    }

    // Authenticate / Extract user
    let authenticatedUserId: string | null = null;
    try {
      const supabase = await createSupabaseServer();
      const { data: { user } } = await supabase.auth.getUser();
      authenticatedUserId = user?.id ?? null;
    } catch {}

    const cookieHeader = req.headers.get('cookie');
    const authHeader = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
    const cookieKey = getCookie(cookieHeader, 'user_openrouter_key');

    const apiKey =
      authHeader ||
      bodyKey ||
      cookieKey ||
      process.env.OPENROUTER_SERVER_FREE_KEY ||
      process.env.OPENROUTER_API_KEY;

    const isGuest = !authHeader && !bodyKey && !cookieKey && !authenticatedUserId;

    // Check credits for guest
    if (isGuest && typeof body.credits === 'number' && body.credits <= 0) {
      return NextResponse.json(
        {
          error: 'No credits left. Please create a free account or connect your API key to continue.',
          code: 'trial_exhausted',
        },
        { status: 402 }
      );
    }

    // Determine task
    const userPrompt = prompt || messages?.[messages.length - 1]?.content || '';
    const { taskType, targetModality, hasVisionInput } = classifyTask(
      typeof userPrompt === 'string' ? userPrompt : '',
      attachments,
      explicitTaskType
    );

    // If streaming requested and task is text/code/structured, execute streaming via adapter
    if (stream && targetModality !== 'image') {
      const resolution = resolveModelForTask(requestedModelId, taskType, hasVisionInput);
      const adapter = getProviderAdapter(resolution.model.provider);

      const streamMessages = messages && messages.length > 0
        ? messages
        : [{ role: 'user' as const, content: userPrompt }];

      const streamRes = await adapter.generateStream({
        model: resolution.model,
        messages: streamMessages,
        apiKey,
      });

      // Forward streaming headers
      return new Response(streamRes.body, {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
          'X-Model-Used': resolution.model.id,
          'X-Task-Type': taskType,
          'X-Fallback-Occurred': String(resolution.fallbackOccurred),
        },
      });
    }

    // Non-streaming multimodal orchestration
    const result = await orchestrateGeneration({
      prompt: typeof userPrompt === 'string' ? userPrompt : JSON.stringify(userPrompt),
      messages,
      requestedModelId,
      explicitTaskType,
      attachments,
      apiKey,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('[Unified Generation API] Error:', err);
    return NextResponse.json(
      { error: err?.message || 'An error occurred during multimodal generation.' },
      { status: 500 }
    );
  }
}
