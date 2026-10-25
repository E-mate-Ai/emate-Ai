/** Typed, validated events shared by the chat route and transcript renderer. */
export type ChatStreamEvent =
  | { type: 'content'; text: string }
  | { type: 'model'; model: string }
  | { type: 'citations'; citations: unknown[] }
  | { type: 'skill'; name: string }
  | { type: 'skill_notice'; message: string }
  | { type: 'skill_tool'; tool: string; success: boolean; message?: string }
  | { type: 'error'; message: string };

/**
 * Models occasionally emit orchestration traces as if they were the answer.
 * These markers are never user-facing content. Reject that candidate before
 * sending any of its tokens so the server can move to its next model.
 */
const INTERNAL_OUTPUT_PREFIXES = [
  /^user\s+safety\s*:/i,
  /^response\s+safety\s*:/i,
  /^\{\s*["']?(?:(?:user|response)[ _-]*safety|safety(?:[ _-]*classification)?|moderation(?:[ _-]*result)?)["']?\s*:/i,
  /^\s*(?:moderation|safety)\s+(?:classification|check|result)\s*:/i,
  /^\s*(?:classifier|moderation)\s+(?:output|result)\s*:/i,
];

export function isInternalModelOutputPrefix(value: string): boolean {
  const normalized = value.replace(/^\s+/, '');
  return INTERNAL_OUTPUT_PREFIXES.some((pattern) => pattern.test(normalized));
}

const SAFETY_METADATA_LINE = /^\s*(?:user\s+safety|response\s+safety|moderation\s+classification|safety\s+classification)\s*:\s*[^\n]*(?:\n|$)/i;

/** Remove leading, line-oriented safety labels while retaining a following answer. */
export function stripLeadingSafetyMetadata(value: string): { text: string; removed: boolean } {
  let remaining = value;
  let removed = false;

  while (remaining) {
    const lineMatch = remaining.match(SAFETY_METADATA_LINE);
    if (lineMatch) {
      remaining = remaining.slice(lineMatch[0].length);
      removed = true;
      continue;
    }

    const jsonLine = remaining.match(/^\s*(\{[^\n]*\})(?:\n|$)/);
    if (jsonLine) {
      try {
        const parsed = JSON.parse(jsonLine[1]) as Record<string, unknown>;
        const keys = Object.keys(parsed).map((key) => key.toLowerCase().replace(/[^a-z]/g, ''));
        const isSafetyMetadata = keys.some((key) =>
          ['usersafety', 'responsesafety', 'safety', 'safetyclassification', 'moderationresult'].includes(key)
        );
        if (isSafetyMetadata) {
          remaining = remaining.slice(jsonLine[0].length);
          removed = true;
          continue;
        }
      } catch {
        // A malformed object is not trusted or rendered as a safety report.
      }
    }
    break;
  }

  return { text: remaining, removed };
}

/** Keep a fragmented JSON classifier object buffered until its first key arrives. */
export function couldBeInternalModelOutputPrefix(value: string): boolean {
  const normalized = value.trimStart().toLowerCase();
  if (normalized === '{' || normalized === '{"' || normalized === "{'" || normalized === '{\n') return true;
  return [
    '{"user', "{'user", '{"response', "{'response", '{"safety', "{'safety",
    '{"moderation', "{'moderation",
  ].some((prefix) => prefix.startsWith(normalized) || normalized.startsWith(prefix));
}

/**
 * Parse only the application's typed SSE contract. Legacy raw JSON strings
 * are deliberately ignored; they cannot be mistaken for assistant content.
 */
export function parseChatStreamEvent(payload: string): ChatStreamEvent | null {
  if (!payload || payload === '[DONE]') return null;

  let value: unknown;
  try {
    value = JSON.parse(payload);
  } catch {
    return null;
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

  const event = value as Record<string, unknown>;
  switch (event.type) {
    case 'content':
      return typeof event.text === 'string' && event.text.trim() && !isInternalModelOutputPrefix(event.text)
        ? { type: 'content', text: event.text }
        : null;
    case 'model':
      return typeof event.model === 'string' && event.model.trim()
        ? { type: 'model', model: event.model }
        : null;
    case 'citations':
      return Array.isArray(event.citations)
        ? { type: 'citations', citations: event.citations }
        : null;
    case 'skill':
      return typeof event.name === 'string'
        ? { type: 'skill', name: event.name }
        : null;
    case 'skill_notice':
      return typeof event.message === 'string'
        ? { type: 'skill_notice', message: event.message }
        : null;
    case 'skill_tool':
      return typeof event.tool === 'string' && typeof event.success === 'boolean'
        ? {
            type: 'skill_tool',
            tool: event.tool,
            success: event.success,
            ...(typeof event.message === 'string' ? { message: event.message } : {}),
          }
        : null;
    case 'error':
      return typeof event.message === 'string' && event.message.trim()
        ? { type: 'error', message: event.message }
        : null;
    default:
      return null;
  }
}
