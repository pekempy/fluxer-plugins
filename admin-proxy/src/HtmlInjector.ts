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

  // Dynamic cache-busting for stylesheet and script links
  const timestamp = Date.now();
  const links = root.querySelectorAll('link[rel="stylesheet"]');
  for (const link of links) {
    const href = link.getAttribute('href');
    if (href) {
      const newHref = href.includes('t=')
        ? href.replace(/([?&])t=[^&]*/, `$1t=${timestamp}`)
        : href + (href.includes('?') ? '&' : '?') + `t=${timestamp}`;
      link.setAttribute('href', newHref);
    }
  }

  const scripts = root.querySelectorAll('script[src]');
  for (const script of scripts) {
    const src = script.getAttribute('src');
    if (src) {
      const newSrc = src.includes('t=')
        ? src.replace(/([?&])t=[^&]*/, `$1t=${timestamp}`)
        : src + (src.includes('?') ? '&' : '?') + `t=${timestamp}`;
      script.setAttribute('src', newSrc);
    }
  }

  return root.toString();
}
