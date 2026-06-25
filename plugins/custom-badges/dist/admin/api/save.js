import { createAdminApi } from '@pekempy/fluxer-plugin-sdk/helpers/admin';
import { getBadgesMap, renderDashboardHtml } from '../pages/ManageBadges.js';
import { promises as fs } from 'fs';
import path from 'path';
const configPath = path.resolve(process.cwd(), 'plugins', 'config', 'custom-badges.json');
async function saveBadgesMap(map) {
    try {
        await fs.mkdir(path.dirname(configPath), { recursive: true });
        await fs.writeFile(configPath, JSON.stringify({ badges: map }, null, 2), 'utf-8');
    }
    catch (err) {
        console.error('[Custom Badges Plugin] Failed to save config:', err);
    }
}
export default createAdminApi({
    method: 'POST',
    path: '/plugins/custom-badges/api/save',
    handler: async (ctx) => {
        const body = await ctx.req.parseBody();
        const userId = body.userId;
        const action = body.action;
        const badgesMap = await getBadgesMap();
        if (!userId) {
            return ctx.text('Missing User ID', 400);
        }
        if (action === 'delete') {
            delete badgesMap[userId];
            await saveBadgesMap(badgesMap);
        }
        else {
            const iconUrl = body.iconUrl;
            const tooltip = body.tooltip;
            const url = body.url || undefined;
            if (!iconUrl || !tooltip) {
                return ctx.text('Missing Icon URL or Tooltip', 400);
            }
            const existing = badgesMap[userId] || [];
            existing.push({ iconUrl, tooltip, url });
            badgesMap[userId] = existing;
            await saveBadgesMap(badgesMap);
        }
        // Return the updated dashboard HTML directly for HTMX to swap in
        return ctx.html(renderDashboardHtml(badgesMap));
    }
});
//# sourceMappingURL=save.js.map