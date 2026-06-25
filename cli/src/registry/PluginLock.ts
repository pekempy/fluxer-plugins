import { promises as fs } from 'fs';
import path from 'path';
import chalk from 'chalk';

export interface LockedPlugin {
  name: string;
  source: string;
  commit: string;
  version: string;
  dependencies: string[];
}

export interface LockfileData {
  lockfileVersion: string;
  plugins: Record<string, LockedPlugin>;
}

export class PluginLock {
  private static getLockfilePath(pluginsDir: string): string {
    return path.join(pluginsDir, 'fluxer-plugins.lock');
  }

  /**
   * Loads the lockfile. Returns a default lockfile structure if it doesn't exist.
   */
  public static async load(pluginsDir: string): Promise<LockfileData> {
    const filePath = this.getLockfilePath(pluginsDir);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content) as LockfileData;
      // Ensure basic structure exists
      if (!data.plugins) data.plugins = {};
      if (!data.lockfileVersion) data.lockfileVersion = '1.0.0';
      return data;
    } catch {
      return {
        lockfileVersion: '1.0.0',
        plugins: {}
      };
    }
  }

  /**
   * Saves the lockfile.
   */
  public static async save(pluginsDir: string, data: LockfileData): Promise<void> {
    const filePath = this.getLockfilePath(pluginsDir);
    try {
      await fs.mkdir(pluginsDir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err: any) {
      console.error(chalk.red(`Failed to save lockfile: ${err.message}`));
    }
  }

  /**
   * Adds or updates a plugin entry in the lockfile.
   */
  public static async addPlugin(
    pluginsDir: string,
    plugin: LockedPlugin
  ): Promise<void> {
    const lock = await this.load(pluginsDir);
    lock.plugins[plugin.name] = plugin;
    await this.save(pluginsDir, lock);
  }

  /**
   * Removes a plugin entry from the lockfile.
   */
  public static async removePlugin(pluginsDir: string, name: string): Promise<void> {
    const lock = await this.load(pluginsDir);
    if (lock.plugins[name]) {
      delete lock.plugins[name];
      await this.save(pluginsDir, lock);
    }
  }
}
