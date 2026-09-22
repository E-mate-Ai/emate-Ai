import {
  openRouterCompletionStream,
  FALLBACK_MODELS,
  getModelFallbackId,
  type OpenRouterError,
} from '@/lib/openrouter';
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
      'HTTP-Referer': 'https://emate-ai.vercel.app',
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
     * Automatic fallback: attempt the requested model; on a transient
     * provider/quota fault (429/5xx) transparently retry the same payload against
     * the model's own fallbackId (if any), then the global lightweight
     * fallback models before surfacing an error.
     */
    const modelFallback = getModelFallbackId(selectedModel);
    const attemptOrder = [selectedModel, ...[modelFallback, ...FALLBACK_MODELS].filter(
      (m): m is string => typeof m === 'string'
    )].filter((m, i, arr) => arr.indexOf(m) === i);

    let upstreamRes: Response | null = null;
    let lastError: OpenRouterError | null = null;

    for (const candidate of attemptOrder.slice(0, 2)) {
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

        // Non-retryable errors (401/402) are surfaced immediately with clean user-friendly messaging
        if (!oe.retryable) {
          const isUserKey = Boolean(userKey);
          let friendlyMsg = oe.message || 'OpenRouter request failed.';
          if (oe.status === 402) {
            friendlyMsg = isUserKey
              ? 'Your connected OpenRouter account has insufficient credits ($0 balance). Please top up your credits at https://openrouter.ai/settings/credits to continue.'
              : 'OpenRouter credits exhausted. Please connect your OpenRouter account in Settings to continue.';
          } else if (oe.status === 401) {
            friendlyMsg = 'Invalid OpenRouter API key. Please check your key in Settings.';
          }
          return new Response(
            JSON.stringify({ error: friendlyMsg, code: oe.status === 402 ? 'insufficient_credits' : 'invalid_key' }),
            { status: oe.status || 500, headers: { 'Content-Type': 'application/json' } }
          );
        }
        // Transient: fall through and try the next candidate silently.
        upstreamRes = null;
        lastError = oe;
      }
    }

    if (!upstreamRes) {
      // All candidates exhausted — surface a generic error.
      return new Response(
        JSON.stringify({
          error:
            lastError?.message ||
            'OpenRouter is temporarily unavailable. Please try again in a moment, or switch models.',
        }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
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
