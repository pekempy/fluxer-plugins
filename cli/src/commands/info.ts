import { promises as fs } from 'fs';
import path from 'path';
import chalk from 'chalk';
import yaml from 'yaml';
import { findProjectRoot } from './list.js';

export async function infoCommand(name: string) {
  const projectRoot = await findProjectRoot();
  const pluginDir = path.join(projectRoot, 'plugins', name);

  let manifestPath = path.join(pluginDir, 'fluxer-plugin.yaml');
  try {
    await fs.access(manifestPath);
  } catch {
    manifestPath = path.join(pluginDir, 'fluxer-plugin.yml');
    try {
      await fs.access(manifestPath);
    } catch {
      // Check if the argument was a direct path instead of name
      const directDir = path.resolve(process.cwd(), name);
      manifestPath = path.join(directDir, 'fluxer-plugin.yaml');
      try {
        await fs.access(manifestPath);
      } catch {
        manifestPath = path.join(directDir, 'fluxer-plugin.yml');
        try {
          await fs.access(manifestPath);
        } catch {
          console.error(chalk.red(`Error: Plugin '${name}' not found under plugins/ or as a direct path.`));
          process.exit(1);
        }
      }
    }
  }

  try {
    const rawYaml = await fs.readFile(manifestPath, 'utf-8');
    const manifest = yaml.parse(rawYaml);

    console.log(chalk.bold(`\nPlugin Details: ${chalk.green(manifest.name)}`));
    console.log(chalk.gray('─'.repeat(80)));
    console.log(`${chalk.cyan('Version:')}      ${manifest.version}`);
    if (manifest.description) {
      console.log(`${chalk.cyan('Description:')}  ${manifest.description}`);
    }
    if (manifest.author) {
      console.log(`${chalk.cyan('Author:')}       ${manifest.author}`);
    }
    if (manifest.license) {
      console.log(`${chalk.cyan('License:')}      ${manifest.license}`);
    }
    if (manifest.repository) {
      console.log(`${chalk.cyan('Repository:')}   ${manifest.repository}`);
    }
    if (manifest.dependencies && manifest.dependencies.length > 0) {
      console.log(`${chalk.cyan('Dependencies:')} ${manifest.dependencies.join(', ')}`);
    }
    if (manifest.tested_with) {
      console.log(`${chalk.cyan('Tested With:')}  ${manifest.tested_with}`);
    }

    if (manifest.targets) {
      console.log(chalk.bold('\nExtension Targets:'));
      const { api, app, admin } = manifest.targets;

      if (api) {
        console.log(chalk.yellow('\n  API:'));
        if (api.middleware) {
          console.log(chalk.gray('    Middleware Injections:'));
          for (const mw of api.middleware) {
            console.log(`      - ${mw.file} (${mw.position})`);
          }
        }
        if (api.routes) {
          console.log(chalk.gray('    Custom Route Modules:'));
          for (const rt of api.routes) {
            console.log(`      - ${rt.file} mounted under ${rt.prefix}`);
          }
        }
        if (api.services) {
          console.log(chalk.gray('    Service Decorators:'));
          for (const svc of api.services) {
            console.log(`      - ${svc.file} (decorates: ${svc.decorates})`);
          }
        }
        if (api.hooks) {
          console.log(chalk.gray('    Event Hook Handlers:'));
          for (const hk of api.hooks) {
            console.log(`      - ${hk.file} (listens: ${hk.event})`);
          }
        }
      }

      if (app) {
        console.log(chalk.yellow('\n  App (Frontend):'));
        if (app.components) {
          console.log(chalk.gray('    React Component Wrappers:'));
          for (const comp of app.components) {
            console.log(`      - ${comp.wrapper} (wraps: ${comp.target})`);
          }
        }
        if (app.features) {
          console.log(chalk.gray('    Custom App Feature Modules:'));
          for (const feat of app.features) {
            console.log(`      - ${feat.directory}`);
          }
        }
        if (app.stores) {
          console.log(chalk.gray('    MobX Store Decorators:'));
          for (const st of app.stores) {
            console.log(`      - ${st.decorator} (decorates: ${st.target})`);
          }
        }
        if (app.routes) {
          console.log(chalk.gray('    Custom Routes:'));
          for (const rt of app.routes) {
            console.log(`      - ${rt.component} registered at ${rt.path} (parent: ${rt.parentRoute || 'root'})`);
          }
        }
        if (app.styles) {
          console.log(chalk.gray('    CSS Style Injections:'));
          for (const st of app.styles) {
            console.log(`      - ${st.file} (position: ${st.position || 'last'})`);
          }
        }
      }

      if (admin) {
        console.log(chalk.yellow('\n  Admin Panel:'));
        if (admin.injections) {
          console.log(chalk.gray('    HTML Selector Injections:'));
          for (const inj of admin.injections) {
            console.log(`      - Inject ${inj.fragment} via '${inj.position}' into selector '${inj.selector}'`);
          }
        }
        if (admin.pages) {
          console.log(chalk.gray('    Admin Custom Pages:'));
          for (const pg of admin.pages) {
            console.log(`      - Route ${pg.path} handled by ${pg.handler}`);
            if (pg.nav) {
              console.log(`        Nav label: "${pg.nav.label}" in section "${pg.nav.section || 'plugins'}"`);
            }
          }
        }
        if (admin.settings) {
          console.log(chalk.gray('    Admin Settings Panels:'));
          for (const st of admin.settings) {
            console.log(`      - Settings for plugin at ${st.path} handled by ${st.handler}`);
          }
        }
        if (admin.interceptors) {
          console.log(chalk.gray('    Admin Response Interceptors:'));
          for (const ic of admin.interceptors) {
            console.log(`      - Intercept route ${ic.route} using ${ic.handler}`);
          }
        }
        if (admin.api) {
          console.log(chalk.gray('    Admin API Handlers:'));
          for (const apiRoute of admin.api) {
            console.log(`      - [${apiRoute.method}] ${apiRoute.path} handled by ${apiRoute.handler}`);
          }
        }
      }
    }
    console.log(chalk.gray('─'.repeat(80)));
  } catch (err) {
    console.error(chalk.red('Failed to read plugin details:'), err);
    process.exit(1);
  }
}
