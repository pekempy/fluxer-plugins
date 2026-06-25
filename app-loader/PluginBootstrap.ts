import { setupRouteInjection } from './PluginRouteInjector.js';
import { setupStoreDecoration } from './PluginStoreDecorator.js';
import { plugins } from './generated/plugin-metadata.js';

function bootstrap() {
  console.log('[App Loader] Bootstrapping plugins...');

  // 1. Setup route injection
  setupRouteInjection();

  // 2. Setup store decoration
  setupStoreDecoration();

  // 3. Initialize plugins lifecycle
  for (const plugin of plugins) {
    if (plugin.entry && typeof plugin.entry.init === 'function') {
      try {
        const runtimeContext = {
          name: plugin.name,
          manifest: {},
          logger: {
            info: (...args: any[]) => console.log(`[Plugin:${plugin.name}]`, ...args),
            warn: (...args: any[]) => console.warn(`[Plugin:${plugin.name}]`, ...args),
            error: (...args: any[]) => console.error(`[Plugin:${plugin.name}]`, ...args),
            debug: (...args: any[]) => console.debug(`[Plugin:${plugin.name}]`, ...args),
            fatal: (...args: any[]) => console.error(`[Plugin:${plugin.name}] [FATAL]`, ...args),
          },
          config: {
            get: (key: string, defaultValue?: any) => {
              const val = localStorage.getItem(`fluxer:plugin:${plugin.name}:config:${key}`);
              return val !== null ? JSON.parse(val) : defaultValue;
            },
            set: async (key: string, value: any) => {
              localStorage.setItem(`fluxer:plugin:${plugin.name}:config:${key}`, JSON.stringify(value));
            },
            delete: async (key: string) => {
              localStorage.removeItem(`fluxer:plugin:${plugin.name}:config:${key}`);
            },
            all: () => {
              const allConfig: Record<string, any> = {};
              for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                const prefix = `fluxer:plugin:${plugin.name}:config:`;
                if (k && k.startsWith(prefix)) {
                  const keyName = k.substring(prefix.length);
                  const val = localStorage.getItem(k);
                  if (val !== null) allConfig[keyName] = JSON.parse(val);
                }
              }
              return allConfig;
            }
          },
          pluginDir: '',
          getPluginApi: async (depName: string) => {
            // Find other plugin exports if any
            return null;
          }
        };
        plugin.entry.init(runtimeContext as any);
      } catch (err) {
        console.error(`[App Loader] Failed to initialize plugin lifecycle for '${plugin.name}':`, err);
      }
    }
  }

  console.log('[App Loader] Plugins bootstrapped successfully.');
}

bootstrap();
