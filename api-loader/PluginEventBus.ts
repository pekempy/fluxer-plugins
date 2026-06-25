import { EventEmitter } from 'events';
import type { LoadedPlugin } from '@pekempy/fluxer-plugin-sdk/types/plugin';
import path from 'path';
import { getResolvableFileUrl } from './HotReloader.js';

export class PluginEventBus extends EventEmitter {
  constructor() {
    super();
  }
}

export async function setupEventHooks(plugins: LoadedPlugin[], eventBus: PluginEventBus, forceReload = false) {
  for (const plugin of plugins) {
    const hooks = plugin.manifest.targets?.api?.hooks || [];
    for (const hk of hooks) {
      try {
        const jsFile = hk.handler.replace(/\.ts$/, '.js');
        const fullPath = path.join(plugin.pluginDir, 'dist', jsFile);
        const fileUrl = getResolvableFileUrl(fullPath, forceReload);

        const hookModule = await import(fileUrl);
        const hookConfig = hookModule.default || hookModule;

        const handlerFn = typeof hookConfig === 'function' ? hookConfig : hookConfig.handler;

        if (typeof handlerFn !== 'function') {
          plugin.context.logger.error(`Event hook '${hk.handler}' does not export a handler function.`);
          continue;
        }

        eventBus.on(hk.event, (data) => {
          try {
            handlerFn(data, plugin.context);
          } catch (err) {
            plugin.context.logger.error(`Error in event hook handler for '${hk.event}':`, err);
          }
        });

        plugin.context.logger.info(`Registered event hook for '${hk.event}'`);
      } catch (err) {
        plugin.context.logger.error(`Failed to load event hook '${hk.handler}':`, err);
      }
    }
  }
}

// Helper to wrap a service and emit events on its method calls
export function wrapServiceWithEvents(serviceName: string, service: any, eventBus: PluginEventBus): any {
  return new Proxy(service, {
    get(target, prop, receiver) {
      const originalValue = Reflect.get(target, prop, receiver);

      if (typeof originalValue === 'function') {
        return async function (this: any, ...args: any[]) {
          // Fire "before" event
          try {
            eventBus.emit(`${serviceName}:before:${String(prop)}`, { args });
          } catch (err) {
            console.error(`Error firing event ${serviceName}:before:${String(prop)}`, err);
          }

          // Call the original method
          const result = await originalValue.apply(this, args);

          // Fire "after" event
          try {
            eventBus.emit(`${serviceName}:${String(prop)}`, result);
            eventBus.emit(`${serviceName}:after:${String(prop)}`, { args, result });
          } catch (err) {
            console.error(`Error firing event ${serviceName}:after:${String(prop)}`, err);
          }

          return result;
        };
      }

      return originalValue;
    },
  });
}
