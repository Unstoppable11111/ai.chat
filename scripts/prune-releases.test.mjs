import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, symlink, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pruneReleases } from './prune-releases.mjs';

test('retains current, previous and PM2-used releases; ignores unrelated directories and symlinks', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'release-retention-'));
  try {
    const root = join(dir, 'releases');
    const names = [1, 2, 3, 4].map(n => `20260910T010000Z-${n}`);
    for (const name of [...names, 'manual-backup']) await mkdir(join(root, name), { recursive: true });
    await symlink(join(root, names[3]), join(dir, 'current'), 'junction');
    await symlink(join(root, 'manual-backup'), join(root, '20260910T010000Z-5'), 'junction');
    const removed = await pruneReleases(dir, join(root, names[3]), join(root, names[1]), [{ pm2_env: { pm_cwd: join(root, names[2]) } }]);
    assert.deepEqual(removed, [names[0]]);
    assert.deepEqual((await readdir(root)).sort(), [...names.slice(1), '20260910T010000Z-5', 'manual-backup'].sort());
    await assert.rejects(pruneReleases(dir, join(root, names[1]), '', []), /Current release changed/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
