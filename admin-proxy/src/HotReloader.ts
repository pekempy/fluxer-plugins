import { watch } from 'chokidar';
import type { FSWatcher } from 'chokidar';
import path from 'node:path';

let watcher: FSWatcher | null = null;

export function startWatcher(pluginsDir: string, onChange: (file: string) => Promise<void>) {
  if (watcher) return;

  const resolvedDir = path.resolve(pluginsDir);
  console.log(`[Admin Proxy] Watching for plugin changes in ${resolvedDir}...`);

  watcher = watch(resolvedDir, {
    ignored: [
      /(^|[\/\\])\../, // ignore dotfiles
      /node_modules/,
      /package\.json/,
      /pnpm-lock\.yaml/
    ],
    persistent: true,
    ignoreInitial: true,
  });

  watcher.on('all', async (event: string, filePath: string) => {
    // Only reload on file changes that matter
    if (filePath.endsWith('.js') || filePath.endsWith('.json') || filePath.endsWith('.html') || filePath.endsWith('.yaml')) {
      console.log(`[Admin Proxy] File changed: ${path.relative(resolvedDir, filePath)} (${event})`);
      try {
        await onChange(filePath);
      } catch (err) {
        console.error('[Admin Proxy] Error during hot-reload:', err);
      }
    }
  });
}

export function stopWatcher() {
  if (watcher) {
    watcher.close();
    watcher = null;
  }
}
