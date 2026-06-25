import { promises as fs } from 'fs';
import path from 'path';
import yaml from 'yaml';
import { PluginManifestSchema } from '@pekempy/fluxer-plugin-sdk/manifest';
import type { PluginManifest } from '@pekempy/fluxer-plugin-sdk/manifest';
import type { LoadedPlugin } from '@pekempy/fluxer-plugin-sdk/types/plugin';
import { PluginContext } from './PluginContext.js';
import { createPluginLogger } from './PluginContext.js';
import { getResolvableFileUrl } from './HotReloader.js';

export async function discoverPlugins(pluginsDir: string, forceReload = false): Promise<LoadedPlugin[]> {
  const resolvedDir = path.resolve(pluginsDir);
  const pluginsMap = new Map<string, { manifest: PluginManifest; dir: string }>();

  try {
    const entries = await fs.readdir(resolvedDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const pluginPath = path.join(resolvedDir, entry.name);
        let manifestPath = path.join(pluginPath, 'fluxer-plugin.yaml');
        try {
          await fs.access(manifestPath);
        } catch {
          manifestPath = path.join(pluginPath, 'fluxer-plugin.yml');
          try {
            await fs.access(manifestPath);
          } catch {
            continue; // Not a plugin
          }
        }

        try {
          const rawYaml = await fs.readFile(manifestPath, 'utf-8');
          const parsed = yaml.parse(rawYaml);
          const result = PluginManifestSchema.safeParse(parsed);
          if (!result.success) {
            console.error(`[Loader] Invalid manifest for plugin '${entry.name}':`);
            for (const error of result.error.errors) {
              console.error(`  - [${error.path.join('.')}] ${error.message}`);
            }
            continue;
          }

          const manifest = result.data;
          pluginsMap.set(manifest.name, { manifest, dir: pluginPath });
        } catch (err) {
          console.error(`[Loader] Failed to read plugin manifest in '${entry.name}':`, err);
        }
      }
    }
  } catch (err) {
    console.warn(`[Loader] Warning: Failed to read plugins directory at '${resolvedDir}':`, err);
    return [];
  }

  // Resolve dependencies (topological sort)
  const sortedNames = topologicalSort(pluginsMap);
  const loadedPlugins: LoadedPlugin[] = [];

  for (const name of sortedNames) {
    const info = pluginsMap.get(name);
    if (!info) continue;

    try {
      // Import the compiled plugin entrypoint (dist/index.js)
      const entrypointPath = path.join(info.dir, 'dist', 'index.js');
      const fileUrl = getResolvableFileUrl(entrypointPath, forceReload);
      const pluginModule = await import(fileUrl);
      const lifecycle = pluginModule.default || pluginModule;

      const logger = createPluginLogger(name);
      // Create config store (for simplicity, we store config in pluginsDir/config/<name>.json)
      const configStore = new JsonConfigStore(path.join(resolvedDir, 'config', `${name}.json`));
      await configStore.load();

      const context = new PluginContext(
        name,
        info.manifest,
        logger,
        configStore,
        info.dir,
        async (depName) => {
          const dep = loadedPlugins.find((p) => p.name === depName);
          return dep?.module?.api;
        }
      );

      loadedPlugins.push({
        name,
        manifest: info.manifest,
        context,
        module: lifecycle,
        pluginDir: info.dir,
      });

      console.log(`[Loader] Loaded plugin '${name}' version ${info.manifest.version}`);
    } catch (err) {
      console.error(`[Loader] Error: Failed to load plugin '${name}':`, err);
    }
  }

  return loadedPlugins;
}

function topologicalSort(pluginsMap: Map<string, { manifest: PluginManifest; dir: string }>): string[] {
  const visited = new Set<string>();
  const temp = new Set<string>();
  const result: string[] = [];

  function visit(name: string) {
    if (temp.has(name)) {
      throw new Error(`Circular dependency detected involving plugin '${name}'`);
    }
    if (!visited.has(name)) {
      temp.add(name);
      const info = pluginsMap.get(name);
      if (info && info.manifest.dependencies) {
        for (const dep of info.manifest.dependencies) {
          // Parse github:user/repo@ref or just name if it's name-only dependency
          const depName = parseDependencyName(dep);
          if (pluginsMap.has(depName)) {
            visit(depName);
          } else {
            console.warn(`[Loader] Warning: Optional dependency '${dep}' for plugin '${name}' is not installed.`);
          }
        }
      }
      temp.delete(name);
      visited.add(name);
      result.push(name);
    }
  }

  for (const name of pluginsMap.keys()) {
    visit(name);
  }

  return result;
}

function parseDependencyName(dep: string): string {
  // If it's a URL like github:user/repo@ref or github:user/repo, extract repo name
  if (dep.startsWith('github:')) {
    const parts = dep.substring(7).split('/');
    if (parts.length > 1) {
      const repoAndRef = parts[1];
      const repoName = repoAndRef.split('@')[0];
      return repoName;
    }
  }
  return dep;
}

class JsonConfigStore {
  private data: Record<string, any> = {};

  constructor(private filepath: string) {}

  async load() {
    try {
      const content = await fs.readFile(this.filepath, 'utf-8');
      this.data = JSON.parse(content);
    } catch {
      this.data = {};
    }
  }

  async save() {
    try {
      await fs.mkdir(path.dirname(this.filepath), { recursive: true });
      await fs.writeFile(this.filepath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error(`[Loader] Failed to save config to ${this.filepath}:`, err);
    }
  }

  get<T>(key: string): T | undefined;
  get<T>(key: string, defaultValue: T): T;
  get<T>(key: string, defaultValue?: T): T | undefined {
    return this.data[key] !== undefined ? this.data[key] : defaultValue;
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.data[key] = value;
    await this.save();
  }

  async delete(key: string): Promise<void> {
    delete this.data[key];
    await this.save();
  }

  all(): Record<string, any> {
    return { ...this.data };
  }
}
