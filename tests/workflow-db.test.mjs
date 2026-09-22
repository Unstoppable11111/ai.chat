import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';
import * as projectUtils from '../src/lib/workflow-projects.mjs';

const require = createRequire(import.meta.url);
const compiled = ts.transpileModule(fs.readFileSync(new URL('../src/lib/workflow-db.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function setup() {
  const row = {
    id: 'book-1', user_id: 'owner-1', title: 'Original', cover_url: '/cover.png', prompt: 'Story',
    genre: 'Fantasy', style: 'Simple', created_at: '2026-09-20T00:00:00Z', updated_at: '2026-09-20T00:00:00Z',
    config: JSON.stringify({ prompt: 'Story', genre: 'Fantasy', apiKey: 'secret' }),
    bible: JSON.stringify({ title: 'Original' }), chapters: JSON.stringify([{ chapter_number: 1, title: 'One', raw_content: 'Complete body', summary: 'Summary' }]),
    pitch: null, visual_assets: JSON.stringify([{ id: 'art-1', type: 'scene', title: 'Scene', image_url: '/image.png' }]),
  };
  const calls = [];
  const connection = {
    beginTransaction: async () => calls.push('begin'), commit: async () => calls.push('commit'),
    rollback: async () => calls.push('rollback'), release: () => calls.push('release'),
    execute: async (sql, values) => {
      calls.push({ sql, values });
      if (sql.startsWith('INSERT')) throw Object.assign(new Error('Duplicate'), { code: 'ER_DUP_ENTRY' });
      if (sql.startsWith('SELECT')) return [[values[0] === row.id && values[1] === row.user_id ? row : undefined].filter(Boolean)];
      if (sql.startsWith('UPDATE')) {
        assert.deepEqual(Array.from(values.slice(-2)), [row.id, row.user_id]);
        [row.title, row.cover_url, row.prompt, row.genre, row.style, row.config, row.bible, row.chapters, row.pitch, row.visual_assets] = values;
        row.updated_at = '2026-09-22T00:00:00Z';
      }
      return [{}];
    },
  };
  const database = {
    getConnection: async () => connection,
    execute: connection.execute,
    query: async (sql, values) => {
      calls.push({ sql, values });
      return [[{ ...row, chapter_count: 1, word_count: null }, { ...row, id: 'book-2', chapter_count: 3, word_count: 100 }]];
    },
  };
  const testModule = { exports: {} };
  vm.runInNewContext(compiled, { module: testModule, exports: testModule.exports, require: name => name === './db' ? { getDbPool: () => database } : name === './workflow-projects.mjs' ? projectUtils : require(name) });
  return { api: testModule.exports, calls, row };
}

test('bookshelf query selects summaries only and uses bounded pagination', async () => {
  const { api, calls } = setup();
  const result = await api.listUserProjects('owner-1', 0, 1);
  assert.equal(result.hasMore, true);
  assert.equal(result.projects.length, 1);
  assert.equal(result.projects[0].isSummary, true);
  assert.equal(result.projects[0].chapters.length, 0);
  assert.equal(result.projects[0].wordCount, undefined);
  assert.equal(result.projects[0].config.apiKey, undefined);
  assert.doesNotMatch(calls[0].sql, /SELECT\s+\*|\bbible\b|\bvisual_assets\b/);
  assert.deepEqual(Array.from(calls[0].values), ['owner-1', 2, 0]);
});

test('field PATCH preserves complete chapters and assets while stripping credentials', async () => {
  const { api, row, calls } = setup();
  const current = await api.getUserProject('owner-1', 'book-1');
  const result = await api.patchUserProject('owner-1', 'book-1', current.revision, { title: 'Edited', config: { style: 'New' } });
  assert.equal(result.title, 'Edited');
  assert.equal(result.chapters[0].raw_content, 'Complete body');
  assert.equal(result.visual_assets[0].image_url, '/image.png');
  assert.equal(result.config.genre, 'Fantasy');
  assert.equal(result.config.style, 'New');
  assert.equal(result.config.apiKey, undefined);
  assert.equal(JSON.parse(row.config)._wordCount, 13);
  assert.notEqual(current.revision, result.revision);
  assert.ok(calls.includes('commit'));
});

test('stale revisions and cross-owner PATCH never issue UPDATE', async () => {
  for (const [owner, revision, code] of [['owner-1', 'stale', 'PROJECT_CONFLICT'], ['other-owner', 'anything', 'PROJECT_NOT_FOUND']]) {
    const { api, calls } = setup();
    await assert.rejects(api.patchUserProject(owner, 'book-1', revision, { title: 'Overwrite' }), error => error.code === code);
    assert.equal(calls.some(call => call.sql?.startsWith('UPDATE')), false);
    assert.ok(calls.includes('rollback'));
    assert.ok(calls.includes('release'));
  }
});

test('duplicate creation reports conflict without updating an existing project', async () => {
  const { api, calls } = setup();
  await assert.rejects(api.createUserProject('other-owner', { id: 'book-1', title: 'Overwrite' }), error => error.status === 409);
  assert.equal(calls.some(call => call.sql?.startsWith('UPDATE')), false);
  assert.doesNotMatch(calls.find(call => call.sql?.startsWith('INSERT')).sql, /ON DUPLICATE KEY/);
});
