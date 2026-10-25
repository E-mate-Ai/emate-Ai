import {
  openRouterCompletionStream,
  FALLBACK_MODELS,
  getModelFallbackId,
  type OpenRouterError,
} from '@/lib/openrouter';
import { ALL_FREE_MODELS, getFreeModelCascade } from '@/lib/modelConfig';
import { getAdminSettings } from '@/lib/adminSettings';
import { createClient as createSupabaseServer } from '@/lib/supabase/server';
import { toolRegistry, evaluateRetrievalConfidence } from '@/lib/tools';
import { buildChatPrompt } from '@/lib/prompts';
import { buildRecurringUserPatternContext, sanitizeUserPatternContext } from '@/lib/chatMemory';
import { classifyTask } from '@/lib/multimodal/orchestrator';
import { getModelMetadata, resolveModelForTask } from '@/lib/multimodal/registry';
import { resolveSkillForRequest } from '@/lib/agent-skills/registry';
import { executeSkillTool } from '@/lib/agent-skills/tools';
import { resolveOpenRouterKey } from '@/lib/agent-skills/openrouter-key';
import { isSkillPermitted, type SkillPermissionPreferences } from '@/lib/agent-skills/core';
import {
  couldBeInternalModelOutputPrefix,
  isInternalModelOutputPrefix,
  stripLeadingSafetyMetadata,
} from '@/lib/chat/streamProtocol';

const MAX_CHAT_RESPONSE_TOKENS = 2000;

// Fastest free model — always works for guests using the server key with zero credits needed
const PRIMARY_MODEL = 'openrouter/free';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Parse a specific cookie value from a raw Cookie header string */
async function getLiveFreeFallbackModels(apiKey: string, excludedModels: string[]): Promise<string[]> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://emate.live',
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
          candidate.id !== 'openrouter/auto' &&
          Number(candidate.pricing?.prompt ?? 1) === 0 &&
          Number(candidate.pricing?.completion ?? 1) === 0 &&
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

function extractStreamText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) {
    if (content && typeof content === 'object' && 'text' in content) {
      const text = (content as { text?: unknown }).text;
      return typeof text === 'string' ? text : '';
    }
    return '';
  }

  return content
    .map((part) => {
      if (typeof part === 'string') return part;
      if (part && typeof part === 'object' && 'text' in part) {
        const text = (part as { text?: unknown }).text;
        return typeof text === 'string' ? text : '';
      }
      return '';
    })
    .join('');
}

export async function POST(req: Request) {
  try {
    const runtimeSettings = await getAdminSettings();
    const maintenanceMode = runtimeSettings.flags.find((flag) => flag.id === 'maintenanceMode')?.enabled;
    if (maintenanceMode) {
      return new Response(
        JSON.stringify({ error: 'e-Mate is temporarily unavailable while maintenance is in progress.', code: 'maintenance_mode' }),
        { status: 503, headers: { 'Content-Type': 'application/json', 'Retry-After': '300' } }
      );
    }

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
      userPatterns,
      chatId,
      skillPermissions,
    } = await req.json();

    // ── Extract authenticated user context from Supabase session ──────────
    let authenticatedUserId: string | null = null;
    let authenticatedSupabase: any = null;
    try {
      authenticatedSupabase = await createSupabaseServer();
      const { data: { user } } = await authenticatedSupabase.auth.getUser();
      authenticatedUserId = user?.id ?? null;
    } catch {
      // Not authenticated — proceed as guest
    }

    // Signed-in users get a preference memory built from their own RLS-scoped
    // transcripts. Guests use only the locally derived profile sent by client.
    let userPatternContext = sanitizeUserPatternContext(userPatterns);
    if (authenticatedSupabase && authenticatedUserId) {
      try {
        const { data: priorTranscripts, error } = await authenticatedSupabase
          .from('chat_transcripts')
          .select('id, messages')
          .eq('user_id', authenticatedUserId)
          .order('updated_at', { ascending: false })
          .limit(30);
        if (!error && priorTranscripts) {
          userPatternContext = buildRecurringUserPatternContext(
            priorTranscripts.map((row: any) => ({
              id: row.id,
              messages: Array.isArray(row.messages) ? row.messages : [],
            })),
            typeof chatId === 'string' ? chatId : undefined
          );
        }
      } catch (error) {
        console.warn('[Chat memory] Could not load cross-chat preferences:', error);
      }
    }

    const serverKey = process.env.OPENROUTER_SERVER_FREE_KEY || process.env.OPENROUTER_API_KEY;
    const userKey = resolveOpenRouterKey({
      userApiKey,
      cookieHeader: req.headers.get('cookie'),
      authorizationHeader: req.headers.get('authorization'),
      xOpenRouterKey: req.headers.get('x-openrouter-key'),
    });
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

    // For guests or users using the server free key (without their own BYOK key):
    // Always route through e-Mate's free resilient mesh (starting with openrouter/free)
    // so they never fail due to paid model requirements, invalid model IDs, or burned cascade slots.
    const isUsingServerKey = !userKey;
    const activeEngine = runtimeSettings.modelConfig.activeEngineForEmate || PRIMARY_MODEL;

    // Auto (Task-Aware) model selection: classify prompt and pick the best capable model
    let selectedModel: string;
    if (!isGuest && !isUsingServerKey && model === 'auto') {
      const lastUserText = (() => {
        const lastMsg = (messages as Array<{ role: string; content: unknown }>)
          .filter((m) => m.role === 'user')
          .pop();
        if (!lastMsg) return '';
        if (typeof lastMsg.content === 'string') return lastMsg.content;
        if (Array.isArray(lastMsg.content)) {
          return (lastMsg.content as Array<{ type?: string; text?: string }>)
            .filter((p) => p.type === 'text')
            .map((p) => p.text || '')
            .join(' ');
        }
        return '';
      })();
      const hasVisionAttachment = Array.isArray(attachments) &&
        (attachments as Array<{ mimeType?: string; fileName?: string }>).some(
          (att) => att.mimeType?.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(att.fileName || '')
        );
      const { taskType } = classifyTask(lastUserText, attachments, undefined);
      const resolution = resolveModelForTask(undefined, taskType, hasVisionAttachment);
      selectedModel = resolution.model.id;
    } else if (isGuest || isUsingServerKey || !model || model === 'emate') {
      selectedModel = activeEngine;
    } else {
      selectedModel = model;
    }

    // Capability compatibility: keep the selected model when it can process the
    // supplied image; if metadata explicitly says it cannot, use the configured
    // vision-capable OpenRouter route for this request.
    const requestAttachments = Array.isArray(attachments) ? attachments : [];
    const containsImage = requestAttachments.some((attachment: any) =>
      attachment?.mimeType?.startsWith('image/') ||
      /^data:image\//i.test(typeof attachment?.data === 'string' ? attachment.data : '')
    );
    const selectedMetadata = getModelMetadata(selectedModel);
    if (containsImage && selectedMetadata && !selectedMetadata.capabilities.supportsVisionInput) {
      selectedModel = resolveModelForTask(undefined, 'general_chat', true).model.id;
    }

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
      userPatternContext,
      historyMessages: messages.slice(0, -1).map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
      currentUserMessage: lastUserMessage,
    });

    const requestText = typeof lastUserMessage === 'string' ? lastUserMessage : '';
    const matchedSkill = resolveSkillForRequest(requestText, requestAttachments);
    const permissionPreferences = skillPermissions && typeof skillPermissions === 'object'
      ? skillPermissions as SkillPermissionPreferences
      : undefined;
    let skillToolStatus: { toolName: string; success: boolean; error?: string } | null = null;
    let skillContext = '';
    let activeSkillName: string | null = null;
    let skillNotice: string | null = null;
    if (matchedSkill) {
      const modelMetadata = getModelMetadata(selectedModel);
      const suppliedDocumentText = requestAttachments
        .filter((attachment: any) => typeof attachment?.text === 'string')
        .map((attachment: any) => attachment.text)
        .join('\n\n');
      const estimatedContextTokens = Math.ceil((
        chatPromptPayload.messages.map((message: any) => typeof message.content === 'string' ? message.content : '').join('\n') +
        suppliedDocumentText + matchedSkill.instructions
      ).length / 4);
      const contextFits = !modelMetadata?.contextLength ||
        estimatedContextTokens + MAX_CHAT_RESPONSE_TOKENS + 512 < modelMetadata.contextLength;
      const modelCanUseSkill =
        isSkillPermitted(matchedSkill, permissionPreferences) &&
        contextFits &&
        (matchedSkill.id !== 'image-understanding' || modelMetadata?.capabilities.supportsVisionInput === true) &&
        (!modelMetadata || modelMetadata.capabilities.supportsText);
      if (modelCanUseSkill) {
        activeSkillName = matchedSkill.name;
        skillContext = `\n\n<active_skill name="${matchedSkill.name}" license="${matchedSkill.license}">\n${matchedSkill.instructions}\n</active_skill>`;
        if (matchedSkill.id === 'document-analysis') {
          const document = requestAttachments
            .filter((attachment: any) => typeof attachment?.text === 'string')
            .map((attachment: any) => ({ fileName: attachment.fileName, text: attachment.text }))
            .slice(0, 5);
          if (document.length > 0) {
            const result = await executeSkillTool(
              'document_outline',
              {
                fileName: document.map((item: any) => item.fileName || 'Attached document').join(', '),
                text: document.map((item: any) => item.text).join('\n\n'),
              },
              {
                identity: authenticatedUserId || `guest:${String(chatId || req.headers.get('x-session-id') || 'request').slice(0, 160)}`,
                chatId: String(chatId || req.headers.get('x-session-id') || 'request').slice(0, 160),
                skillId: 'document-analysis',
                permissionGranted: isSkillPermitted(matchedSkill, permissionPreferences) && contextFits && requestText.length > 0,
              }
            );
            skillToolStatus = { toolName: result.toolName, success: result.success, error: result.error };
            if (result.success) {
              const safeJson = JSON.stringify(result.data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
              skillContext += `\n\n<validated_tool_output name="document_outline">\n${safeJson}\n</validated_tool_output>`;
            }
          }
        }
      } else if (matchedSkill.status === 'planned') {
        skillNotice = matchedSkill.id === 'web-research'
          ? 'Web research is not connected yet. Do not claim to browse or invent current sources.'
          : 'This capability is not available yet.';
        skillContext = `\n\n<skill_availability>\n${skillNotice}\n</skill_availability>`;
      } else if (!isSkillPermitted(matchedSkill, permissionPreferences)) {
        skillNotice = `${matchedSkill.name} is turned off in your skill settings.`;
      } else if (!contextFits) {
        skillNotice = 'This document is too large for the selected model context. Try a smaller excerpt or a model with a larger context window.';
      } else if (matchedSkill.id === 'image-understanding') {
        skillNotice = 'The selected model does not have verified image-input support for this request.';
      }
    }

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
    const systemContent = `${systemMessage.content}${skillContext}`;
    const cachedSystemMessage = promptCache.buildCachedSystemMessage(systemContent, true);

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
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://emate.live',
      'X-Title': 'e-Mate AI',
    };

    const baseBody = {
      max_tokens: MAX_CHAT_RESPONSE_TOKENS,
      temperature: 0.7,
      transforms: [], // Skip OpenRouter post-processing for zero added latency
      // Do not include model reasoning in user-facing completion output.
      reasoning: { exclude: true },
      // Note: provider.order with Nitro/Together/Groq is intentionally omitted
      // because those paid-tier providers reject free-model requests, causing
      // unnecessary 402 errors before the cascade finds a working endpoint.
    };

    /**
     * e-Mate 17-Model Silent Auto-Switch Mesh:
     * Tries the primary model first, then silently cascades through all other
     * 16 free OpenRouter models if any model crashes or rate-limits.
     */
    const attemptOrder = getFreeModelCascade(selectedModel);

    let upstreamRes: Response | null = null;
    let selectedCandidateIndex = -1;
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
          max_tokens: MAX_CHAT_RESPONSE_TOKENS,
          extraBody: baseBody,
        });
        selectedCandidateIndex = candidateIndex;
        break;
      } catch (err) {
        const oe = err as OpenRouterError;
        // If 402 occurred because of max_tokens limit ("can only afford X" or "fewer max_tokens"), auto-recover
        if (oe.status === 402 && oe.message && /afford\s+(\d+)/i.test(oe.message)) {
          const affordMatch = oe.message.match(/afford\s+(\d+)/i);
          const affordTokens = affordMatch ? parseInt(affordMatch[1], 10) : 0;
          if (affordTokens > 60) {
            try {
              const retryTokens = Math.min(affordTokens - 15, MAX_CHAT_RESPONSE_TOKENS);
              upstreamRes = await openRouterCompletionStream(apiKey, {
                model: candidate,
                messages: formattedMessages as any,
                stream: true,
                temperature: 0.7,
                max_tokens: retryTokens,
                extraBody: { ...baseBody, max_tokens: retryTokens },
              });
              selectedCandidateIndex = candidateIndex;
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
    // Transforms OpenRouter's raw NDJSON SSE lines into validated typed events.
    const encoder = new TextEncoder();
    const privateReasoningPrefixes = [
      "here's a thinking process",
      'here is a thinking process',
      "here's my thinking process",
      'here is my thinking process',
      'let me think through this step by step',
      'analysis:',
      'user safety:',
      'response safety:',
      'moderation classification:',
      'safety classification:',
    ];

    const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
    const writer = writable.getWriter();

    (async () => {
      if (activeSkillName) {
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'skill', name: activeSkillName })}\n\n`));
      }
      if (skillNotice) {
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'skill_notice', message: skillNotice })}\n\n`));
      }
      if (skillToolStatus) {
        await writer.write(encoder.encode(`data: ${JSON.stringify({
          type: 'skill_tool',
          tool: skillToolStatus.toolName,
          success: skillToolStatus.success,
          message: skillToolStatus.success ? 'Document outline ready' : skillToolStatus.error,
        })}\n\n`));
      }
      let candidateIndex = selectedCandidateIndex;
      let candidateResponse: Response | null = upstreamRes;
      let hasReadableAnswer = false;

      const openNextCandidate = async (): Promise<Response | null> => {
        while (true) {
          candidateIndex += 1;
          if (candidateIndex >= attemptOrder.length) {
            if (liveFallbacksLoaded) return null;
            liveFallbacksLoaded = true;
            const liveModels = await getLiveFreeFallbackModels(apiKey, attemptOrder);
            attemptOrder.push(...liveModels);
            if (candidateIndex >= attemptOrder.length) return null;
          }

          const candidate = attemptOrder[candidateIndex];
          try {
            console.warn(`[e-Mate Auto-Mesh] ${attemptOrder[candidateIndex - 1]} returned no readable answer; trying ${candidate}.`);
            return await openRouterCompletionStream(apiKey, {
              model: candidate,
              messages: formattedMessages as any,
              stream: true,
              temperature: 0.7,
              max_tokens: MAX_CHAT_RESPONSE_TOKENS,
              extraBody: baseBody,
            });
          } catch (err) {
            const error = err as OpenRouterError;
            console.warn(`[e-Mate Auto-Mesh] Fallback candidate ${candidate} failed (status ${error.status}): ${error.message}.`);
            if (error.status === 401) return null;
          }
        }
      };

      const consumeCandidate = async (response: Response, modelId: string) => {
        const reader = response.body?.getReader();
        if (!reader) throw new Error('Model returned no response stream.');

        const candidateDecoder = new TextDecoder();
        let buffer = '';
        let preamble = '';
        let preambleResolved = false;
        let suppressPrivateReasoning = false;
        let modelReported = false;

        const emitText = async (text: string) => {
          if (!text) return;
          if (!modelReported) {
            modelReported = true;
            await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'model', model: modelId })}\n\n`));
          }
          if (text.trim()) hasReadableAnswer = true;
          await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'content', text })}\n\n`));
        };

        const processLine = async (line: string) => {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]' || !trimmed.startsWith('data:')) return;

          let json: any;
          try {
            json = JSON.parse(trimmed.replace(/^data:\s*/, ''));
          } catch {
            return;
          }

          if (json?.error) {
            throw new Error(json.error.message || json.error || 'Model stream failed.');
          }

          const delta = extractStreamText(json?.choices?.[0]?.delta?.content);
          if (!delta || suppressPrivateReasoning) return;

          if (!preambleResolved) {
            preamble += delta;
            const normalizedPreamble = preamble.trimStart().toLowerCase().replace(/\s+/g, ' ').trimEnd();
            if (isInternalModelOutputPrefix(normalizedPreamble)) {
              const filtered = stripLeadingSafetyMetadata(preamble);
              if (filtered.removed) {
                preamble = filtered.text;
                if (preamble.trim()) {
                  preambleResolved = true;
                  await emitText(preamble);
                  preamble = '';
                }
              } else {
                // Unknown classifier/debug payload shape: discard this model
                // candidate and let the existing model cascade continue.
                suppressPrivateReasoning = true;
                preamble = '';
              }
              return;
            }
            const isKnownLeak = privateReasoningPrefixes.some((prefix) => normalizedPreamble.startsWith(prefix));
            const couldStillBeLeak =
              privateReasoningPrefixes.some((prefix) => prefix.startsWith(normalizedPreamble)) ||
              couldBeInternalModelOutputPrefix(normalizedPreamble);

            if (isKnownLeak) {
              suppressPrivateReasoning = true;
              preamble = '';
              return;
            }

            if (!couldStillBeLeak || preamble.length >= 48 || preamble.includes('\n')) {
              preambleResolved = true;
              await emitText(preamble);
              preamble = '';
            }
            return;
          }

          await emitText(delta);
        };

        while (true) {
          let idleTimer: ReturnType<typeof setTimeout> | undefined;
          let result: ReadableStreamReadResult<Uint8Array>;
          try {
            result = await Promise.race([
              reader.read(),
              new Promise<never>((_, reject) => {
                idleTimer = setTimeout(
                  () => reject(new Error('Model stream timed out before completing.')),
                  hasReadableAnswer ? 20_000 : 45_000
                );
              }),
            ]);
          } catch (error) {
            void reader.cancel().catch(() => undefined);
            throw error;
          } finally {
            if (idleTimer) clearTimeout(idleTimer);
          }

          const { done, value } = result;
          if (done) break;

          buffer += candidateDecoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) await processLine(line);
        }

        buffer += candidateDecoder.decode();
        if (buffer.trim()) await processLine(buffer);
        if (!suppressPrivateReasoning && preamble.trim()) await emitText(preamble);

        return { suppressed: suppressPrivateReasoning };
      };

      try {
        while (candidateResponse && !hasReadableAnswer) {
          try {
            const result = await consumeCandidate(candidateResponse, attemptOrder[candidateIndex]);
            if (result.suppressed) {
              console.warn('[e-Mate Auto-Mesh] Discarded a model response containing internal analysis or safety metadata.');
            }
          } catch (err) {
            if (hasReadableAnswer) {
              await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'The model response was interrupted. Please try again.' })}\n\n`));
              break;
            }
          }

          if (!hasReadableAnswer) candidateResponse = await openNextCandidate();
        }

        if (!hasReadableAnswer) {
          await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'No available model returned an answer. Please try again or choose another model.' })}\n\n`));
        } else if (citations.length > 0) {
          await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'citations', citations })}\n\n`));
        }

        await writer.write(encoder.encode('data: [DONE]\n\n'));
      } catch (err) {
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'The chat request failed. Please try again.' })}\n\n`));
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
