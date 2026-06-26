import { createAdminApi } from '@pekempy/fluxer-plugin-sdk/helpers/admin';
import { renderDashboardHtml } from '../pages/ManageBadges.js';
import { getConfigData, saveConfigData } from '../../api/routes/BadgesApi.js';
export default createAdminApi({
    method: 'POST',
    path: '/plugins/custom-badges/api/save',
    handler: async (ctx) => {
        const body = await ctx.req.parseBody();
        const action = body.action;
        const config = await getConfigData();
        if (action === 'delete') {
            const userId = body.userId;
            if (userId) {
                delete config.badges[userId];
                await saveConfigData(config);
            }
        }
        else if (action === 'save-badge') {
            const userIdsRaw = (body.userIds || body.userId || '');
            const iconUrl = body.iconUrl;
            const tooltip = body.tooltip;
            const url = body.url || undefined;
            if (!userIdsRaw) {
                return ctx.text('Missing User ID(s)', 400);
            }
            if (!iconUrl || !tooltip) {
                return ctx.text('Missing Icon URL or Tooltip', 400);
            }
            const userIds = userIdsRaw
                .split(/[\s,]+/)
                .map(id => id.trim())
                .filter(id => id.length > 0);
            if (userIds.length === 0) {
                return ctx.text('No valid User ID(s) provided', 400);
            }
            for (const userId of userIds) {
                const existing = config.badges[userId] || [];
                const isDuplicate = existing.some(b => b.iconUrl === iconUrl && b.tooltip === tooltip);
                if (!isDuplicate) {
                    existing.push({ iconUrl, tooltip, url });
                    config.badges[userId] = existing;
                }
            }
            await saveConfigData(config);
        }
        else if (action === 'save-mapping') {
            const domain = body.domain?.toLowerCase()?.trim();
            const iconUrl = body.iconUrl;
            const tooltip = body.tooltip;
            const urlTemplate = body.urlTemplate || undefined;
            if (!domain || !iconUrl || !tooltip) {
                return ctx.text('Missing Domain, Icon URL, or Tooltip', 400);
            }
            const newMapping = {
                domain,
                iconUrl,
                tooltip,
                urlTemplate,
            };
            config.domainMappings = config.domainMappings.filter(m => m.domain !== domain);
            config.domainMappings.push(newMapping);
            await saveConfigData(config);
        }
        else if (action === 'delete-mapping') {
            const domain = body.domain?.toLowerCase()?.trim();
            if (domain) {
                config.domainMappings = config.domainMappings.filter(m => m.domain !== domain);
                await saveConfigData(config);
            }
        }
        // Return the updated dashboard HTML directly for HTMX to swap in
        return ctx.html(renderDashboardHtml(config));
    }
});
//# sourceMappingURL=save.js.map