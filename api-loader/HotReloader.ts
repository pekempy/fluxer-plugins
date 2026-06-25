import chokidar from 'chokidar';
import path from 'path';

export function startWatcher(pluginsDir: string, onReload: (fileChanged: string) => Promise<void> | void) {
  const watcher = chokidar.watch(pluginsDir, {
    ignored: /(^|[\/\\])\../, // Ignore dotfiles
    persistent: true,
    ignoreInitial: true,
  });

  watcher.on('all', async (event, filePath) => {
    // We only trigger reload when a compiled JS file changes (inside dist/)
    if (filePath.endsWith('.js') && filePath.includes('/dist/')) {
      console.log(`[Watcher] File changed: ${path.relative(pluginsDir, filePath)}`);
      try {
        await onReload(filePath);
      } catch (err) {
        console.error('[Watcher] Failed to run reload handler:', err);
      }
    }
  });

  console.log(`[Watcher] Watching plugin files in ${pluginsDir} for hot reload...`);
  return watcher;
}

// Global cache-busting query parameter tracking
const cacheBusterMap = new Map<string, number>();

export function getResolvableFileUrl(fullPath: string, forceReload = false): string {
  const normalizedPath = fullPath.replace(/\\/g, '/');
  
  if (forceReload) {
    cacheBusterMap.set(normalizedPath, Date.now());
  }

  const buster = cacheBusterMap.get(normalizedPath);
  const query = buster ? `?t=${buster}` : '';

  return `file://${normalizedPath}${query}`;
}

// Dynamic handler delegation registry for hot reloading without process restart
const handlerRegistry = new Map<string, Function>();

export function registerPluginHandler(key: string, handler: Function): void {
  handlerRegistry.set(key, handler);
}

export function getPluginHandler(key: string): Function {
  const handler = handlerRegistry.get(key);
  if (!handler) {
    // Return a fallback noop handler
    return async (ctx: any, next: any) => {
      if (next) await next();
    };
  }
  return handler;
}
