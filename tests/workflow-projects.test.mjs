import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanProjectConfig, cleanProjectPatch, mergeProjectPatch, projectWordCount, validProjectId } from '../src/lib/workflow-projects.mjs';

test('a metadata edit preserves chapters and images omitted from its patch', () => {
  const original = { title: 'Draft', config: { genre: 'science fiction', apiKey: 'private' }, chapters: [{ chapter_number: 1, raw_content: 'Full chapter' }], visual_assets: [{ id: 'image-1' }] };
  const next = mergeProjectPatch(original, { title: 'New title', config: { style: 'concise' } });
  assert.equal(next.chapters, original.chapters);
  assert.equal(next.visual_assets, original.visual_assets);
  assert.deepEqual(next.config, { genre: 'science fiction', style: 'concise' });
});

test('summary snapshots and malformed chapter updates are rejected', () => {
  assert.throws(() => cleanProjectPatch({ isSummary: true, chapters: [] }), /INCOMPLETE_PROJECT/);
  assert.throws(() => cleanProjectPatch({ chapters: [{ chapter_number: 1, title: 'One' }, { chapter_number: 1, title: 'Duplicate' }] }), /INVALID_PROJECT/);
  assert.throws(() => cleanProjectPatch({ config: { style: { nested: true } } }), /INVALID_PROJECT/);
});

test('credentials and client ownership fields cannot enter stored patches', () => {
  assert.deepEqual(cleanProjectPatch({ user_id: 'other', id: 'other', title: 'Book', config: { apiKey: 'secret', imageApiKey: 'secret', resumeChapters: ['private'], style: 'plain' } }), { title: 'Book', config: { style: 'plain' } });
  assert.deepEqual(cleanProjectConfig({ apiKey: 'secret', prompt: 'story' }), { prompt: 'story' });
  assert.equal(validProjectId('../foreign'), false);
  assert.equal(validProjectId('proj_123'), true);
});

test('word counts use the selected revision of each chapter', () => {
  assert.equal(projectWordCount([{ raw_content: 'raw', polished_content: 'polished' }, { raw_content: 'tail' }]), 12);
});
