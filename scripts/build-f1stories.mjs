// Canonical assembly target; ordinary development and standalone builds remain unchanged.
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const env = { ...process.env, APP_BASE: process.env.APP_BASE || '/telemetry/', VITE_F1STORIES_BUILD: 'true' };
for (const args of [['run', 'build', '--', `--base=${env.APP_BASE}`], ['run', 'build:interactive']]) {
  const result = spawnSync('npm', args, { stdio: 'inherit', env });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
rmSync('dist/interactive', { recursive: true, force: true });
mkdirSync('dist/interactive', { recursive: true });
cpSync('dist-interactive', 'dist/interactive', { recursive: true });
