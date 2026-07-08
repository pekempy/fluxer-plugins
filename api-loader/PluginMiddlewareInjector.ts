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

/**
 * Injects plugin middlewares directly onto the Hono app instance.
 * This replaces the broken Hono.prototype.use monkeypatching approach.
 * In Hono, app.use() always runs before route handlers regardless of registration order.
 */
export async function injectPluginMiddlewares(app: any, plugins: LoadedPlugin[]) {
  // Register all handler files into the hot-reload registry first
  await registerPluginMiddlewares(plugins);

  for (const plugin of plugins) {
    const middlewares = (plugin.manifest.targets?.api?.middleware || []) as any[];

    for (const mw of middlewares) {
      if (mw.file) {
        const registryKey = `${plugin.name}:mw:${mw.position}:${mw.file}`;
        const wrappedHandler = async (ctx: any, next: any) => {
          const latestHandler = getPluginHandler(registryKey);
          return latestHandler(ctx, next);
        };

        app.use('*', wrappedHandler);
        plugin.context.logger.info(`[PluginMiddlewareInjector] Injected middleware from '${plugin.name}' (${mw.position}) directly onto app`);
        console.log(`[PluginMiddlewareInjector] Injected middleware from '${plugin.name}' (position: ${mw.position}) onto app`);
      } else if (mw.handler) {
        // Virtual/inline handler (used by system plugin)
        app.use('*', mw.handler);
        console.log(`[PluginMiddlewareInjector] Injected inline handler from '${plugin.name}' (position: ${mw.position}) onto app`);
      }
    }
  }
}
