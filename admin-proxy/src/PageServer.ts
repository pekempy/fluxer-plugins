import type { Context } from 'hono';
import path from 'node:path';
import { parse } from 'node-html-parser';
import { injectSidebar } from './SidebarInjector.js';
import { getLoadedPlugins } from './index.js';

export async function renderPluginPage(
  c: Context,
  plugin: any,
  pageOrSetting: any,
  upstreamUrl: string
) {
  try {
    // 1. Resolve and import the plugin handler
    const jsFile = pageOrSetting.handler.replace(/\.ts$/, '.js');
    const fullPath = path.resolve(plugin.pluginDir, 'dist', jsFile);
    // Add cache buster to support hot reloading in development
    const fileUrl = `file://${fullPath}?t=${Date.now()}`;
    const module = await import(fileUrl);
    const config = module.default || module;

    const renderFn = config.handler || config.render;
    if (!config || typeof renderFn !== 'function') {
      return c.text(`Plugin handler in '${pageOrSetting.handler}' does not export a handler() or render() function.`, 500);
    }

    // 2. Render page content
    const pageContentHtml = await renderFn(c);
    const title = config.title || 'Plugin Page';

    // 3. Fetch layout from upstream admin
    const headers = new Headers();
    const cookie = c.req.header('cookie');
    if (cookie) {
      headers.set('cookie', cookie);
    }

    let root: any = null;
    try {
      const upstreamRes = await fetch(`${upstreamUrl}/users`, { headers });
      
      if (upstreamRes.ok) {
        const layoutHtml = await upstreamRes.text();
        root = parse(layoutHtml);
      } else {
        const errText = await upstreamRes.text().catch(() => '');
        console.warn(`[Admin Proxy] Failed to fetch layout from upstream. Status: ${upstreamRes.status}, Body: ${errText.slice(0, 300)}`);
        if (upstreamRes.status === 401 || upstreamRes.status === 403) {
          return c.redirect(`/admin/login`);
        }
      }
    } catch (fetchErr) {
      console.warn(`[Admin Proxy] Upstream admin offline, using fallback layout:`, fetchErr);
    }

    if (!root) {
      const { renderFallbackLayout } = await import('./AdminLayoutTemplate.js');
      return c.html(renderFallbackLayout(title, pageContentHtml));
    }

    // 4. Update the title tag
    const titleElement = root.querySelector('title');
    if (titleElement) {
      titleElement.set_content(`${title} ~ Fluxer Admin`);
    }

    // 5. Replace main content with plugin content
    const mainContent = root.querySelector('main#main-content');
    if (mainContent) {
      mainContent.set_content(`
        <div class="mx-auto w-full max-w-7xl">
          <div id="flash-container" class="empty:hidden"></div>
          ${pageContentHtml}
        </div>
      `);
    }

    // 6. Inject plugins sidebar section
    injectSidebar(root, getLoadedPlugins());

    return c.html(root.toString());
  } catch (err) {
    console.error(`[Admin Proxy] Failed to render plugin page at ${c.req.path}:`, err);
    return c.text(`Failed to render plugin page: ${err}`, 500);
  }
}
