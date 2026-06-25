import chalk from 'chalk';
import path from 'path';
import { findProjectRoot } from './list.js';
import { DependencyResolver } from '../registry/DependencyResolver.js';

export async function installCommand(repoUrl: string, options: { force?: boolean }) {
  if (!repoUrl) {
    console.error(chalk.red('Error: Please specify a repository URL to install (e.g. github:user/repo).'));
    process.exit(1);
  }

  const projectRoot = await findProjectRoot();
  const pluginsDir = path.join(projectRoot, 'plugins');

  console.log(chalk.blue(`Installing plugin from ${repoUrl}...`));

  try {
    const installed = await DependencyResolver.installPlugin(repoUrl, pluginsDir, {
      force: options.force
    });

    if (installed.length === 0) {
      console.log(chalk.yellow('\nNo new plugins were installed.'));
      return;
    }

    console.log(chalk.green(`\nSuccessfully installed ${installed.length} plugin(s):`));
    for (const item of installed) {
      console.log(chalk.green(`  - ${item.name} (${item.version}) [Commit: ${item.commitSha.substring(0, 7)}]`));
    }
  } catch (err: any) {
    console.error(chalk.red(`\nInstallation failed: ${err.message || err}`));
    process.exit(1);
  }
}
