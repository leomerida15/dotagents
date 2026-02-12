import { watch } from 'node:fs';
import { resolve } from 'node:path';
import { build } from './bunstart.build';

let childProc: ReturnType<typeof Bun.spawn> | null = null;
let timeout: ReturnType<typeof setTimeout> | null = null;

function startApp() {
  if (childProc) {
    childProc.kill();
    childProc = null;
  }
  const distDir = resolve(process.cwd(), 'dist');
  childProc = Bun.spawn(['bun', 'run', 'index.js'], {
    cwd: distDir,
    stdout: 'inherit',
    stderr: 'inherit'
  });
}

async function rebuildAndRestart(filename?: string) {
  const trigger = filename ? ` (${filename})` : '';
  console.log(`\nRebuilding${trigger}...`);
  try {
    await build();
    startApp();
  } catch (e) {
    console.error('Build failed:', e);
  }
}

async function main(): Promise<void> {
  console.log('Initial build...');
  await rebuildAndRestart();

  const watchPath = resolve(process.cwd(), 'src');
  console.log(`Watching ${watchPath}...`);

  const watcher = watch(watchPath, { recursive: true }, (eventType, filename) => {
    if (eventType !== 'change') return;
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => rebuildAndRestart(filename ?? undefined), 100);
  });

  process.on('SIGINT', () => {
    watcher.close();
    if (childProc) childProc.kill();
    if (timeout) clearTimeout(timeout);
    process.exit(0);
  });
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
