import { readdir, realpath, rm } from 'node:fs/promises';
import { resolve, join, sep, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export async function pruneReleases(deployPath, current, previous, apps) {
  const root = await realpath(join(deployPath, 'releases'));
  const active = await realpath(join(deployPath, 'current'));
  const keep = new Set([await realpath(current)]);
  if (active !== [...keep][0]) throw new Error('Current release changed; refusing cleanup');
  if (dirname(active) !== root) throw new Error('Current release is outside releases directory');
  if (previous) keep.add(await realpath(previous));
  const entries = await readdir(root, { withFileTypes: true });
  const candidates = entries.filter(entry => entry.isDirectory() && /^\d{8}T\d{6}Z-\d+$/.test(entry.name));
  const removed = [];
  for (const entry of candidates) {
    const target = join(root, entry.name);
    if (keep.has(target)) continue;
    if (await realpath(target) !== target) throw new Error('Release path changed');
    if (apps.some(app => [app.pm2_env?.pm_cwd, app.pm2_env?.pm_exec_path].some(path => path && (resolve(path) === target || resolve(path).startsWith(target + sep))))) {
      console.warn(`Keeping release used by PM2: ${entry.name}`);
      continue;
    }
    await rm(target, { recursive: true });
    removed.push(entry.name);
  }
  return removed;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const apps = JSON.parse(execFileSync('pm2', ['jlist'], { encoding: 'utf8' }));
  const removed = await pruneReleases(...process.argv.slice(2, 5), apps);
  console.log('Removed obsolete releases:', removed.join(', ') || 'none');
}
