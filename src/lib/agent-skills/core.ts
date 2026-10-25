export type SkillId =
  | 'web-research'
  | 'document-analysis'
  | 'writing'
  | 'data-analysis'
  | 'coding-assistance'
  | 'image-understanding';

export interface SkillDescription {
  id: SkillId;
  name: string;
  description: string;
  license: string;
  status: 'enabled' | 'planned';
}

export interface SkillAttachment {
  fileName?: string;
  mimeType?: string;
  text?: string;
  data?: string;
}

export type SkillPermissionPreferences = Partial<Record<SkillId, boolean>>;

export function skillPermissionStorageKey(userId?: string | null): string {
  return `emate:agent-skill-permissions:${userId || 'guest'}`;
}

export function isSkillPermitted(
  skill: Pick<SkillDescription, 'id' | 'status'>,
  preferences?: SkillPermissionPreferences
): boolean {
  return skill.status === 'enabled' && preferences?.[skill.id] !== false;
}

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

export function parseSkillFrontmatter(id: SkillId, markdownHeader: string): SkillDescription {
  const match = markdownHeader.match(FRONTMATTER);
  if (!match) throw new Error(`Skill ${id} is missing valid frontmatter.`);
  const fields = new Map<string, string>();
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([a-z][a-z0-9_-]*):\s*(.*?)\s*$/i);
    if (field) fields.set(field[1], field[2].replace(/^['"]|['"]$/g, ''));
  }
  const name = fields.get('name');
  const description = fields.get('description');
  const license = fields.get('license');
  const status = fields.get('status');
  if (!name || !description || !license || (status !== 'enabled' && status !== 'planned')) {
    throw new Error(`Skill ${id} has incomplete metadata.`);
  }
  return { id, name, description, license, status };
}

export function parseSkillMarkdown(id: SkillId, markdown: string): {
  description: SkillDescription;
  instructions: string;
} {
  const description = parseSkillFrontmatter(id, markdown);
  const match = markdown.match(FRONTMATTER);
  if (!match) throw new Error(`Skill ${id} is missing valid frontmatter.`);
  return { description, instructions: markdown.slice(match[0].length).trim() };
}

export function matchSkillRequest(
  userText: string,
  attachments: SkillAttachment[] = []
): SkillId | null {
  const text = userText.toLowerCase();
  const hasImage = attachments.some((item) =>
    item.mimeType?.startsWith('image/') || /^data:image\//i.test(item.data || '')
  );
  const hasDocumentText = attachments.some((item) => Boolean(item.text?.trim()));

  if (hasImage && /image|picture|photo|screenshot|diagram|chart|what is|describe|explain|read|analy[sz]e/i.test(text)) {
    return 'image-understanding';
  }
  if (hasDocumentText && /analy[sz]|summari[sz]|explain|compare|outline|extract|review|key points|what does|based on|from (this|these|the) (file|document|notes)/i.test(text)) {
    return 'document-analysis';
  }
  if (/\b(search the web|web research|research online|latest sources|find sources|browse the web|current news)\b/i.test(text)) {
    return 'web-research';
  }
  if (/\b(csv|spreadsheet|dataset|data analysis|analy[sz]e (these )?(numbers|data)|statistics|calculate the average|trend in this data)\b/i.test(text)) {
    return 'data-analysis';
  }
  if (/\b(write|rewrite|edit|proofread|draft|polish|email|essay|report|tone)\b/i.test(text)) {
    return 'writing';
  }
  if (/\b(code|coding|program|debug|typescript|javascript|python|sql|stack trace|compile error|refactor)\b/i.test(text)) {
    return 'coding-assistance';
  }
  return null;
}
