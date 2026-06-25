import { parse } from 'node-html-parser';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Context } from 'hono';
import { getLoadedPlugins } from './index.js';
import { injectSidebar } from './SidebarInjector.js';

export async function injectPluginsIntoHtml(html: string, ctx: Context): Promise<string> {
  const root = parse(html);
  const plugins = getLoadedPlugins();

  for (const plugin of plugins) {
    const injections = plugin.manifest.targets?.admin?.injections || [];
    for (const inj of injections) {
      const element = root.querySelector(inj.selector);
      if (element) {
        try {
          const fragmentPath = path.resolve(plugin.pluginDir, inj.fragment);
          const fragmentHtml = await fs.readFile(fragmentPath, 'utf-8');
          
          if (inj.position === 'append') {
            element.insertAdjacentHTML('beforeend', fragmentHtml);
          } else if (inj.position === 'prepend') {
            element.insertAdjacentHTML('afterbegin', fragmentHtml);
          } else if (inj.position === 'before') {
            element.insertAdjacentHTML('beforebegin', fragmentHtml);
          } else if (inj.position === 'after') {
            element.insertAdjacentHTML('afterend', fragmentHtml);
          } else if (inj.position === 'replace') {
            element.set_content(fragmentHtml);
          }
        } catch (err) {
          console.error(`[Admin Proxy] Failed to inject fragment for '${plugin.name}' at selector '${inj.selector}':`, err);
        }
      }
    }
  }

  // Specialized sidebar injection for plugin admin menus
  injectSidebar(root, plugins);

  return root.toString();
}
