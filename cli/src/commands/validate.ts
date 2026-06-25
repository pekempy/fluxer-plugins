import { promises as fs } from 'fs';
import path from 'path';
import chalk from 'chalk';
import yaml from 'yaml';
import { PluginManifestSchema } from '@pekempy/fluxer-plugin-sdk/manifest';

export async function validateCommand(pluginPathArg: string) {
  const pluginDir = path.resolve(process.cwd(), pluginPathArg);
  console.log(chalk.blue(`Validating plugin at ${pluginDir}...`));

  let manifestPath = path.join(pluginDir, 'fluxer-plugin.yaml');
  try {
    await fs.access(manifestPath);
  } catch {
    manifestPath = path.join(pluginDir, 'fluxer-plugin.yml');
    try {
      await fs.access(manifestPath);
    } catch {
      console.error(chalk.red('Error: fluxer-plugin.yaml not found.'));
      process.exit(1);
    }
  }

  try {
    const rawYaml = await fs.readFile(manifestPath, 'utf-8');
    const parsed = yaml.parse(rawYaml);

    // Validate using Zod schema
    const result = PluginManifestSchema.safeParse(parsed);
    if (!result.success) {
      console.error(chalk.red('Validation Errors in manifest:'));
      for (const error of result.error.errors) {
        console.error(chalk.red(`  - [${error.path.join('.')}] ${error.message}`));
      }
      process.exit(1);
    }

    const manifest = result.data;
    console.log(chalk.green(`✔ Manifest is valid. (Name: ${manifest.name}, Version: ${manifest.version})`));

    // Verify files declared in manifest exist
    let filesValid = true;

    if (manifest.targets) {
      const { api, app, admin } = manifest.targets;

      if (api) {
        if (api.middleware) {
          for (const mw of api.middleware) {
            filesValid = (await verifyFileExists(pluginDir, mw.file, 'API Middleware')) && filesValid;
          }
        }
        if (api.routes) {
          for (const rt of api.routes) {
            filesValid = (await verifyFileExists(pluginDir, rt.file, 'API Route')) && filesValid;
          }
        }
        if (api.services) {
          for (const svc of api.services) {
            filesValid = (await verifyFileExists(pluginDir, svc.file, 'API Service Decorator')) && filesValid;
          }
        }
        if (api.hooks) {
          for (const hk of api.hooks) {
            filesValid = (await verifyFileExists(pluginDir, hk.handler, 'API Event Hook')) && filesValid;
          }
        }
      }

      if (app) {
        if (app.components) {
          for (const comp of app.components) {
            filesValid = (await verifyFileExists(pluginDir, comp.wrapper, 'App Component Wrapper')) && filesValid;
          }
        }
        if (app.features) {
          for (const feat of app.features) {
            filesValid = (await verifyDirectoryExists(pluginDir, feat.directory, 'App Feature Dir')) && filesValid;
          }
        }
        if (app.stores) {
          for (const st of app.stores) {
            filesValid = (await verifyFileExists(pluginDir, st.decorator, 'App Store Decorator')) && filesValid;
          }
        }
        if (app.routes) {
          for (const rt of app.routes) {
            filesValid = (await verifyFileExists(pluginDir, rt.component, 'App Route Component')) && filesValid;
          }
        }
        if (app.styles) {
          for (const st of app.styles) {
            filesValid = (await verifyFileExists(pluginDir, st.file, 'App Style File')) && filesValid;
          }
        }
      }

      if (admin) {
        if (admin.injections) {
          for (const inj of admin.injections) {
            // Fragment can be inline HTML or path to file. Check if it is path
            if (inj.fragment.startsWith('.') || inj.fragment.startsWith('/')) {
              filesValid = (await verifyFileExists(pluginDir, inj.fragment, 'Admin HTML Fragment')) && filesValid;
            }
          }
        }
        if (admin.pages) {
          for (const pg of admin.pages) {
            filesValid = (await verifyFileExists(pluginDir, pg.handler, 'Admin Page Handler')) && filesValid;
          }
        }
        if (admin.settings) {
          for (const st of admin.settings) {
            filesValid = (await verifyFileExists(pluginDir, st.handler, 'Admin Settings Handler')) && filesValid;
          }
        }
        if (admin.interceptors) {
          for (const ic of admin.interceptors) {
            filesValid = (await verifyFileExists(pluginDir, ic.handler, 'Admin Response Interceptor')) && filesValid;
          }
        }
        if (admin.api) {
          for (const apiRoute of admin.api) {
            filesValid = (await verifyFileExists(pluginDir, apiRoute.handler, 'Admin API Handler')) && filesValid;
          }
        }
      }
    }

    if (filesValid) {
      console.log(chalk.green('✔ All target files and directories exist.'));
      console.log(chalk.green('\nPlugin is valid! 🎉'));
    } else {
      console.error(chalk.red('\nError: Some files declared in the manifest are missing.'));
      process.exit(1);
    }
  } catch (err) {
    console.error(chalk.red('Validation failed:'), err);
    process.exit(1);
  }
}

async function verifyFileExists(pluginDir: string, relativePath: string, type: string): Promise<boolean> {
  const fullPath = path.join(pluginDir, relativePath);
  try {
    const stat = await fs.stat(fullPath);
    if (!stat.isFile()) {
      console.error(chalk.red(`  - [${type}] Path '${relativePath}' exists but is not a file.`));
      return false;
    }
    return true;
  } catch {
    // Check if it's missing extension in manifest but exists as .ts / .tsx
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    for (const ext of extensions) {
      try {
        const stat = await fs.stat(fullPath + ext);
        if (stat.isFile()) return true;
      } catch {}
    }
    console.error(chalk.red(`  - [${type}] File not found: '${relativePath}'`));
    return false;
  }
}

async function verifyDirectoryExists(pluginDir: string, relativePath: string, type: string): Promise<boolean> {
  const fullPath = path.join(pluginDir, relativePath);
  try {
    const stat = await fs.stat(fullPath);
    if (!stat.isDirectory()) {
      console.error(chalk.red(`  - [${type}] Path '${relativePath}' exists but is not a directory.`));
      return false;
    }
    return true;
  } catch {
    console.error(chalk.red(`  - [${type}] Directory not found: '${relativePath}'`));
    return false;
  }
}
