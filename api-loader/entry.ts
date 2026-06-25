import '../../fluxer_api/src/Instrument.js';
import { createAPIApp } from '../../fluxer_api/src/api/App.js';
import { initializeConfig } from '../../fluxer_api/src/api/Config.js';
import { initializeLogger } from '../../fluxer_api/src/api/Logger.js';
import { Config } from '../../fluxer_api/src/Config.js';
import { shutdownInstrumentation } from '../../fluxer_api/src/Instrument.js';
import { Logger } from '../../fluxer_api/src/Logger.js';
import { createServer, setupGracefulShutdown } from '../../packages/hono/src/Server.js';

import path from 'path';
import { discoverPlugins } from './PluginDiscovery.js';
import { patchHonoMiddleware, registerPluginMiddlewares } from './PluginMiddlewareInjector.js';
import { patchHonoContext, createServiceDecoratorMiddleware } from './PluginServiceDecorator.js';
import { registerRoutes, reloadPluginRoutes } from './PluginRouteRegistrar.js';
import { PluginEventBus, setupEventHooks } from './PluginEventBus.js';
import { startWatcher } from './HotReloader.js';

async function closeHttpServer(server: { close: (callback: (error?: Error) => void) => void }): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error !== undefined) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

async function main(): Promise<void> {
  // 1. Initialize original configs
  initializeConfig(Config);
  initializeLogger(Logger);

  const pluginsDir = process.env.FLUXER_PLUGIN_DIR || './plugins';
  console.log(`\x1b[34m[Loader] Discovering plugins in ${pluginsDir}...\x1b[0m`);

  // 2. Discover and load plugins
  let loadedPlugins = await discoverPlugins(pluginsDir);

  // 3. Initialize Event Bus and register initial hooks
  const eventBus = new PluginEventBus();
  await setupEventHooks(loadedPlugins, eventBus);

  // 4. Patch Hono middleware registration and context services injection BEFORE creating app
  patchHonoMiddleware(loadedPlugins);
  patchHonoContext(eventBus);

  // 5. Create service decorator middleware & define dynamic delegate
  let activeDecoratorMiddleware = await createServiceDecoratorMiddleware(loadedPlugins, eventBus);

  const delegateDecoratorMiddleware = async (ctx: any, next: any) => {
    return activeDecoratorMiddleware(ctx, next);
  };

  // 6. Hook into Hono's middleware insertion using system virtual plugin
  const systemPlugin = {
    name: 'system-injections',
    manifest: {
      name: 'system-injections',
      version: '1.0.0',
      targets: {
        api: {
          middleware: [
            {
              position: 'after:ServiceMiddleware',
              handler: delegateDecoratorMiddleware,
            },
          ],
        },
      },
    },
    context: { logger: Logger } as any,
    module: {},
    pluginDir: '',
  };
  loadedPlugins.unshift(systemPlugin as any); // Put at front so it gets matched

  // 7. Create Hono app
  const { app, initialize, shutdown } = await createAPIApp({
    config: Config,
    logger: Logger,
  });

  // 8. Register plugin routes
  await registerRoutes(app as any, loadedPlugins);

  // 9. Call init lifecycle on plugins
  for (const plugin of loadedPlugins) {
    if (plugin.module.init) {
      try {
        await plugin.module.init(plugin.context);
      } catch (err) {
        plugin.context.logger.error('Failed to run init hook:', err);
      }
    }
  }

  // 10. Start service initialization
  await initialize();

  process.on('uncaughtException', (error) => {
    Logger.error({ error }, 'Uncaught exception');
  });
  process.on('unhandledRejection', (reason) => {
    Logger.error({ reason }, 'Unhandled rejection (suppressed)');
  });

  // 11. Start HTTP Server
  const server = createServer(app, { port: (Config as any).port });
  Logger.info({ port: (Config as any).port }, `Starting Fluxer API (with Plugins) on port ${(Config as any).port}`);

  // 12. Setup hot reload watcher if enabled
  if (process.env.FLUXER_DEV === 'true' || process.env.NODE_ENV !== 'production') {
    startWatcher(pluginsDir, async (fileChanged) => {
      Logger.info('[Loader] Hot-reloading changed plugin modules...');
      
      // Reload plugins manifest and module entries
      const freshPlugins = await discoverPlugins(pluginsDir, true);
      
      // Update our system plugin decorator reference (lazy reload in middleware)
      activeDecoratorMiddleware = await createServiceDecoratorMiddleware(freshPlugins, eventBus, true);
      
      // Re-register plugin middlewares in the handler registry
      registerPluginMiddlewares(freshPlugins);

      // Re-register plugin route handlers in the registry without router changes
      await reloadPluginRoutes(freshPlugins);

      // Re-register event hooks
      eventBus.removeAllListeners();
      await setupEventHooks(freshPlugins, eventBus, true);
      
      Logger.info('[Loader] Hot-reload complete!');
    });
  }

  setupGracefulShutdown(
    async () => {
      // Call shutdown lifecycle on plugins
      for (const plugin of loadedPlugins) {
        if (plugin.module.shutdown) {
          try {
            await plugin.module.shutdown(plugin.context);
          } catch (err) {
            plugin.context.logger.error('Failed to run shutdown hook:', err);
          }
        }
      }
      await closeHttpServer(server);
      await shutdown();
      await shutdownInstrumentation();
    },
    { logger: Logger, timeoutMs: 30000 },
  );
}

main().catch((err) => {
  Logger.fatal({ error: err }, 'Failed to start Fluxer API (with Plugins)');
  process.exit(1);
});
