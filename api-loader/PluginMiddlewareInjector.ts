import type { Hono as HonoType } from 'hono';
import { getHonoClass } from './hono.js';
import path from 'path';
import type { LoadedPlugin } from '@pekempy/fluxer-plugin-sdk/types/plugin';
import { registerPluginHandler, getPluginHandler, getResolvableFileUrl } from './HotReloader.js';

// Import middlewares from fluxer_api to match their references
import { UserMiddleware } from '../../fluxer_api/src/api/middleware/UserMiddleware.js';
import { ServiceMiddleware } from '../../fluxer_api/src/api/middleware/ServiceMiddleware.js';
import { IpBanMiddleware } from '../../fluxer_api/src/api/middleware/IpBanMiddleware.js';
import ContentFilterMiddleware from '../../fluxer_api/src/api/middleware/ContentFilterMiddleware.js';
import { GuildAvailabilityMiddleware } from '../../fluxer_api/src/api/middleware/GuildAvailabilityMiddleware.js';
import { LocaleMiddleware } from '../../fluxer_api/src/api/middleware/LocaleMiddleware.js';

const middlewareMap: Record<string, any> = {
  UserMiddleware,
  ServiceMiddleware,
  IpBanMiddleware,
  ContentFilterMiddleware,
  GuildAvailabilityMiddleware,
  LocaleMiddleware,
};

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

export async function patchHonoMiddleware(plugins: LoadedPlugin[]) {
  const Hono = await getHonoClass();

  // Register initial handlers
  await registerPluginMiddlewares(plugins);

  const originalUse = Hono.prototype.use;

  Hono.prototype.use = function (this: any, ...args: any[]) {
    let pathArg = '*';
    let handlers: any[] = [];

    if (typeof args[0] === 'string') {
      pathArg = args[0];
      handlers = args.slice(1);
    } else {
      handlers = args;
    }

    console.log('[PluginMiddlewareInjector] use() called for path:', pathArg, 'handlers count:', handlers.length);

    const injectedHandlers: any[] = [];

    for (const handler of handlers) {
      // Find plugin middlewares that want to run BEFORE this handler
      for (const plugin of plugins) {
        const middlewares = (plugin.manifest.targets?.api?.middleware || []) as any[];
        for (const mw of middlewares) {
          if (mw.position.startsWith('before:')) {
            const targetName = mw.position.substring(7);
            const targetRef = middlewareMap[targetName];
            if (targetRef) {
              const matched = handler === targetRef;
              console.log(`[PluginMiddlewareInjector] Matching handler against target ${targetName}:`, matched);
              if (matched) {
                const pluginContext = plugin.context;
                
                if (mw.file) {
                  const registryKey = `${plugin.name}:mw:${mw.position}:${mw.file}`;
                  const wrappedHandler = async (ctx: any, next: any) => {
                    const latestHandler = getPluginHandler(registryKey);
                    return latestHandler(ctx, next);
                  };
                  console.log(`[PluginMiddlewareInjector] INJECTING middleware from '${plugin.name}' before '${targetName}'`);
                  pluginContext.logger.info(`Injecting middleware from '${plugin.name}' before '${targetName}'`);
                  injectedHandlers.push(wrappedHandler);
                } else if (mw.handler) { // For virtual system plugin
                  const wrappedHandler = async (ctx: any, next: any) => {
                    return mw.handler(ctx, next);
                  };
                  injectedHandlers.push(wrappedHandler);
                }
              }
            }
          }
        }
      }

      // Add the original handler
      injectedHandlers.push(handler);

      // Find plugin middlewares that want to run AFTER this handler
      for (const plugin of plugins) {
        const middlewares = (plugin.manifest.targets?.api?.middleware || []) as any[];
        for (const mw of middlewares) {
          if (mw.position.startsWith('after:')) {
            const targetName = mw.position.substring(6);
            const targetRef = middlewareMap[targetName];
            if (targetRef && handler === targetRef) {
              const pluginContext = plugin.context;
              
              if (mw.file) {
                const registryKey = `${plugin.name}:mw:${mw.position}:${mw.file}`;
                const wrappedHandler = async (ctx: any, next: any) => {
                  const latestHandler = getPluginHandler(registryKey);
                  return latestHandler(ctx, next);
                };
                pluginContext.logger.debug(`Injecting middleware from '${plugin.name}' after '${targetName}'`);
                injectedHandlers.push(wrappedHandler);
              } else if (mw.handler) { // For virtual system plugin
                const wrappedHandler = async (ctx: any, next: any) => {
                  return mw.handler(ctx, next);
                };
                injectedHandlers.push(wrappedHandler);
              }
            }
          }
        }
      }
    }

    // Handle "first" and "last" position middlewares
    const isFirstMiddleware = handlers.some(h => h === IpBanMiddleware);
    if (isFirstMiddleware) {
      const firstInjections: any[] = [];
      for (const plugin of plugins) {
        const middlewares = plugin.manifest.targets?.api?.middleware || [];
        for (const mw of middlewares) {
          if (mw.position === 'first') {
            if (mw.file) {
              const registryKey = `${plugin.name}:mw:${mw.position}:${mw.file}`;
              const wrappedHandler = async (ctx: any, next: any) => {
                const latestHandler = getPluginHandler(registryKey);
                return latestHandler(ctx, next);
              };
              plugin.context.logger.debug(`Injecting middleware from '${plugin.name}' at 'first' position`);
              firstInjections.push(wrappedHandler);
            }
          }
        }
      }
      injectedHandlers.unshift(...firstInjections);
    }

    const isLastMiddleware = handlers.some(h => h === LocaleMiddleware);
    if (isLastMiddleware) {
      const lastInjections: any[] = [];
      for (const plugin of plugins) {
        const middlewares = plugin.manifest.targets?.api?.middleware || [];
        for (const mw of middlewares) {
          if (mw.position === 'last') {
            if (mw.file) {
              const registryKey = `${plugin.name}:mw:${mw.position}:${mw.file}`;
              const wrappedHandler = async (ctx: any, next: any) => {
                const latestHandler = getPluginHandler(registryKey);
                return latestHandler(ctx, next);
              };
              plugin.context.logger.debug(`Injecting middleware from '${plugin.name}' at 'last' position`);
              lastInjections.push(wrappedHandler);
            }
          }
        }
      }
      injectedHandlers.push(...lastInjections);
    }

    return originalUse.apply(this, [pathArg, ...injectedHandlers]);
  };
}
