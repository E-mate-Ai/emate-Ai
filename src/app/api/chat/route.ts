import {
  openRouterCompletionStream,
  FALLBACK_MODELS,
  getModelFallbackId,
  type OpenRouterError,
} from '@/lib/openrouter';

// Ultra-fast primary model (TTFT ~200-400ms via Nitro routing)
const PRIMARY_MODEL = 'google/gemini-2.0-flash';

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
    } = await req.json();

    const cookieHeader = req.headers.get('cookie');
    const userKey = getCookie(cookieHeader, 'user_openrouter_key');
    const apiKey =
      userKey || process.env.OPENROUTER_SERVER_FREE_KEY || process.env.OPENROUTER_API_KEY;

    if (!apiKey || apiKey === 'your-openrouter-api-key-here') {
      return new Response(
        JSON.stringify({
          error:
            'OpenRouter API key is missing. Please connect your OpenRouter account to unlock unlimited access.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const isGuest = !userKey;

    // Best-effort guest credit guard. The client is the source of truth for the
    // localStorage trial allowance; this rejects with 402 when a guest (no BYOK
    // key cookie) has spent their trial and the UI was somehow bypassed.
    if (isGuest && typeof credits === 'number' && credits <= 0) {
      return new Response(
        JSON.stringify({
          error:
            'Oops ! no credits left sign up and connect your key',
          code: 'trial_exhausted',
        }),
        { status: 402, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Prefer user-chosen model, fall back to ultra-fast primary
    const selectedModel = model || PRIMARY_MODEL;

    // ── System prompt ────────────────────────────────────────────────────────
    let systemPrompt = '';
    if (isGeneralChat || (!subject && !unit && !notebookContext)) {
      // No active study context → general-purpose assistant
      systemPrompt =
        `You are e-Mate AI, a smart study copilot and versatile AI assistant.\n` +
        `Guidelines:\n` +
        `- Answer the user's questions clearly, accurately, and conversationally.\n` +
        `- Use standard Markdown for formatting.\n` +
        `- You can help with any subject, topic, or general question.\n` +
        `- When generating flashcards, hidden answers, or Q&A pairs, wrap answers in HTML details tags:\n` +
        `  <details>\n` +
        `  <summary>Click to reveal answer</summary>\n` +
        `  **Answer:** your answer here\n` +
        `  </details>`;
    } else {
      // Smart Payload & Context Trimming:
      // Bypass heavy notebook context if the user's input is very short (e.g., "hi", "hello")
      const lastMessageContent = messages.length > 0 ? messages[messages.length - 1].content : '';
      const isShortGreeting = lastMessageContent.trim().split(/\s+/).length < 5;

      const notebookSection =
        notebookContext && !isShortGreeting
          ? `\n\n## Student's Personal Notebook for ${subject} (USE THIS to personalise answers):\n${notebookContext}\n\nAlways reference relevant notebook entries when answering to make answers feel personalised.`
          : '';

      const modeInstruction =
        mode === 'sprint'
          ? '\n\nMode: SPRINT — Give concise, bullet-pointed answers optimised for last-minute revision. Prioritise key formulas, definitions and exam tips.'
          : '\n\nMode: DEEP DIVE — Give thorough, step-by-step explanations with examples. Cover edge cases and exam pitfalls.';

      const contextSection =
        subject && unit
          ? `\n\nCurrent study context: Subject = ${subject}, Unit = ${unit}. Tailor all answers to this scope.`
          : '';

      systemPrompt =
        `You are e-Mate AI, an expert AI academic tutor helping students ace their university exams.\n` +
        `Guidelines:\n` +
        `- Answer naturally, conversationally, and directly to what the user asks.\n` +
        `- Use Markdown formatting (headers, bullet points, code blocks) for clarity.\n` +
        `- If the student's notebook contains relevant notes, reference them and build upon them.\n` +
        `- Always highlight exam-important points with a ⭐ or 📌 marker.\n` +
        `- When generating flashcards, hidden answers, or Q&A pairs, always wrap the answer in HTML details tags:\n` +
        `  <details>\n` +
        `  <summary>Click to reveal answer</summary>\n` +
        `  **Answer:** your answer here\n` +
        `  </details>` +
        contextSection +
        modeInstruction +
        notebookSection;
    }

    // Conversation History Capping: Keep only the last 6 messages
    const cappedMessages = messages.slice(-6);

    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...cappedMessages.map((m: any, index: number) => {
        // If this is the last message and we have attachments, format as multimodal array
        if (index === cappedMessages.length - 1 && attachments && attachments.length > 0) {
          const contentArray: any[] = [{ type: 'text', text: m.content }];
          attachments.forEach((att: any) => {
            if (att.mimeType?.startsWith('image/') && att.data) {
              contentArray.push({
                type: 'image_url',
                image_url: { url: `data:${att.mimeType};base64,${att.data}` },
              });
            } else if (att.text) {
              // Text-based document (txt, md, json, csv, …) — include the
              // file's content as a text block so the model can reference it.
              const fileName = att.fileName || 'attached file';
              contentArray.push({
                type: 'text',
                text: `[Attached document "${fileName}" content]:\n${att.text}`,
              });
            }
          });
          return { role: m.role, content: contentArray };
        }

        return {
          role: m.role,
          content: m.content,
        };
      }),
    ];

    const headers = {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://emate-ai.vercel.app',
      'X-Title': 'e-Mate AI',
    };

    const baseBody = {
      max_tokens: 1200, // Cap to minimise latency & cost
      temperature: 0.7,
      transforms: [], // Skip OpenRouter post-processing for zero added latency
      provider: {
        order: ['Nitro', 'Together', 'Groq'], // Highest TPS providers first
        allow_fallbacks: true,
      },
    };

    /**
     * Task 4 — Automatic fallback: attempt the requested model; on a transient
     * provider/quota fault (429/5xx) transparently retry the same payload against
     * the model's own fallbackId (if any), then the global lightweight
     * fallback models (gpt-4o-mini → gemini-2.0-flash) before surfacing an error.
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
          max_tokens: 1200,
          extraBody: baseBody,
        });
        break;
      } catch (err) {
        const oe = err as OpenRouterError;
        // Non-retryable errors (401/402) are surfaced immediately.
        if (!oe.retryable) {
          return new Response(
            JSON.stringify({ error: oe.message || 'OpenRouter request failed.' }),
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
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
