import { promises as fs } from 'fs';
import path from 'path';
import chalk from 'chalk';
import yaml from 'yaml';

export async function listCommand() {
  const projectRoot = await findProjectRoot();
  const pluginsDir = path.join(projectRoot, 'plugins');

  try {
    const entries = await fs.readdir(pluginsDir, { withFileTypes: true });
    const plugins = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const pluginPath = path.join(pluginsDir, entry.name);
        let manifestPath = path.join(pluginPath, 'fluxer-plugin.yaml');
        try {
          await fs.access(manifestPath);
        } catch {
          manifestPath = path.join(pluginPath, 'fluxer-plugin.yml');
          try {
            await fs.access(manifestPath);
          } catch {
            continue; // Skip directory if it doesn't have a manifest
          }
        }

        try {
          const rawYaml = await fs.readFile(manifestPath, 'utf-8');
          const manifest = yaml.parse(rawYaml);
          const targets = Object.keys(manifest.targets || {}).join(', ');
          plugins.push({
            name: manifest.name || entry.name,
            version: manifest.version || '1.0.0',
            targets: targets || 'none',
            description: manifest.description || '',
          });
        } catch {}
      }
    }

    if (plugins.length === 0) {
      console.log(chalk.yellow('No plugins found in the plugins/ directory.'));
      return;
    }

    console.log(chalk.bold('\nInstalled Plugins:'));
    console.log(chalk.gray('─'.repeat(80)));
    for (const p of plugins) {
      console.log(`${chalk.green(p.name.padEnd(25))} ${chalk.cyan(p.version.padEnd(8))} [${chalk.yellow(p.targets)}]`);
      if (p.description) {
        console.log(chalk.dim(`  ${p.description}`));
      }
      console.log(chalk.gray('─'.repeat(80)));
    }
  } catch (err) {
    console.log(chalk.yellow('No plugins directory found at project root. Make sure to run inside the fluxer-fork project.'));
  }
}

async function findProjectRoot(startDir = process.cwd()): Promise<string> {
  let current = startDir;
  while (true) {
    try {
      const pkgPath = path.join(current, 'package.json');
      const pkgContent = await fs.readFile(pkgPath, 'utf-8');
      const pkg = JSON.parse(pkgContent);
      if (pkg.name === 'fluxer') {
        return current;
      }
    } catch {}

    const parent = path.dirname(current);
    if (parent === current) {
      // Hit root
      return process.cwd();
    }
    current = parent;
  }
}
export { findProjectRoot };
