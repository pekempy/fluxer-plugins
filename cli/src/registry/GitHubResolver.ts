import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import path from 'path';
import chalk from 'chalk';

const execAsync = promisify(exec);

export interface ParsedRepo {
  url: string;
  ref?: string;
  owner: string;
  name: string;
}

export class GitHubResolver {
  /**
   * Parses a repository string into its URL, ref, owner, and name.
   * Supports:
   * - github:owner/repo[@ref]
   * - https://github.com/owner/repo[@ref]
   * - git@github.com:owner/repo[@ref]
   */
  public static parseUrl(repoStr: string): ParsedRepo {
    let cleanStr = repoStr.trim();
    let ref: string | undefined;

    // Extract @ref if present
    const atIndex = cleanStr.lastIndexOf('@');
    // Ensure the @ is not part of git@github.com
    if (atIndex !== -1 && atIndex > 10) {
      ref = cleanStr.substring(atIndex + 1);
      cleanStr = cleanStr.substring(0, atIndex);
    }

    let url = '';
    let owner = '';
    let name = '';

    if (cleanStr.startsWith('github:')) {
      const match = cleanStr.match(/^github:([^/]+)\/(.+)$/);
      if (!match) {
        throw new Error(`Invalid github format: ${repoStr}`);
      }
      owner = match[1];
      name = match[2].replace(/\.git$/, '');
      url = `https://github.com/${owner}/${name}.git`;
    } else if (cleanStr.startsWith('https://github.com/')) {
      const match = cleanStr.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)$/);
      if (!match) {
        throw new Error(`Invalid HTTPS github format: ${repoStr}`);
      }
      owner = match[1];
      name = match[2].replace(/\.git$/, '');
      url = cleanStr;
    } else if (cleanStr.startsWith('git@github.com:')) {
      const match = cleanStr.match(/^git@github\.com:([^/]+)\/(.+)$/);
      if (!match) {
        throw new Error(`Invalid SSH github format: ${repoStr}`);
      }
      owner = match[1];
      name = match[2].replace(/\.git$/, '');
      url = cleanStr;
    } else {
      // Fallback to assuming github:owner/repo if it's owner/repo
      const match = cleanStr.match(/^([^/]+)\/(.+)$/);
      if (match) {
        owner = match[1];
        name = match[2].replace(/\.git$/, '');
        url = `https://github.com/${owner}/${name}.git`;
      } else {
        throw new Error(`Unrecognized repository URL format: ${repoStr}`);
      }
    }

    return { url, ref, owner, name };
  }

  /**
   * Clones a repository to a target directory.
   */
  public static async clone(repoStr: string, targetDir: string): Promise<{ commitSha: string }> {
    const { url, ref } = this.parseUrl(repoStr);

    // Ensure parent directory exists
    await fs.mkdir(path.dirname(targetDir), { recursive: true });

    // Clean target dir if it exists
    try {
      await fs.rm(targetDir, { recursive: true, force: true });
    } catch {}

    console.log(chalk.blue(`Cloning ${url}${ref ? ` (ref: ${ref})` : ''} into ${targetDir}...`));
    
    // We clone using git CLI.
    try {
      const cloneCmd = ref 
        ? `git clone --depth 1 --branch ${ref} ${url} "${targetDir}"`
        : `git clone --depth 1 ${url} "${targetDir}"`;
      
      await execAsync(cloneCmd);
    } catch (err: any) {
      // If shallow clone failed, try a regular clone and check out the ref
      if (ref) {
        try {
          console.log(chalk.yellow(`Shallow clone failed. Trying full clone...`));
          await execAsync(`git clone ${url} "${targetDir}"`);
          await execAsync(`git checkout ${ref}`, { cwd: targetDir });
        } catch (innerErr: any) {
          throw new Error(`Failed to clone git repository ${url}: ${innerErr.message || innerErr}`);
        }
      } else {
        throw new Error(`Failed to clone git repository ${url}: ${err.message || err}`);
      }
    }

    // Get the HEAD commit SHA
    try {
      const { stdout } = await execAsync('git rev-parse HEAD', { cwd: targetDir });
      return { commitSha: stdout.trim() };
    } catch (err: any) {
      throw new Error(`Failed to get commit SHA from cloned repository: ${err.message || err}`);
    }
  }

  /**
   * Runs git pull in an existing repository.
   */
  public static async update(targetDir: string): Promise<{ commitSha: string; updated: boolean }> {
    try {
      // Get current SHA
      const beforeRes = await execAsync('git rev-parse HEAD', { cwd: targetDir });
      const beforeSha = beforeRes.stdout.trim();

      console.log(chalk.blue(`Updating repository at ${targetDir}...`));
      await execAsync('git pull', { cwd: targetDir });

      // Get new SHA
      const afterRes = await execAsync('git rev-parse HEAD', { cwd: targetDir });
      const afterSha = afterRes.stdout.trim();

      return {
        commitSha: afterSha,
        updated: beforeSha !== afterSha
      };
    } catch (err: any) {
      throw new Error(`Failed to update git repository: ${err.message || err}`);
    }
  }
}
