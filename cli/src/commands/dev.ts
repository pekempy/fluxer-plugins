import { promises as fs } from 'fs';
import path from 'path';
import chalk from 'chalk';
import { spawn } from 'child_process';
import { findProjectRoot } from './list.js';

interface WatcherProcess {
  name: string;
  process: any;
}

export async function devCommand(options: { watch?: boolean }) {
  const projectRoot = await findProjectRoot();
  const pluginsDir = path.join(projectRoot, 'plugins');

  console.log(chalk.bold.blue('=== Fluxer Plugin Dev Coordinator ==='));
  console.log(chalk.blue(`Watching plugins directory at: ${pluginsDir}\n`));

  const activeWatchers = new Map<string, WatcherProcess>();

  // Helper to start compilation watcher for a plugin
  async function startPluginWatcher(pluginName: string) {
    const pluginPath = path.join(pluginsDir, pluginName);
    
    // Check if tsconfig.json exists
    try {
      await fs.access(path.join(pluginPath, 'tsconfig.json'));
    } catch {
      // No TypeScript config, nothing to watch compile
      return;
    }

    if (activeWatchers.has(pluginName)) return;

    console.log(chalk.yellow(`[System] Starting watcher for '${pluginName}'...`));

    // Try to run 'pnpm run dev' or fallback to 'npx tsc --watch'
    let cmd = 'npx';
    let args = ['tsc', '--watch', '--preserveWatchOutput'];

    try {
      const pkgContent = await fs.readFile(path.join(pluginPath, 'package.json'), 'utf-8');
      const pkg = JSON.parse(pkgContent);
      if (pkg.scripts && pkg.scripts.dev) {
        cmd = 'pnpm';
        args = ['run', 'dev'];
      }
    } catch {}

    const child = spawn(cmd, args, {
      cwd: pluginPath,
      shell: true,
      stdio: 'pipe',
    });

    child.stdout.on('data', (data) => {
      const lines = data.toString().trim().split('\n');
      for (const line of lines) {
        if (line) {
          console.log(`${chalk.cyan(`[${pluginName}]`)} ${line}`);
        }
      }
    });

    child.stderr.on('data', (data) => {
      const lines = data.toString().trim().split('\n');
      for (const line of lines) {
        if (line) {
          console.error(`${chalk.red(`[${pluginName} Error]`)} ${line}`);
        }
      }
    });

    child.on('close', (code) => {
      console.log(chalk.yellow(`[System] Watcher for '${pluginName}' exited with code ${code}`));
      activeWatchers.delete(pluginName);
    });

    activeWatchers.set(pluginName, {
      name: pluginName,
      process: child,
    });
  }

  // Scan and start watchers
  async function scanAndWatch() {
    try {
      const entries = await fs.readdir(pluginsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          await startPluginWatcher(entry.name);
        }
      }
    } catch (err) {
      // plugins directory might not exist yet
    }
  }

  // Initial scan
  await scanAndWatch();

  // Watch for new directories if requested
  let intervalId: NodeJS.Timeout | undefined;
  if (options.watch !== false) {
    console.log(chalk.gray('[System] Monitoring for new/deleted plugin folders...'));
    intervalId = setInterval(async () => {
      await scanAndWatch();
    }, 3000);
  }

  // Cleanup on exit
  function cleanup() {
    console.log(chalk.blue('\nShutting down dev watchers...'));
    if (intervalId) clearInterval(intervalId);
    
    for (const [name, watcher] of activeWatchers.entries()) {
      console.log(chalk.gray(`Stopping watcher for '${name}'...`));
      watcher.process.kill('SIGTERM');
    }
    process.exit(0);
  }

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  // Keep alive
  await new Promise(() => {});
}
