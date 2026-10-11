import type { ChatMessage } from '@/lib/chatHistory';

type Transcript = { id: string; messages: ChatMessage[] };

const REPEATED_PREFERENCE_RULES = [
  {
    id: 'beginner-friendly',
    label: 'beginner-friendly explanations that start with the basics',
    pattern: /\b(beginner|from (the )?basics|start from scratch|like (i am|i'm|im) (a )?(kid|child)|assume i (know|understand) nothing|dont know anything|don't know anything)\b/i,
  },
  {
    id: 'detailed',
    label: 'thorough explanations with useful detail',
    pattern: /\b(deep(ly)?|in detail|detailed|thorough|comprehensive|explain more)\b/i,
  },
  {
    id: 'concise',
    label: 'concise answers',
    pattern: /\b(concise|brief|short answer|keep it short|in a nutshell)\b/i,
  },
  {
    id: 'stepwise',
    label: 'step-by-step explanations',
    pattern: /\b(step[- ]by[- ]step|stepwise|show every step|walk me through)\b/i,
  },
  {
    id: 'examples',
    label: 'examples and analogies to make ideas concrete',
    pattern: /\b(examples?|analogy|analogies|real[- ]world)\b/i,
  },
  {
    id: 'structured',
    label: 'clearly structured answers with headings or bullets',
    pattern: /\b(bullet points|headings|organize(d)?|structured|table format)\b/i,
  },
];

/** Accept only locally derived preference labels; never inject raw guest text as system context. */
export function sanitizeUserPatternContext(value: unknown, maxCharacters = 1200): string {
  if (typeof value !== 'string') return '';
  const allowedLabels = REPEATED_PREFERENCE_RULES.map((rule) => rule.label);
  const accepted = allowedLabels.filter((label) => value.includes(`- ${label}`)).map((label) => `- ${label}`);
  if (accepted.length === 0) return '';
  return `Repeated preferences observed across past chats:\n${accepted.join('\n')}`.slice(0, maxCharacters);
}

/**
 * Build a small cross-chat style memory from preferences repeated in separate
 * conversations. It deliberately ignores one-off requests and sensitive traits.
 */
export function buildRecurringUserPatternContext(
  transcripts: Transcript[],
  activeChatId?: string,
  maxCharacters = 1200
): string {
  const counts = new Map<string, Set<string>>();

  for (const transcript of transcripts) {
    if (!transcript.id || transcript.id === activeChatId) continue;
    const userText = transcript.messages
      .filter((message) => message.role === 'user')
      .map((message) => message.content || '')
      .join('\n');

    for (const rule of REPEATED_PREFERENCE_RULES) {
      if (!rule.pattern.test(userText)) continue;
      const matchedChats = counts.get(rule.id) ?? new Set<string>();
      matchedChats.add(transcript.id);
      counts.set(rule.id, matchedChats);
    }
  }

  const repeated = REPEATED_PREFERENCE_RULES
    .map((rule) => ({ rule, chats: counts.get(rule.id)?.size ?? 0 }))
    .filter(({ chats }) => chats >= 2)
    .sort((a, b) => b.chats - a.chats)
    .slice(0, 6)
    .map(({ rule }) => `- ${rule.label}`);

  if (repeated.length === 0) return '';
  return `Repeated preferences observed across past chats:\n${repeated.join('\n')}`.slice(0, maxCharacters);
}
