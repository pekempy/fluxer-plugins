import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { discoverPlugins } from './PluginDiscovery.js';
import { createProxyMiddleware } from './ProxyMiddleware.js';
import { registerPluginApis, reloadPluginApis } from './ApiServer.js';
import { renderPluginPage } from './PageServer.js';
import { startWatcher } from './HotReloader.js';
let loadedPlugins = [];
export function getLoadedPlugins() {
    return loadedPlugins;
}
async function main() {
    const port = Number(process.env.PORT) || 3020;
    const upstreamUrl = process.env.UPSTREAM_ADMIN_URL || 'http://localhost:3021';
    const pluginsDir = process.env.FLUXER_PLUGIN_DIR || '../../plugins';
    console.log(`[Admin Proxy] Starting...`);
    console.log(`[Admin Proxy] Upstream admin URL: ${upstreamUrl}`);
    console.log(`[Admin Proxy] Plugins directory: ${pluginsDir}`);
    // 1. Discover plugins targeting admin
    loadedPlugins = await discoverPlugins(pluginsDir);
    const app = new Hono();
    // 2. Register custom plugin pages & settings
    for (const plugin of loadedPlugins) {
        const admin = plugin.manifest.targets?.admin;
        if (!admin)
            continue;
        // Custom pages
        const pages = admin.pages || [];
        for (const page of pages) {
            const renderFn = (c) => renderPluginPage(c, plugin, page, upstreamUrl);
            app.get(page.path, renderFn);
            // Support path with /admin prefix
            if (!page.path.startsWith('/admin')) {
                app.get(`/admin${page.path}`, renderFn);
            }
        }
        // Settings panels
        const settings = admin.settings || [];
        for (const set of settings) {
            const renderFn = (c) => renderPluginPage(c, plugin, set, upstreamUrl);
            app.get(set.path, renderFn);
            if (!set.path.startsWith('/admin')) {
                app.get(`/admin${set.path}`, renderFn);
            }
        }
    }
    // 3. Register plugin APIs
    await registerPluginApis(app, loadedPlugins);
    // 4. Register proxy middleware for all other requests
    const proxy = await createProxyMiddleware(upstreamUrl);
    app.all('*', proxy);
    // 5. Start HTTP Server
    serve({
        fetch: app.fetch,
        port,
        hostname: '0.0.0.0',
    });
    console.log(`[Admin Proxy] Listening on port ${port}`);
    // 6. Setup file watcher for hot reloading
    if (process.env.FLUXER_DEV === 'true' || process.env.NODE_ENV !== 'production') {
        startWatcher(pluginsDir, async () => {
            console.log('[Admin Proxy] Reloading plugin components...');
            loadedPlugins = await discoverPlugins(pluginsDir, true);
            await reloadPluginApis(loadedPlugins);
            console.log('[Admin Proxy] Hot-reload done.');
        });
    }
}
main().catch((err) => {
    console.error('[Admin Proxy] Fatal initialization error:', err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map