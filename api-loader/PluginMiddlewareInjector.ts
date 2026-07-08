import path from 'path';
import type { LoadedPlugin } from '@pekempy/fluxer-plugin-sdk/types/plugin';
import { registerPluginHandler, getPluginHandler, getResolvableFileUrl } from './HotReloader.js';

async function loadMiddlewareHandler(plugin: LoadedPlugin, mw: any, forceReload = false) {
  const jsFile = mw.file.replace(/\.ts$/, '.js');
  const fullPath = path.join(plugin.pluginDir, 'dist', jsFile);
  const fileUrl = getResolvableFileUrl(fullPath, forceReload);
  const module = await import(fileUrl);
  const config = module.default || module;
  return config.handler || config;
}

// Register plugin middlewares into the hot reloadable registry
export async function registerPluginMiddlewares(plugins: LoadedPlugin[], forceReload = false) {
  for (const plugin of plugins) {
    const middlewares = plugin.manifest.targets?.api?.middleware || [];
    for (const mw of middlewares) {
      if (mw.file) {
        const registryKey = `${plugin.name}:mw:${mw.position}:${mw.file}`;
        try {
          const handler = await loadMiddlewareHandler(plugin, mw, forceReload);
          registerPluginHandler(registryKey, handler);
        } catch (err) {
          plugin.context.logger.error(`Failed to load middleware handler for '${mw.file}':`, err);
        }
      }
    }
  }
}

export interface PluginMiddlewareEntry {
  name: string;
  position: string;
  handler: (ctx: any, next: any) => Promise<any>;
}

/**
 * Builds the list of hot-reloadable middleware handler delegates for all plugins.
 * These are intended to be registered on a FRESH Hono wrapper app BEFORE the inner
 * app is mounted, so they always run before any route handler.
 */
export async function buildPluginMiddlewareHandlers(plugins: LoadedPlugin[]): Promise<PluginMiddlewareEntry[]> {
  // Register all file-based handlers into the hot-reload registry
  await registerPluginMiddlewares(plugins);

  const entries: PluginMiddlewareEntry[] = [];

  for (const plugin of plugins) {
    const middlewares = (plugin.manifest.targets?.api?.middleware || []) as any[];

    for (const mw of middlewares) {
      if (mw.file) {
        const registryKey = `${plugin.name}:mw:${mw.position}:${mw.file}`;
        // Create a hot-reloadable delegate that always calls the latest registered handler
        const delegate = async (ctx: any, next: any) => {
          const latestHandler = getPluginHandler(registryKey);
          return latestHandler(ctx, next);
        };
        entries.push({ name: plugin.name, position: mw.position, handler: delegate });
      } else if (mw.handler) {
        // Inline/virtual handler (e.g. system-injections)
        entries.push({ name: plugin.name, position: mw.position, handler: mw.handler });
      }
    }
  }

  return entries;
}
