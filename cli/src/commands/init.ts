import { promises as fs } from 'fs';
import path from 'path';
import chalk from 'chalk';
import prompts from 'prompts';

interface InitOptions {
  target?: string;
}

export async function initCommand(nameArg: string | undefined, options: InitOptions) {
  let name = nameArg;
  let targets: string[] = [];

  if (!name) {
    const nameResponse = await prompts({
      type: 'text',
      name: 'value',
      message: 'What is the name of your plugin?',
      validate: (val) => /^[a-z0-9-_]+$/.test(val) || 'Plugin name must only contain lowercase alphanumeric characters, hyphens, and underscores.',
    });
    if (!nameResponse.value) {
      console.log(chalk.yellow('Scaffolding cancelled.'));
      return;
    }
    name = nameResponse.value;
  }

  if (options.target) {
    targets = options.target.split(',').map((t) => t.trim().toLowerCase());
  } else {
    const targetResponse = await prompts({
      type: 'multiselect',
      name: 'value',
      message: 'Select the targets you want to extend:',
      choices: [
        { title: 'API (Hono middleware/routes/services)', value: 'api', selected: true },
        { title: 'App (React components/stores/routes)', value: 'app', selected: true },
        { title: 'Admin Panel (Proxy pages/injections/settings)', value: 'admin', selected: false },
      ],
      min: 1,
    });
    if (!targetResponse.value) {
      console.log(chalk.yellow('Scaffolding cancelled.'));
      return;
    }
    targets = targetResponse.value;
  }

  if (!name) return;

  const pluginDir = path.resolve(process.cwd(), name);

  try {
    await fs.mkdir(pluginDir, { recursive: true });

    // 1. Create fluxer-plugin.yaml
    const manifestContent = generateManifest(name, targets);
    await fs.writeFile(path.join(pluginDir, 'fluxer-plugin.yaml'), manifestContent, 'utf-8');

    // 2. Create package.json
    const packageJsonContent = generatePackageJson(name);
    await fs.writeFile(path.join(pluginDir, 'package.json'), packageJsonContent, 'utf-8');

    // 3. Create tsconfig.json
    const tsconfigContent = generateTsconfig();
    await fs.writeFile(path.join(pluginDir, 'tsconfig.json'), tsconfigContent, 'utf-8');

    // 4. Scaffold folders and files per target
    if (targets.includes('api')) {
      await fs.mkdir(path.join(pluginDir, 'api', 'routes'), { recursive: true });
      await fs.mkdir(path.join(pluginDir, 'api', 'middleware'), { recursive: true });
      await fs.mkdir(path.join(pluginDir, 'api', 'services'), { recursive: true });
      await fs.mkdir(path.join(pluginDir, 'api', 'hooks'), { recursive: true });

      await fs.writeFile(
        path.join(pluginDir, 'api', 'routes', 'CustomEndpoints.ts'),
        generateApiRouteTemplate(),
        'utf-8'
      );
    }

    if (targets.includes('app')) {
      await fs.mkdir(path.join(pluginDir, 'app', 'components'), { recursive: true });
      await fs.mkdir(path.join(pluginDir, 'app', 'pages'), { recursive: true });
      await fs.mkdir(path.join(pluginDir, 'app', 'stores'), { recursive: true });
      await fs.mkdir(path.join(pluginDir, 'app', 'styles'), { recursive: true });

      await fs.writeFile(
        path.join(pluginDir, 'app', 'components', 'EnhancedMessageContent.tsx'),
        generateAppComponentTemplate(),
        'utf-8'
      );
    }

    if (targets.includes('admin')) {
      await fs.mkdir(path.join(pluginDir, 'admin', 'pages'), { recursive: true });
      await fs.mkdir(path.join(pluginDir, 'admin', 'fragments'), { recursive: true });
      await fs.mkdir(path.join(pluginDir, 'admin', 'settings'), { recursive: true });
      await fs.mkdir(path.join(pluginDir, 'admin', 'api'), { recursive: true });

      await fs.writeFile(
        path.join(pluginDir, 'admin', 'pages', 'analytics.ts'),
        generateAdminPageTemplate(),
        'utf-8'
      );
    }

    // 5. Create entrypoint if required
    await fs.writeFile(path.join(pluginDir, 'index.ts'), generateIndexTemplate(), 'utf-8');

    console.log(chalk.green(`\n✔ Plugin '${name}' successfully scaffolded at ${pluginDir}`));
    console.log('\nNext steps:');
    console.log(`  cd ${name}`);
    console.log('  pnpm install');
    console.log('  fluxer-plugin build');
  } catch (err) {
    console.error(chalk.red('Scaffolding failed:'), err);
  }
}

function generateManifest(name: string, targets: string[]): string {
  let yaml = `name: "${name}"
version: "1.0.0"
description: "Scaffolded Fluxer plugin"
author: "Author Name"
license: "MIT"

targets:
`;

  if (targets.includes('api')) {
    yaml += `  api:
    routes:
      - file: "./api/routes/CustomEndpoints.ts"
        prefix: "/v1/custom"
`;
  }
  if (targets.includes('app')) {
    yaml += `  app:
    components:
      - target: "features/messaging/components/MessageContent/MessageContent"
        wrapper: "./app/components/EnhancedMessageContent.tsx"
`;
  }
  if (targets.includes('admin')) {
    yaml += `  admin:
    pages:
      - path: "/plugins/${name}/analytics"
        handler: "./admin/pages/analytics.ts"
        nav:
          label: "Analytics Override"
          icon: "chart-bar"
          section: "plugins"
`;
  }

  return yaml;
}

function generatePackageJson(name: string): string {
  return JSON.stringify(
    {
      name: name,
      version: '1.0.0',
      description: 'A Fluxer plugin',
      type: 'module',
      scripts: {
        build: 'tsc',
        typecheck: 'tsc --noEmit',
      },
      dependencies: {
        '@pekempy/fluxer-plugin-sdk': 'link:../../sdk',
      },
      devDependencies: {
        '@types/node': '^24.0.4',
        '@types/react': '^19.0.0',
        'typescript': '^5.8.3',
      },
      peerDependencies: {
        hono: '^4.12.2',
        react: '^19.2.4',
      },
    },
    null,
    2
  );
}

function generateTsconfig(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2023',
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        declaration: true,
        sourceMap: true,
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        outDir: './dist',
        jsx: 'react-jsx',
      },
      include: ['**/*.ts', '**/*.tsx'],
      exclude: ['node_modules', 'dist'],
    },
    null,
    2
  );
}

function generateApiRouteTemplate(): string {
  return `import { createRoute } from '@pekempy/fluxer-plugin-sdk/helpers/api';

export default createRoute({
  prefix: '/v1/custom',
  routes: (app) => {
    app.get('/hello', async (ctx) => {
      return ctx.json({ message: 'Hello from plugin API!' });
    });
  },
});
`;
}

function generateAppComponentTemplate(): string {
  return `import React from 'react';
import { wrapComponent } from '@pekempy/fluxer-plugin-sdk/helpers/app';
import type { ComponentWrapper } from '@pekempy/fluxer-plugin-sdk/types/app';

const EnhancedMessageContent: ComponentWrapper = ({ OriginalComponent, ...props }) => {
  return (
    <div style={{ borderLeft: '3px solid #7289da', paddingLeft: '8px' }}>
      <OriginalComponent {...props} />
      <div style={{ fontSize: '11px', color: '#8e9297', marginTop: '4px' }}>
        🚀 Enhanced by Plugin
      </div>
    </div>
  );
};

export default wrapComponent(EnhancedMessageContent);
`;
}

function generateAdminPageTemplate(): string {
  return `import { createAdminPage } from '@pekempy/fluxer-plugin-sdk/helpers/admin';

export default createAdminPage({
  title: 'Plugin Analytics',
  render: async (ctx) => {
    return \`
      <div style="padding: 20px;">
        <h1 style="font-size: 24px; font-weight: bold;">Plugin Dashboard</h1>
        <p style="margin-top: 10px; color: #666;">This page is rendered directly by the Admin Plugin Proxy.</p>
      </div>
    \`;
  },
});
`;
}

function generateIndexTemplate(): string {
  return `import type { PluginLifecycle } from '@pekempy/fluxer-plugin-sdk';

const plugin: PluginLifecycle = {
  init(context) {
    context.logger.info('Plugin initialized successfully!');
  },
  shutdown(context) {
    context.logger.info('Plugin shutdown.');
  }
};

export default plugin;
`;
}
