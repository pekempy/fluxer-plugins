import { promises as fs } from 'fs';
import path from 'path';
import chalk from 'chalk';
import yaml from 'yaml';
import { PluginManifestSchema, type PluginManifest } from '@pekempy/fluxer-plugin-sdk/manifest';
import { GitHubResolver } from './GitHubResolver.js';
import { PluginLock } from './PluginLock.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface InstallResult {
  name: string;
  version: string;
  source: string;
  commitSha: string;
  dir: string;
}

export class DependencyResolver {
  /**
   * Resolves and installs a plugin and all its dependencies recursively.
   */
  public static async installPlugin(
    sourceUrl: string,
    pluginsDir: string,
    options: { force?: boolean } = {}
  ): Promise<InstallResult[]> {
    const installed: InstallResult[] = [];
    const pendingSources = [sourceUrl];
    const visitedSources = new Set<string>();

    while (pendingSources.length > 0) {
      const currentSource = pendingSources.shift()!;
      if (visitedSources.has(currentSource)) {
        continue;
      }
      visitedSources.add(currentSource);

      // Create a temporary directory for cloning
      const tempId = `tmp-${Math.random().toString(36).substring(2, 9)}`;
      const tempDir = path.join(pluginsDir, tempId);

      try {
        // 1. Clone to temp directory
        const { commitSha } = await GitHubResolver.clone(currentSource, tempDir);

        // 2. Read and validate manifest
        let manifestPath = path.join(tempDir, 'fluxer-plugin.yaml');
        try {
          await fs.access(manifestPath);
        } catch {
          manifestPath = path.join(tempDir, 'fluxer-plugin.yml');
          try {
            await fs.access(manifestPath);
          } catch {
            throw new Error(`fluxer-plugin.yaml not found in repository: ${currentSource}`);
          }
        }

        const rawYaml = await fs.readFile(manifestPath, 'utf-8');
        const parsed = yaml.parse(rawYaml);
        const parseResult = PluginManifestSchema.safeParse(parsed);
        if (!parseResult.success) {
          throw new Error(
            `Invalid plugin manifest in ${currentSource}:\n` +
            parseResult.error.errors.map(e => `  - [${e.path.join('.')}] ${e.message}`).join('\n')
          );
        }

        const manifest = parseResult.data;
        const pluginName = manifest.name;
        const finalDir = path.join(pluginsDir, pluginName);

        // 3. Move from temp to final directory
        const exists = await this.dirExists(finalDir);
        if (exists && !options.force) {
          console.log(chalk.yellow(`Plugin '${pluginName}' is already installed at ${finalDir}. Use --force to reinstall.`));
          // Clean up temp dir
          await fs.rm(tempDir, { recursive: true, force: true });
          continue;
        }

        if (exists && options.force) {
          console.log(chalk.blue(`Replacing existing plugin '${pluginName}'...`));
          await fs.rm(finalDir, { recursive: true, force: true });
        }

        await fs.rename(tempDir, finalDir);
        console.log(chalk.green(`✔ Installed plugin '${pluginName}' to ${finalDir}`));

        // 4. Run pnpm install inside the plugin directory
        console.log(chalk.blue(`Installing npm packages for '${pluginName}'...`));
        try {
          // Check if package.json exists
          await fs.access(path.join(finalDir, 'package.json'));
          await execAsync('pnpm install --ignore-workspace', { cwd: finalDir });
          console.log(chalk.green(`✔ Installed npm packages for '${pluginName}'`));
        } catch {
          console.log(chalk.yellow(`No package.json found for '${pluginName}', skipping npm install.`));
        }

        // 5. Try compiling the plugin
        console.log(chalk.blue(`Compiling '${pluginName}'...`));
        try {
          await execAsync('pnpm run build', { cwd: finalDir });
          console.log(chalk.green(`✔ Compiled '${pluginName}'`));
        } catch (buildErr: any) {
          // If no build script, try tsc directly
          try {
            await execAsync('npx tsc', { cwd: finalDir });
            console.log(chalk.green(`✔ Compiled '${pluginName}' with tsc`));
          } catch {
            console.log(chalk.yellow(`Warning: Could not compile '${pluginName}'. Verify its build setup manually.`));
          }
        }

        // 6. Record in lockfile
        const deps = manifest.dependencies || [];
        await PluginLock.addPlugin(pluginsDir, {
          name: pluginName,
          source: currentSource,
          commit: commitSha,
          version: manifest.version || '1.0.0',
          dependencies: deps
        });

        installed.push({
          name: pluginName,
          version: manifest.version || '1.0.0',
          source: currentSource,
          commitSha,
          dir: finalDir
        });

        // 7. Add dependencies to pending sources
        for (const dep of deps) {
          if (dep.startsWith('github:') || dep.startsWith('https://github.com/') || dep.startsWith('git@github.com:')) {
            pendingSources.push(dep);
          } else {
            console.warn(chalk.yellow(`Warning: Dependency '${dep}' for plugin '${pluginName}' is not a valid repository URL.`));
          }
        }

      } catch (err: any) {
        // Clean up temp dir if it still exists
        try {
          await fs.rm(tempDir, { recursive: true, force: true });
        } catch {}
        throw err;
      }
    }

    return installed;
  }

  private static async dirExists(dirPath: string): Promise<boolean> {
    try {
      const stat = await fs.stat(dirPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }
}
