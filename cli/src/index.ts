#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { promises as fs } from 'fs';
import path from 'path';

// Command handlers
import { initCommand } from './commands/init.js';
import { validateCommand } from './commands/validate.js';
import { listCommand } from './commands/list.js';
import { buildCommand } from './commands/build.js';
import { infoCommand } from './commands/info.js';
import { installCommand } from './commands/install.js';
import { uninstallCommand } from './commands/uninstall.js';
import { updateCommand } from './commands/update.js';
import { devCommand } from './commands/dev.js';

const program = new Command();

program
  .name('fluxer-plugin')
  .description('CLI tool for managing and developing Fluxer plugins')
  .version('0.1.0');

program
  .command('init')
  .argument('[name]', 'Name of the plugin')
  .description('Scaffold a new plugin')
  .option('-t, --target <targets>', 'Comma-separated list of targets (api, app, admin)')
  .action(initCommand);

program
  .command('validate')
  .argument('[path]', 'Path to the plugin directory', '.')
  .description('Validate plugin manifest and structure')
  .action(validateCommand);

program
  .command('list')
  .description('List installed plugins')
  .action(listCommand);

program
  .command('build')
  .argument('[path]', 'Path to the plugin directory', '.')
  .description('Build plugin source files (compiles TS)')
  .action(buildCommand);

program
  .command('info')
  .argument('<name>', 'Name of the plugin')
  .description('Show detailed information about a plugin')
  .action(infoCommand);

program
  .command('install')
  .argument('<repo>', 'GitHub repository URL (e.g. github:user/repo[@ref])')
  .option('-f, --force', 'Reinstall plugin if already exists')
  .description('Install a plugin from GitHub repository')
  .action(installCommand);

program
  .command('uninstall')
  .argument('<name>', 'Name of the plugin to uninstall')
  .option('-f, --force', 'Bypass dependent plugin safety check')
  .description('Uninstall a plugin')
  .action(uninstallCommand);

program
  .command('update')
  .argument('[name]', 'Name of the plugin to update')
  .option('-a, --all', 'Update all installed plugins')
  .description('Update plugin(s) from GitHub repository')
  .action(updateCommand);

program
  .command('dev')
  .option('--no-watch', 'Do not monitor for new folders')
  .description('Start dev mode with hot reload watcher')
  .action(devCommand);

program.parseAsync(process.argv).catch((err) => {
  console.error(chalk.red('Fatal error:'), err);
  process.exit(1);
});
