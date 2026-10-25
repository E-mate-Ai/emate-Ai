import fs from 'node:fs';
import path from 'node:path';
import { matchSkillRequest, parseSkillFrontmatter, parseSkillMarkdown, type SkillAttachment, type SkillDescription, type SkillId } from './core';

const SKILL_IDS: SkillId[] = [
  'web-research',
  'document-analysis',
  'writing',
  'data-analysis',
  'coding-assistance',
  'image-understanding',
];
const SKILLS_DIRECTORY = path.join(process.cwd(), 'skills');
const MAX_SKILL_FILE_BYTES = 24_000;
const MAX_RESOURCE_BYTES = 64_000;
const RESOURCE_EXTENSIONS = new Set(['.md', '.txt', '.json', '.csv']);

function readSkill(id: SkillId) {
  const filePath = path.join(SKILLS_DIRECTORY, id, 'SKILL.md');
  const stat = fs.statSync(filePath);
  if (stat.size > MAX_SKILL_FILE_BYTES) throw new Error(`Skill ${id} exceeds the instruction size limit.`);
  return parseSkillMarkdown(id, fs.readFileSync(filePath, 'utf8'));
}

function readSkillDescription(id: SkillId): SkillDescription {
  const filePath = path.join(SKILLS_DIRECTORY, id, 'SKILL.md');
  const descriptor = fs.openSync(filePath, 'r');
  const prefix = Buffer.alloc(4_096);
  try {
    const bytesRead = fs.readSync(descriptor, prefix, 0, prefix.length, 0);
    return parseSkillFrontmatter(id, prefix.subarray(0, bytesRead).toString('utf8'));
  } finally {
    fs.closeSync(descriptor);
  }
}

/** Loads metadata only. Instruction bodies are not read for catalog requests. */
export function listSkillDescriptions(): SkillDescription[] {
  return SKILL_IDS.map(readSkillDescription);
}

/** Loads only the matched skill's trusted, repository-owned instructions. */
export function loadSkillInstructions(id: SkillId): string {
  if (!SKILL_IDS.includes(id)) throw new Error('Unknown skill.');
  return readSkill(id).instructions;
}

/** Optional text resources are allowlisted and bounded; executable files are never loaded. */
export function loadSkillResource(id: SkillId, resourceName: string): string {
  if (!SKILL_IDS.includes(id) || path.basename(resourceName) !== resourceName || !resourceName) {
    throw new Error('Invalid skill resource.');
  }
  if (!RESOURCE_EXTENSIONS.has(path.extname(resourceName).toLowerCase())) {
    throw new Error('Only text-based skill resources are supported.');
  }
  const skillDirectory = path.resolve(SKILLS_DIRECTORY, id);
  const resourcePath = path.resolve(skillDirectory, 'resources', resourceName);
  if (!resourcePath.startsWith(`${path.resolve(skillDirectory)}${path.sep}`)) {
    throw new Error('Invalid skill resource path.');
  }
  const stat = fs.statSync(resourcePath);
  if (!stat.isFile() || stat.size > MAX_RESOURCE_BYTES) throw new Error('Skill resource is unavailable or too large.');
  return fs.readFileSync(resourcePath, 'utf8');
}

export function resolveSkillForRequest(userText: string, attachments: SkillAttachment[] = []) {
  const id = matchSkillRequest(userText, attachments);
  if (!id) return null;
  const { description, instructions } = readSkill(id);
  return { ...description, instructions };
}
