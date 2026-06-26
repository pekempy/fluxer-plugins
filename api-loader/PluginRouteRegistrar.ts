import { Hono } from 'hono';
import path from 'path';
import type { LoadedPlugin } from '@pekempy/fluxer-plugin-sdk/types/plugin';
import { getResolvableFileUrl, registerPluginHandler, getPluginHandler } from './HotReloader.js';

// Import standard middlewares from the main api server
import { ServiceMiddleware } from '../../fluxer_api/src/api/middleware/ServiceMiddleware.js';
import { UserMiddleware } from '../../fluxer_api/src/api/middleware/UserMiddleware.js';

export async function registerRoutes(app: Hono, plugins: LoadedPlugin[], forceReload = false) {
  for (const plugin of plugins) {
    const routes = plugin.manifest.targets?.api?.routes || [];
    for (const rt of routes) {
      try {
        // Resolve the JS file in the dist/ folder (since it was compiled)
        const jsFile = rt.file.replace(/\.ts$/, '.js');
        const fullPath = path.join(plugin.pluginDir, 'dist', jsFile);
        const fileUrl = getResolvableFileUrl(fullPath, forceReload);

        const routeModule = await import(fileUrl);
        const routeConfig = routeModule.default || routeModule;

        if (typeof routeConfig.routes !== 'function') {
          plugin.context.logger.error(`Route module '${rt.file}' does not export a routes() function.`);
          continue;
        }

        const subRouter = new Hono();

        // Register standard middlewares to inject DB services and user auth context
        subRouter.use('*', ServiceMiddleware);
        subRouter.use('*', UserMiddleware);

        // Wrap the subRouter in a Proxy to convert all registered route handlers into dynamic hot-swappable delegates
        const wrappedSubRouter = new Proxy(subRouter, {
          get(target, prop, receiver) {
            const original = Reflect.get(target, prop, receiver);
            
            if (
              typeof original === 'function' && 
              ['get', 'post', 'put', 'delete', 'patch', 'use'].includes(String(prop))
            ) {
              return (pathArg: string, ...handlers: any[]) => {
                const wrappedHandlers = handlers.map((h, idx) => {
                  if (typeof h === 'function') {
                    const registryKey = `${plugin.name}:route:${rt.file}:${String(prop)}:${pathArg}:${idx}`;
                    
                    // Register the actual handler function
                    registerPluginHandler(registryKey, h);
                    
                    // Return the dynamic delegate
                    return async (ctx: any, next: any) => {
                      const latestHandler = getPluginHandler(registryKey);
                      return latestHandler(ctx, next);
                    };
                  }
                  return h;
                });
                
                return original.apply(target, [pathArg, ...wrappedHandlers]);
              };
            }
            
            return original;
          }
        });

        routeConfig.routes(wrappedSubRouter);

        const prefix = routeConfig.prefix || rt.prefix;
        app.route(prefix, subRouter);

        plugin.context.logger.info(`Registered routes at prefix '${prefix}' (hot-reload enabled)`);
      } catch (err) {
        plugin.context.logger.error(`Failed to load route module '${rt.file}':`, err);
      }
    }
  }
}

export async function reloadPluginRoutes(plugins: LoadedPlugin[]) {
  for (const plugin of plugins) {
    const routes = plugin.manifest.targets?.api?.routes || [];
    for (const rt of routes) {
      try {
        const jsFile = rt.file.replace(/\.ts$/, '.js');
        const fullPath = path.join(plugin.pluginDir, 'dist', jsFile);
        const fileUrl = getResolvableFileUrl(fullPath, true);
        const routeModule = await import(fileUrl);
        const routeConfig = routeModule.default || routeModule;

        if (typeof routeConfig.routes !== 'function') continue;

        // Dummy Hono-like object that just captures handler updates to update the registry
        const dummyApp = new Proxy({}, {
          get(target, prop) {
            if (['get', 'post', 'put', 'delete', 'patch', 'use'].includes(String(prop))) {
              return (pathArg: string, ...handlers: any[]) => {
                handlers.forEach((h, idx) => {
                  if (typeof h === 'function') {
                    const registryKey = `${plugin.name}:route:${rt.file}:${String(prop)}:${pathArg}:${idx}`;
                    registerPluginHandler(registryKey, h);
                  }
                });
              };
            }
            return () => {};
          }
        });

        routeConfig.routes(dummyApp);
      } catch (err) {
        plugin.context.logger.error(`Failed to hot-reload routes in '${rt.file}':`, err);
      }
    }
  }
}

export { registerPluginHandler };
