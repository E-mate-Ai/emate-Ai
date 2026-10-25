const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const compiled = process.env.CHAT_STREAM_TEST_MODULES;
if (!compiled) throw new Error('CHAT_STREAM_TEST_MODULES must point at the compiled modules.');
const protocol = require(path.join(compiled, 'chat', 'streamProtocol.js'));
const prompts = require(path.join(compiled, 'prompts', 'index.js'));

test('safe request content is accepted as an assistant answer', () => {
  const event = protocol.parseChatStreamEvent(JSON.stringify({ type: 'content', text: 'NLP is a branch of artificial intelligence.' }));
  assert.deepEqual(event, { type: 'content', text: 'NLP is a branch of artificial intelligence.' });
});

test('blocked requests have a concise refusal policy in the runtime prompt', () => {
  assert.match(prompts.BASE_IDENTITY_PROMPT, /Refuse requests that promote self-harm.*concise, user-facing explanation/i);
  assert.match(prompts.BASE_IDENTITY_PROMPT, /Never include internal safety checks, moderation labels, classifier output/i);
});

test('server errors remain errors, never assistant text', () => {
  const event = protocol.parseChatStreamEvent(JSON.stringify({ type: 'error', message: 'No available model returned an answer. Please try again.' }));
  assert.deepEqual(event, { type: 'error', message: 'No available model returned an answer. Please try again.' });
  assert.notEqual(event?.type, 'content');
});

test('malformed classifier payloads and safety labels are rejected', () => {
  assert.equal(protocol.parseChatStreamEvent('{"user_safety":"safe","response_safety":"safe"}'), null);
  assert.equal(protocol.parseChatStreamEvent(JSON.stringify({ type: 'content', text: 'User Safety: safe\nResponse Safety: safe' })), null);
  assert.equal(protocol.parseChatStreamEvent(JSON.stringify({ type: 'content', text: '{"safety_classification":"safe"}' })), null);
  assert.equal(protocol.isInternalModelOutputPrefix('Response Safety: safe'), true);
  assert.equal(protocol.isInternalModelOutputPrefix('A safe explanation of response safety is...'), false);
});

test('leading safety metadata is removed while the real answer after it is retained', () => {
  assert.deepEqual(
    protocol.stripLeadingSafetyMetadata('User Safety: safe\nResponse Safety: safe\nNLP is part of AI.'),
    { text: 'NLP is part of AI.', removed: true }
  );
  assert.deepEqual(
    protocol.stripLeadingSafetyMetadata('{"user_safety":"safe","response_safety":"safe"}\nHere is the answer.'),
    { text: 'Here is the answer.', removed: true }
  );
  assert.deepEqual(protocol.stripLeadingSafetyMetadata('A regular answer.'), { text: 'A regular answer.', removed: false });
});

test('fragmented classifier JSON stays buffered until a real answer can be distinguished', () => {
  assert.equal(protocol.couldBeInternalModelOutputPrefix('{'), true);
  assert.equal(protocol.couldBeInternalModelOutputPrefix('{"user_'), true);
  assert.equal(protocol.isInternalModelOutputPrefix('{"user_safety":"safe"}'), true);
  assert.equal(protocol.couldBeInternalModelOutputPrefix('The answer is '), false);
});

test('stream renderer accepts only typed content events and ignores legacy strings or unknown events', () => {
  assert.equal(protocol.parseChatStreamEvent(JSON.stringify('User Safety: safe')), null);
  assert.equal(protocol.parseChatStreamEvent(JSON.stringify({ type: 'debug', value: 'Response Safety: safe' })), null);
  assert.equal(protocol.parseChatStreamEvent(JSON.stringify({ type: 'content', text: 'The answer is 42.' }))?.text, 'The answer is 42.');
});
