import { promises as fs } from 'fs';
import path from 'path';
import chalk from 'chalk';
import { findProjectRoot } from './list.js';
import { GitHubResolver } from '../registry/GitHubResolver.js';
import { PluginLock } from '../registry/PluginLock.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function updateCommand(nameArg?: string, options: { all?: boolean } = {}) {
  const projectRoot = await findProjectRoot();
  const pluginsDir = path.join(projectRoot, 'plugins');

  const lockData = await PluginLock.load(pluginsDir);
  const installedPlugins = Object.keys(lockData.plugins);

  if (installedPlugins.length === 0) {
    console.log(chalk.yellow('No plugins in lockfile. Nothing to update.'));
    return;
  }

  let targets: string[] = [];

  if (nameArg) {
    if (!installedPlugins.includes(nameArg)) {
      console.error(chalk.red(`Error: Plugin '${nameArg}' is not tracked in the lockfile.`));
      process.exit(1);
    }
    targets = [nameArg];
  } else if (options.all) {
    targets = installedPlugins;
  } else {
    console.error(chalk.red('Error: Specify a plugin name to update, or use the --all flag to update all.'));
    process.exit(1);
  }

  console.log(chalk.blue(`Updating ${targets.length} plugin(s)...`));

  for (const name of targets) {
    const pluginDir = path.join(pluginsDir, name);
    const info = lockData.plugins[name];

    try {
      console.log(chalk.blue(`\nUpdating '${name}' at ${pluginDir}...`));
      
      // Pull latest using GitHubResolver
      const { commitSha, updated } = await GitHubResolver.update(pluginDir);

      if (!updated) {
        console.log(chalk.green(`✔ '${name}' is already up-to-date.`));
        continue;
      }

      // Run pnpm install
      try {
        await fs.access(path.join(pluginDir, 'package.json'));
        console.log(chalk.blue(`Re-installing npm packages for '${name}'...`));
        await execAsync('pnpm install --ignore-workspace', { cwd: pluginDir });
      } catch {}

      // Re-build
      console.log(chalk.blue(`Re-compiling '${name}'...`));
      try {
        await execAsync('pnpm run build', { cwd: pluginDir });
      } catch {
        try {
          await execAsync('npx tsc', { cwd: pluginDir });
        } catch {
          console.warn(chalk.yellow(`Warning: Could not compile '${name}'.`));
        }
      }

      // Update lockfile
      info.commit = commitSha;
      await PluginLock.addPlugin(pluginsDir, info);

      console.log(chalk.green(`✔ Successfully updated '${name}' to commit ${commitSha.substring(0, 7)}`));

    } catch (err: any) {
      console.error(chalk.red(`Error updating '${name}': ${err.message || err}`));
    }
  }
}
