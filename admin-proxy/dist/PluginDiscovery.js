import { promises as fs } from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';
import { PluginManifestSchema } from '@pekempy/fluxer-plugin-sdk/manifest';
// Context implementation for admin proxy
class JsonConfigStore {
    filepath;
    data = {};
    constructor(filepath) {
        this.filepath = filepath;
    }
    async load() {
        try {
            const content = await fs.readFile(this.filepath, 'utf-8');
            this.data = JSON.parse(content);
        }
        catch {
            this.data = {};
        }
    }
    async save() {
        try {
            await fs.mkdir(path.dirname(this.filepath), { recursive: true });
            await fs.writeFile(this.filepath, JSON.stringify(this.data, null, 2), 'utf-8');
        }
        catch (err) {
            console.error(`[Admin Proxy] Failed to save config to ${this.filepath}:`, err);
        }
    }
    get(key, defaultValue) {
        return this.data[key] !== undefined ? this.data[key] : defaultValue;
    }
    async set(key, value) {
        this.data[key] = value;
        await this.save();
    }
    async delete(key) {
        delete this.data[key];
        await this.save();
    }
    all() {
        return { ...this.data };
    }
}
export async function discoverPlugins(pluginsDir, forceReload = false) {
    const resolvedDir = path.resolve(pluginsDir);
    const pluginsMap = new Map();
    try {
        const entries = await fs.readdir(resolvedDir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory()) {
                const pluginPath = path.join(resolvedDir, entry.name);
                let manifestPath = path.join(pluginPath, 'fluxer-plugin.yaml');
                try {
                    await fs.access(manifestPath);
                }
                catch {
                    manifestPath = path.join(pluginPath, 'fluxer-plugin.yml');
                    try {
                        await fs.access(manifestPath);
                    }
                    catch {
                        continue; // Not a plugin
                    }
                }
                try {
                    const rawYaml = await fs.readFile(manifestPath, 'utf-8');
                    const parsed = yaml.parse(rawYaml);
                    const result = PluginManifestSchema.safeParse(parsed);
                    if (!result.success) {
                        console.error(`[Admin Proxy] Invalid manifest for plugin '${entry.name}':`);
                        for (const error of result.error.errors) {
                            console.error(`  - [${error.path.join('.')}] ${error.message}`);
                        }
                        continue;
                    }
                    const manifest = result.data;
                    // Only load if it has admin targets
                    if (manifest.targets && manifest.targets.admin) {
                        pluginsMap.set(manifest.name, { manifest, dir: pluginPath });
                    }
                }
                catch (err) {
                    console.error(`[Admin Proxy] Failed to read plugin manifest in '${entry.name}':`, err);
                }
            }
        }
    }
    catch (err) {
        console.warn(`[Admin Proxy] Warning: Failed to read plugins directory at '${resolvedDir}':`, err);
        return [];
    }
    const loadedPlugins = [];
    for (const [name, info] of pluginsMap.entries()) {
        try {
            const configStore = new JsonConfigStore(path.join(resolvedDir, 'config', `${name}.json`));
            await configStore.load();
            // Check if plugin exports an init/shutdown hook in dist/index.js
            let lifecycle = {};
            const entrypointPath = path.join(info.dir, 'dist', 'index.js');
            try {
                await fs.access(entrypointPath);
                // Add cache-buster if forceReload is set
                const fileUrl = forceReload
                    ? `file://${entrypointPath}?t=${Date.now()}`
                    : `file://${entrypointPath}`;
                const pluginModule = await import(fileUrl);
                lifecycle = pluginModule.default || pluginModule;
            }
            catch { }
            const context = {
                name,
                manifest: info.manifest,
                logger: {
                    info: (...args) => console.log(`[Plugin:${name}]`, ...args),
                    warn: (...args) => console.warn(`[Plugin:${name}]`, ...args),
                    error: (...args) => console.error(`[Plugin:${name}]`, ...args),
                    debug: (...args) => console.debug(`[Plugin:${name}]`, ...args),
                    fatal: (...args) => console.error(`[Plugin:${name}] [FATAL]`, ...args),
                },
                config: configStore,
                pluginDir: info.dir,
                getPluginApi: async () => null,
            };
            loadedPlugins.push({
                name,
                manifest: info.manifest,
                context: context,
                module: lifecycle,
                pluginDir: info.dir,
            });
            console.log(`[Admin Proxy] Loaded plugin '${name}'`);
        }
        catch (err) {
            console.error(`[Admin Proxy] Error: Failed to load plugin '${name}':`, err);
        }
    }
    return loadedPlugins;
}
//# sourceMappingURL=PluginDiscovery.js.map