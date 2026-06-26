import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const yaml = require(require.resolve('yaml', { paths: [process.cwd()] }));

export async function discoverPlugins(pluginsDir) {
  const resolvedDir = path.resolve(pluginsDir);
  const plugins = [];

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
          const manifest = yaml.parse(rawYaml);
          
          if (!manifest || !manifest.name) {
            console.error(`[App Loader] Skip plugin in ${entry.name}: missing name`);
            continue;
          }

          if (manifest.targets && manifest.targets.app) {
            plugins.push({
              name: manifest.name,
              manifest,
              pluginDir: pluginPath,
            });
          }
        } catch (err) {
          console.error(`[App Loader] Failed to read manifest in ${entry.name}:`, err);
        }
      }
    }
  } catch (err) {
    console.warn(`[App Loader] Warning: Failed to read plugins directory at '${resolvedDir}':`, err);
  }

  return plugins;
}
