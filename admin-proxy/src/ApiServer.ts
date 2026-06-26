import type { Context } from 'hono';
import path from 'node:path';
import type { LoadedPlugin } from '@pekempy/fluxer-plugin-sdk/types/plugin';

const apiRegistry = new Map<string, any>();

export function setApiHandler(key: string, handler: any) {
  apiRegistry.set(key, handler);
}

export function getApiHandler(key: string): any {
  return apiRegistry.get(key);
}

export async function loadApiHandler(plugin: LoadedPlugin, api: any) {
  const jsFile = api.handler.replace(/\.ts$/, '.js');
  const fullPath = path.resolve(plugin.pluginDir, 'dist', jsFile);
  const fileUrl = `file://${fullPath}?t=${Date.now()}`;
  
  const module = await import(fileUrl);
  return module.default || module;
}

export async function registerPluginApis(app: any, plugins: LoadedPlugin[]) {
  for (const plugin of plugins) {
    const apis = plugin.manifest.targets?.admin?.api || [];
    for (const api of apis) {
      try {
        const routeKey = `${plugin.name}:api:${api.method}:${api.path}`;
        const handler = await loadApiHandler(plugin, api);
        setApiHandler(routeKey, handler);

        const apiWrapper = async (c: Context) => {
          const activeHandler = getApiHandler(routeKey);
          if (!activeHandler) {
            return c.text('Plugin API handler not loaded', 500);
          }
          const fn = typeof activeHandler === 'function' ? activeHandler : activeHandler.handler;
          if (typeof fn !== 'function') {
            return c.text('Plugin API handler function not found', 500);
          }
          return fn(c);
        };

        const method = api.method.toUpperCase();
        
        // Register standard path
        app.on(method, api.path, apiWrapper);
        
        // Register with /admin prefix just in case the client requests it relative to the admin base path
        if (!api.path.startsWith('/admin')) {
          app.on(method, `/admin${api.path}`, apiWrapper);
        }

        plugin.context.logger.info(`Registered API route [${method}] ${api.path}`);
      } catch (err) {
        plugin.context.logger.error(`Failed to register API route '${api.path}':`, err);
      }
    }
  }
}

export async function reloadPluginApis(plugins: LoadedPlugin[]) {
  for (const plugin of plugins) {
    const apis = plugin.manifest.targets?.admin?.api || [];
    for (const api of apis) {
      try {
        const routeKey = `${plugin.name}:api:${api.method}:${api.path}`;
        const handler = await loadApiHandler(plugin, api);
        setApiHandler(routeKey, handler);
      } catch {}
    }
  }
}
