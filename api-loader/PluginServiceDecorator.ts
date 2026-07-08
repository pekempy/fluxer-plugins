import path from 'path';
import type { Hono as HonoType } from 'hono';
import type { Context } from 'hono';
import { getHonoClass } from './hono.js';
import type { LoadedPlugin } from '@pekempy/fluxer-plugin-sdk/types/plugin';
import { wrapServiceWithEvents } from './PluginEventBus.js';
import { getResolvableFileUrl } from './HotReloader.js';

let contextProto: any = null;

export async function patchHonoContext(eventBus: any) {
  if (!contextProto) {
    const Hono = await getHonoClass();
    const dummyApp = new Hono();
    dummyApp.all('*', (c: any) => {
      contextProto = Object.getPrototypeOf(c);
      return c.text('ok');
    });
    await dummyApp.fetch(new Request('http://localhost/'));
  }

  if (!contextProto) {
    throw new Error('Failed to extract Hono Context prototype');
  }

  const originalSet = contextProto.set;
  contextProto.set = function (this: any, key: string, value: any) {
    if (
      value &&
      typeof value === 'object' &&
      (key.endsWith('Service') ||
        key.endsWith('Repository') ||
        key.endsWith('Buffer') ||
        key === 'kvActivityTracker' ||
        key === 'requestCache')
    ) {
      value = wrapServiceWithEvents(key, value, eventBus);
    }
    return originalSet.call(this, key, value);
  };
}

export async function createServiceDecoratorMiddleware(plugins: LoadedPlugin[], eventBus: any, forceReload = false) {
  const decorators: Array<{
    pluginName: string;
    decorates: string;
    decorate: Function;
    pluginContext: any;
  }> = [];

  for (const plugin of plugins) {
    const services = plugin.manifest.targets?.api?.services || [];
    for (const svc of services) {
      try {
        const jsFile = svc.file.replace(/\.ts$/, '.js');
        const fullPath = path.join(plugin.pluginDir, 'dist', jsFile);
        const fileUrl = getResolvableFileUrl(fullPath, forceReload);

        const decoratorModule = await import(fileUrl);
        const decoratorConfig = decoratorModule.default || decoratorModule;

        if (typeof decoratorConfig.decorate !== 'function') {
          plugin.context.logger.error(`Service decorator '${svc.file}' does not export a decorate() function.`);
          continue;
        }

        decorators.push({
          pluginName: plugin.name,
          decorates: svc.decorates,
          decorate: decoratorConfig.decorate,
          pluginContext: plugin.context,
        });

        plugin.context.logger.info(`Loaded service decorator for '${svc.decorates}'`);
      } catch (err) {
        plugin.context.logger.error(`Failed to load service decorator '${svc.file}':`, err);
      }
    }
  }

  // Return a Hono middleware
  return async (ctx: any, next: any) => {
    // ServiceMiddleware has already run and set services on ctx,
    // so we can decorate them before calling next().
    for (const dec of decorators) {
      const original = ctx.get(dec.decorates);
      if (original) {
        try {
          const decorated = dec.decorate(original, {
            ctx,
            eventBus,
            pluginContext: dec.pluginContext,
          });
          ctx.set(dec.decorates, decorated);
        } catch (err) {
          dec.pluginContext.logger.error(`Failed to decorate service '${dec.decorates}':`, err);
        }
      }
    }

    await next();
  };
}
