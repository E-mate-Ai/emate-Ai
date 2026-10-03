import {
  openRouterCompletionStream,
  FALLBACK_MODELS,
  getModelFallbackId,
  type OpenRouterError,
} from '@/lib/openrouter';
import { getFreeModelCascade, resolveModelId } from '@/lib/modelConfig';
import { createClient as createSupabaseServer } from '@/lib/supabase/server';
import { toolRegistry, evaluateRetrievalConfidence } from '@/lib/tools';
import { buildChatPrompt } from '@/lib/prompts';

// Ultra-fast primary model (TTFT ~200-400ms via Nitro routing)
const PRIMARY_MODEL = 'google/gemini-2.5-flash';

export const dynamic = 'force-dynamic';

/** Parse a specific cookie value from a raw Cookie header string */
function getCookie(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  const match = cookieHeader.split(';').find((c) => c.trim().startsWith(`${name}=`));
  return match ? decodeURIComponent(match.trim().slice(name.length + 1)) : undefined;
}

async function getLiveFreeFallbackModels(apiKey: string, excludedModels: string[]): Promise<string[]> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://emate-ai.runs-on.dev',
        'X-Title': 'e-Mate AI',
      },
      cache: 'no-store',
    });
    if (!response.ok) return [];

    const data = (await response.json()) as {
      data?: Array<{
        id?: string;
        context_length?: number;
        pricing?: { prompt?: string | null; completion?: string | null };
        architecture?: { input_modalities?: string[]; output_modalities?: string[] };
      }>;
    };
    const excluded = new Set(excludedModels);
    const bestFreeModels = (data.data || [])
      .filter((candidate) => {
        const inputModalities = candidate.architecture?.input_modalities;
        const outputModalities = candidate.architecture?.output_modalities;
        return Boolean(
          candidate.id &&
          !excluded.has(candidate.id) &&
          typeof candidate.pricing?.prompt === 'string' &&
          Number(candidate.pricing.prompt) === 0 &&
          typeof candidate.pricing?.completion === 'string' &&
          Number(candidate.pricing.completion) === 0 &&
          (!inputModalities || inputModalities.includes('text')) &&
          (!outputModalities || outputModalities.includes('text'))
        );
      })
      .sort((a, b) => (b.context_length || 0) - (a.context_length || 0))
      .slice(0, 8);

    for (let index = bestFreeModels.length - 1; index > 0; index--) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [bestFreeModels[index], bestFreeModels[randomIndex]] = [
        bestFreeModels[randomIndex],
        bestFreeModels[index],
      ];
    }
    return bestFreeModels.slice(0, 3).flatMap((candidate) => candidate.id ? [candidate.id] : []);
  } catch {
    return [];
  }
}

export async function POST(req: Request) {
  try {
    const {
      messages,
      mode,
      subject,
      unit,
      model,
      notebookContext,
      isGeneralChat,
      attachments,
      credits,
      userApiKey,
    } = await req.json();

    // ── Extract authenticated user context from Supabase session ──────────
    let authenticatedUserId: string | null = null;
    try {
      const supabase = await createSupabaseServer();
      const { data: { user } } = await supabase.auth.getUser();
      authenticatedUserId = user?.id ?? null;
    } catch {
      // Not authenticated — proceed as guest
    }

    const cookieHeader = req.headers.get('cookie');
    const userKey =
      (typeof userApiKey === 'string' && userApiKey.trim() ? userApiKey.trim() : undefined) ||
      getCookie(cookieHeader, 'user_openrouter_key') ||
      // Fallback: client can also pass the key via Authorization: Bearer header
      (() => {
        const auth = req.headers.get('authorization') || req.headers.get('x-openrouter-key');
        if (!auth) return undefined;
        let token = auth.trim();
        if (token.toLowerCase().startsWith('bearer ')) {
          token = token.slice(7).trim();
        }
        return token || undefined;
      })();
    const serverKey = process.env.OPENROUTER_SERVER_FREE_KEY || process.env.OPENROUTER_API_KEY;
    const apiKey = userKey || serverKey;

    // No key at all — tell the user exactly what to do
    if (!apiKey || apiKey === 'your-openrouter-api-key-here') {
      const isLoggedIn = Boolean(authenticatedUserId);
      return new Response(
        JSON.stringify({
          error: isLoggedIn
            ? 'No OpenRouter API key configured. Please connect your OpenRouter account in Settings → API Key to start chatting.'
            : 'OpenRouter API key is missing. Please sign up and connect your OpenRouter account to unlock unlimited access.',
          code: 'no_api_key',
        }),
        { status: 402, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const isGuest = !userKey && !authenticatedUserId;

    // Best-effort guest credit guard. The client is the source of truth for the
    // localStorage trial allowance; this rejects with 402 when a guest (no BYOK
    // key cookie) has spent their trial and the UI was somehow bypassed.
    if (isGuest && typeof credits === 'number' && credits <= 0) {
      return new Response(
        JSON.stringify({
          error:
            'Oops! No credits left. Sign up and connect your OpenRouter key to continue.',
          code: 'trial_exhausted',
        }),
        { status: 402, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Prefer user-chosen model, fall back to ultra-fast primary
    const selectedModel = model || PRIMARY_MODEL;

    // ── Semantic RAG Retrieval & Re-ranking via Tool-Calling Layer ──────────
    const lastUserMessageObj = messages.filter((m: any) => m.role === 'user').pop();
    const lastUserMessage = lastUserMessageObj?.content || '';

    let retrievedChunks: any[] = [];
    let isGroundingWeak = false;

    if (!isGeneralChat && lastUserMessage.trim().length > 3) {
      try {
        const retResult = await toolRegistry.execute('retrieval_tool', {
          query: lastUserMessage,
          k: 4,
          filterSubject: subject,
          filterUserId: authenticatedUserId || undefined,
          similarityThreshold: 0.15,
        });
        if (retResult.success && retResult.data) {
          const guardrailEval = evaluateRetrievalConfidence(retResult.data);
          if (guardrailEval.isConfident) {
            retrievedChunks = retResult.data.chunks;
          } else {
            // Guardrail triggered: discard weakly relevant chunks and instruct ungrounded fallback
            retrievedChunks = [];
            isGroundingWeak = true;
          }
        }
      } catch (err) {
        console.warn('[Chat RAG] Retrieval tool failed, proceeding with notebook context:', err);
      }
    }

    // ── Build Structured Prompt via Unified Harness Prompt Engine ───────────
    const chatPromptPayload = buildChatPrompt({
      subject,
      unit,
      mode: mode === 'sprint' ? 'sprint' : 'deep-dive',
      notebookContext,
      retrievedChunks,
      isGeneralChat,
      isGroundingWeak,
      historyMessages: messages.slice(0, -1).map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
      currentUserMessage: lastUserMessage,
      maxHistoryMessages: 6,
    });

    const systemMessage = chatPromptPayload.messages[0];
    const cappedHistory = chatPromptPayload.messages.slice(1, -1);

    // ── Prompt & Context Caching Layer ──────────────────────────────────────
    const sessionKey = req.headers.get('x-session-id') || authenticatedUserId || subject || 'default-chat-session';
    const { promptCache } = await import('@/lib/prompts');
    const cacheEval = promptCache.evaluate(sessionKey, {
      systemPrompt: systemMessage.content,
      subject,
      unit,
      mode,
      chunks: retrievedChunks,
      notebookContext,
    });

    // Build system message with provider-native cache_control breakpoint
    const cachedSystemMessage = promptCache.buildCachedSystemMessage(systemMessage.content, true);

    const formattedMessages = [
      cachedSystemMessage,
      ...cappedHistory.map((m: any) => ({ role: m.role, content: m.content })),
      // Format last message (with attachments if present)
      (() => {
        if (attachments && attachments.length > 0) {
          const userPromptText = lastUserMessage.trim() || 'Please examine and explain the attached file/image in detail.';
          const contentArray: any[] = [{ type: 'text', text: userPromptText }];
          attachments.forEach((att: any) => {
            const isImage =
              Boolean(att.mimeType?.startsWith('image/')) ||
              /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(att.fileName || '') ||
              (typeof att.data === 'string' && att.data.startsWith('data:image/'));

            if (isImage && att.data) {
              const detectedMime =
                att.mimeType?.startsWith('image/')
                  ? att.mimeType
                  : /\.(jpe?g)$/i.test(att.fileName || '')
                    ? 'image/jpeg'
                    : /\.(webp)$/i.test(att.fileName || '')
                      ? 'image/webp'
                      : /\.(gif)$/i.test(att.fileName || '')
                        ? 'image/gif'
                        : 'image/png';

              const imageUrl = att.data.startsWith('data:')
                ? att.data
                : `data:${detectedMime};base64,${att.data}`;

              contentArray.push({
                type: 'image_url',
                image_url: { url: imageUrl },
              });
            } else if (att.text) {
              const fileName = att.fileName || 'attached file';
              contentArray.push({
                type: 'text',
                text: `[Attached document "${fileName}" content]:\n${att.text}`,
              });
            }
          });
          return { role: 'user', content: contentArray };
        }
        return { role: 'user', content: lastUserMessage };
      })(),
    ];

    const headers = {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://emate-ai.runs-on.dev',
      'X-Title': 'e-Mate AI',
    };

    const baseBody = {
      max_tokens: 500, // Safe default that fits tight credit reservations without 402 rejection
      temperature: 0.7,
      transforms: [], // Skip OpenRouter post-processing for zero added latency
      provider: {
        order: ['Nitro', 'Together', 'Groq'], // Highest TPS providers first
        allow_fallbacks: true,
      },
    };

    /**
     * e-Mate 17-Model Silent Auto-Switch Mesh:
     * Tries the primary model first, then silently cascades through all other
     * 16 free OpenRouter models if any model crashes or rate-limits.
     */
    const attemptOrder = getFreeModelCascade(selectedModel);

    let upstreamRes: Response | null = null;
    let lastError: OpenRouterError | null = null;
    let liveFallbacksLoaded = false;

    for (let candidateIndex = 0; candidateIndex < attemptOrder.length; candidateIndex++) {
      const candidate = attemptOrder[candidateIndex];
      try {
        upstreamRes = await openRouterCompletionStream(apiKey, {
          model: candidate,
          messages: formattedMessages as any,
          stream: true,
          temperature: 0.7,
          max_tokens: 500,
          extraBody: baseBody,
        });
        break;
      } catch (err) {
        const oe = err as OpenRouterError;
        // If 402 occurred because of max_tokens limit ("can only afford X" or "fewer max_tokens"), auto-recover
        if (oe.status === 402 && oe.message && /afford\s+(\d+)/i.test(oe.message)) {
          const affordMatch = oe.message.match(/afford\s+(\d+)/i);
          const affordTokens = affordMatch ? parseInt(affordMatch[1], 10) : 0;
          if (affordTokens > 60) {
            try {
              const retryTokens = Math.min(affordTokens - 15, 400);
              upstreamRes = await openRouterCompletionStream(apiKey, {
                model: candidate,
                messages: formattedMessages as any,
                stream: true,
                temperature: 0.7,
                max_tokens: retryTokens,
                extraBody: { ...baseBody, max_tokens: retryTokens },
              });
              break;
            } catch (retryErr) {
              // fall through to standard error handling
            }
          }
        }

        // If API key is completely invalid (401), exit cleanly
        if (oe.status === 401) {
          return new Response(
            JSON.stringify({ error: 'Invalid OpenRouter API key. Please check your key in Settings.', code: 'invalid_key' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
          );
        }

        // Silent auto-failover: if candidate fails for ANY reason (status, timeout, quota, 402, 429, 5xx),
        // seamlessly switch to the next free model in the 17-model cascade without alerting user!
        console.warn(`[e-Mate Auto-Mesh] Candidate ${candidate} (${candidateIndex + 1}/${attemptOrder.length}) failed (status ${oe.status}): ${oe.message}. Silently cascading to next model...`);
        upstreamRes = null;
        lastError = oe;
        if (candidateIndex === attemptOrder.length - 1 && !liveFallbacksLoaded) {
          liveFallbacksLoaded = true;
          attemptOrder.push(...await getLiveFreeFallbackModels(apiKey, attemptOrder));
        }
      }
    }

    if (!upstreamRes) {
      // All candidates exhausted — surface a helpful error suggesting free models.
      const errorMsg =
        lastError?.status === 402
          ? 'The selected model requires credits. Please switch to a free model (e.g. Gemini 2.0 Flash Free) to continue without credits.'
          : lastError?.message ||
            'OpenRouter is temporarily unavailable. Please try again in a moment, or switch to a free model.';
      return new Response(
        JSON.stringify({
          error: errorMsg,
          code: lastError?.status === 402 ? 'switch_to_free_model' : 'model_unavailable',
        }),
        { status: lastError?.status || 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ── Build structured citation metadata via Citation Formatter Tool ─────
    const citationResult = await toolRegistry.execute('citation_formatter_tool', {
      chunks: retrievedChunks,
    });
    const citations = citationResult.success && citationResult.data ? citationResult.data : [];

    // ── SSE pipe: forward upstream stream straight to the client ─────────────
    // Transforms OpenRouter's raw NDJSON SSE lines into `data: "<delta>"\n\n`
    // so the client receives plain text deltas with no heavy parsing.
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
    const writer = writable.getWriter();

    (async () => {
      const reader = upstreamRes!.body!.getReader();
      let buffer = '';
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === 'data: [DONE]') continue;
            if (!trimmed.startsWith('data: ')) continue;

            try {
              const json = JSON.parse(trimmed.slice(6));
              const delta = json?.choices?.[0]?.delta?.content;
              if (typeof delta === 'string' && delta.length > 0) {
                await writer.write(encoder.encode(`data: ${JSON.stringify(delta)}\n\n`));
              }
            } catch {
              // Malformed chunk — skip silently
            }
          }
        }

        // Flush any remaining buffer content
        if (buffer.trim() && buffer.trim() !== 'data: [DONE]') {
          try {
            const json = JSON.parse(buffer.trim().slice(6));
            const delta = json?.choices?.[0]?.delta?.content;
            if (typeof delta === 'string' && delta.length > 0) {
              await writer.write(encoder.encode(`data: ${JSON.stringify(delta)}\n\n`));
            }
          } catch {
            /* ignore */
          }
        }

        // Send structured citation event if citations exist
        if (citations.length > 0) {
          await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'citations', citations })}\n\n`));
        }

        await writer.write(encoder.encode('data: [DONE]\n\n'));
      } catch (err) {
        await writer.write(encoder.encode(`data: ${JSON.stringify({ error: String(err) })}\n\n`));
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable Nginx/Vercel proxy buffering
        'X-Content-Type-Options': 'nosniff', // Prevent browser content-sniffing delays
        'X-Citations': encodeURIComponent(JSON.stringify(citations)),
        'X-Retrieved-Chunks': encodeURIComponent(JSON.stringify(citations)),
        'X-Prompt-Cache-Hit': String(cacheEval.isHit),
        'X-Prompt-Cache-Saved': String(cacheEval.tokensSaved),
        'X-Prompt-Cache-Fingerprint': cacheEval.shortKey,
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
