const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const compiled = process.env.AGENT_SKILLS_TEST_MODULES;
if (!compiled) throw new Error('AGENT_SKILLS_TEST_MODULES must point at the compiled server modules.');
const core = require(path.join(compiled, 'core.js'));
const registry = require(path.join(compiled, 'registry.js'));
const tools = require(path.join(compiled, 'tools.js'));
const keyResolver = require(path.join(compiled, 'openrouter-key.js'));

test('catalog loads six descriptions with accurate availability status', () => {
  const descriptions = registry.listSkillDescriptions();
  assert.equal(descriptions.length, 6);
  assert.deepEqual(descriptions.filter((skill) => skill.status === 'enabled').map((skill) => skill.id).sort(), [
    'coding-assistance', 'data-analysis', 'document-analysis', 'image-understanding', 'writing',
  ]);
  assert.ok(descriptions.every((skill) => skill.license === 'MIT' && skill.description.length > 20));
});

test('each example request resolves and loads only its matching skill instructions', () => {
  const requests = [
    ['Find sources and research online about current battery recycling rules', [], 'web-research', 'Never claim to have browsed'],
    ['Summarize this document', [{ fileName: 'notes.txt', text: '## Topic\nSome source text.' }], 'document-analysis', 'document_outline'],
    ['Rewrite this email in a warmer tone', [], 'writing', 'Preserve the author'],
    ['Analyze this CSV dataset', [], 'data-analysis', 'causal claims'],
    ['Debug this TypeScript compile error', [], 'coding-assistance', 'Never execute code'],
    ['Describe this screenshot', [{ mimeType: 'image/png', data: 'data:image/png;base64,AA==' }], 'image-understanding', 'untrusted content'],
  ];
  for (const [prompt, attachments, id, instruction] of requests) {
    assert.equal(core.matchSkillRequest(prompt, attachments), id);
    const loaded = registry.resolveSkillForRequest(prompt, attachments);
    assert.equal(loaded.id, id);
    assert.match(loaded.instructions, new RegExp(instruction, 'i'));
  }
  assert.equal(registry.resolveSkillForRequest('What time is it?', []), null);
});

test('document outline tool validates, executes read-only analysis, and rejects unsupported tools', async () => {
  const context = { identity: 'test-document-user', chatId: 'chat-a', skillId: 'document-analysis', permissionGranted: true };
  const result = await tools.executeSkillTool('document_outline', {
    fileName: 'unit-notes.txt',
    text: '# Neural Networks\n\nNeural networks learn patterns from examples.\n\n## Training\nBackpropagation adjusts weights.',
  }, context);
  assert.equal(result.success, true);
  assert.equal(result.data.fileName, 'unit-notes.txt');
  assert.equal(result.data.wordCount > 0, true);
  assert.deepEqual(result.data.headings, ['Neural Networks', 'Training']);
  assert.equal((await tools.executeSkillTool('run_script', {}, context)).success, false);
  assert.equal((await tools.executeSkillTool('document_outline', { text: '' }, context)).success, false);
  assert.equal((await tools.executeSkillTool('document_outline', { text: 'x'.repeat(80_001) }, context)).error, 'The attached text is too large for this analysis pass.');
  assert.equal((await tools.executeSkillTool('document_outline', { text: 'A document' }, { ...context, skillId: 'writing' })).success, false);
  assert.equal((await tools.executeSkillTool('document_outline', { text: 'A document' }, { ...context, permissionGranted: false })).success, false);
});

test('tool usage is bounded per user and responses use safe errors', async () => {
  const context = { identity: 'test-rate-limit-user', chatId: 'chat-limit', skillId: 'document-analysis', permissionGranted: true };
  for (let index = 0; index < 12; index++) {
    assert.equal((await tools.executeSkillTool('document_outline', { text: 'Small document.' }, context)).success, true);
  }
  const limited = await tools.executeSkillTool('document_outline', { text: 'Small document.' }, context);
  assert.equal(limited.success, false);
  assert.match(limited.error, /wait a moment/i);
});

test('OpenRouter BYOK key precedence and server-key fallback are preserved', () => {
  assert.equal(keyResolver.resolveOpenRouterKey({
    userApiKey: ' user-key ',
    cookieHeader: 'user_openrouter_key=cookie-key',
    authorizationHeader: 'Bearer header-key',
    serverKey: 'server-key',
  }), 'user-key');
  assert.equal(keyResolver.resolveOpenRouterKey({ cookieHeader: 'other=1; user_openrouter_key=cookie%2Dkey' }), 'cookie-key');
  assert.equal(keyResolver.resolveOpenRouterKey({ authorizationHeader: 'Bearer header-key', xOpenRouterKey: 'x-key' }), 'header-key');
  assert.equal(keyResolver.resolveOpenRouterKey({ xOpenRouterKey: 'x-key' }), 'x-key');
  assert.equal(keyResolver.resolveOpenRouterKey({ serverKey: ' server-key ' }), 'server-key');
});
