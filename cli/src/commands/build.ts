import { promises as fs } from 'fs';
import path from 'path';
import chalk from 'chalk';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function buildCommand(pluginPathArg: string) {
  const pluginDir = path.resolve(process.cwd(), pluginPathArg);
  console.log(chalk.blue(`Building plugin at ${pluginDir}...`));

  // Check if tsconfig.json exists
  const tsconfigPath = path.join(pluginDir, 'tsconfig.json');
  try {
    await fs.access(tsconfigPath);
  } catch {
    console.error(chalk.red('Error: tsconfig.json not found in plugin directory.'));
    process.exit(1);
  }

  // Check if package.json exists
  const packageJsonPath = path.join(pluginDir, 'package.json');
  try {
    await fs.access(packageJsonPath);
  } catch {
    console.error(chalk.red('Error: package.json not found in plugin directory.'));
    process.exit(1);
  }

  try {
    console.log(chalk.gray('Running typescript compilation (tsc)...'));
    
    // We run tsc in the plugin directory. We use npx tsc to resolve the compiler.
    const { stdout, stderr } = await execPromise('npx tsc', { cwd: pluginDir });
    
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);

    console.log(chalk.green('✔ Build completed successfully!'));
  } catch (err: any) {
    console.error(chalk.red('Build failed:'));
    if (err.stdout) console.error(err.stdout);
    if (err.stderr) console.error(err.stderr);
    process.exit(1);
  }
}
