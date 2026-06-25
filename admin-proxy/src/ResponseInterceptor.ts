import path from 'node:path';
import { getLoadedPlugins } from './index.js';

export async function runResponseInterceptors(ctx: any, html: string): Promise<string> {
  const plugins = getLoadedPlugins();
  const url = new URL(ctx.req.url);
  const pathname = url.pathname;

  let modifiedHtml = html;

  for (const plugin of plugins) {
    const interceptors = plugin.manifest.targets?.admin?.interceptors || [];
    for (const inter of interceptors) {
      const regex = routeToRegex(inter.route);
      if (regex.test(pathname)) {
        try {
          const jsFile = inter.handler.replace(/\.ts$/, '.js');
          const fullPath = path.resolve(plugin.pluginDir, 'dist', jsFile);
          const fileUrl = `file://${fullPath}?t=${Date.now()}`;
          
          const module = await import(fileUrl);
          const handler = module.default || module;
          
          if (typeof handler === 'function') {
            modifiedHtml = await handler(modifiedHtml, ctx);
          } else if (handler && typeof handler.intercept === 'function') {
            modifiedHtml = await handler.intercept(modifiedHtml, ctx);
          }
        } catch (err) {
          console.error(`[Admin Proxy] Failed to run response interceptor '${inter.handler}' for path '${pathname}':`, err);
        }
      }
    }
  }

  return modifiedHtml;
}

function routeToRegex(route: string): RegExp {
  // Convert standard routing parameterized path like "/users/{user_id}" to RegExp
  const escaped = route.replace(/[-[\]()*+?.,\\^$|#\s]/g, '\\$&'); // escape special regex chars except curly braces
  const replaced = escaped.replace(/\{[^}]+\}/g, '([^/]+)'); // replace {param} with match group
  return new RegExp(`^${replaced}$`);
}
