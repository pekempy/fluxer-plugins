import { RouteBuilder } from '@app/features/platform/components/router/RouterBuilder';
import { plugins } from './generated/plugin-metadata.js';

let patched = false;

export function setupRouteInjection() {
  if (patched) return;
  patched = true;

  const originalBuild = RouteBuilder.prototype.build;

  RouteBuilder.prototype.build = function (this: any) {
    const routes = originalBuild.call(this);

    // If this is the root route tree builder
    if (this.id === '__root') {
      for (const plugin of plugins as any[]) {
        if (plugin.routes) {
          for (const r of plugin.routes as any[]) {
            routes.push({
              id: `plugin:${plugin.name}:route:${r.path}`,
              path: r.path,
              parentId: r.parentRoute || 'appLayout', // fallback to appLayout if parentRoute is omitted
              component: r.component,
            });
          }
        }
      }
    }

    return routes;
  };
}
