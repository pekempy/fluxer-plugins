import { promises as fs } from 'fs';
import path from 'path';
import chalk from 'chalk';
import { findProjectRoot } from './list.js';
import { PluginLock } from '../registry/PluginLock.js';

export async function uninstallCommand(name: string, options: { force?: boolean }) {
  if (!name) {
    console.error(chalk.red('Error: Please specify the name of the plugin to uninstall.'));
    process.exit(1);
  }

  const projectRoot = await findProjectRoot();
  const pluginsDir = path.join(projectRoot, 'plugins');
  const targetDir = path.join(pluginsDir, name);

  // Check if directory exists
  try {
    const stat = await fs.stat(targetDir);
    if (!stat.isDirectory()) {
      console.error(chalk.red(`Error: '${name}' is not a directory.`));
      process.exit(1);
    }
  } catch {
    console.error(chalk.red(`Error: Plugin '${name}' is not installed.`));
    process.exit(1);
  }

  // Check dependencies/dependents in lockfile
  const lockData = await PluginLock.load(pluginsDir);
  const dependents: string[] = [];

  for (const [pluginName, pluginInfo] of Object.entries(lockData.plugins)) {
    if (pluginName === name) continue;
    
    const hasDep = pluginInfo.dependencies.some(dep => {
      // Extract name from dependency URL/spec
      if (dep.startsWith('github:')) {
        const parts = dep.substring(7).split('/');
        if (parts.length > 1) {
          const repoName = parts[1].split('@')[0];
          return repoName === name;
        }
      }
      return dep === name;
    });

    if (hasDep) {
      dependents.push(pluginName);
    }
  }

  if (dependents.length > 0 && !options.force) {
    console.error(chalk.red(`Error: Cannot uninstall '${name}'. The following plugins depend on it:`));
    for (const dep of dependents) {
      console.error(chalk.red(`  - ${dep}`));
    }
    console.error(chalk.yellow('Use --force to bypass this check and uninstall anyway.'));
    process.exit(1);
  }

  console.log(chalk.blue(`Uninstalling plugin '${name}'...`));

  try {
    await fs.rm(targetDir, { recursive: true, force: true });
    await PluginLock.removePlugin(pluginsDir, name);
    console.log(chalk.green(`✔ Successfully uninstalled '${name}'`));
  } catch (err: any) {
    console.error(chalk.red(`Failed to uninstall plugin: ${err.message}`));
    process.exit(1);
  }
}
