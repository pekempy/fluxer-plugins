import { createAdminApi } from '@pekempy/fluxer-plugin-sdk/helpers/admin';
import { renderDashboardHtml } from '../pages/ManageBadges.js';
import { getConfigData, saveConfigData, ConfigData, DomainMapping, getUserTags } from '../../api/routes/BadgesApi.js';

export default createAdminApi({
  method: 'POST',
  path: '/plugins/custom-badges/api/save',
  handler: async (ctx) => {
    const body = await ctx.req.parseBody();
    const action = body.action as string;
    const config = await getConfigData();

    if (action === 'delete') {
      const userId = body.userId as string;
      if (userId) {
        delete config.badges[userId];
        await saveConfigData(config);
      }
    } else if (action === 'save-badge') {
      const userIdsRaw = (body.userIds as string || body.userId as string || '');
      const iconUrl = body.iconUrl as string;
      const tooltip = body.tooltip as string;
      const url = (body.url as string) || undefined;

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
    } else if (action === 'save-mapping') {
      const domain = (body.domain as string)?.toLowerCase()?.trim();
      const iconUrl = body.iconUrl as string;
      const tooltip = body.tooltip as string;
      const urlTemplate = (body.urlTemplate as string) || undefined;

      if (!domain || !iconUrl || !tooltip) {
        return ctx.text('Missing Domain, Icon URL, or Tooltip', 400);
      }

      const newMapping: DomainMapping = {
        domain,
        iconUrl,
        tooltip,
        urlTemplate,
      };

      config.domainMappings = config.domainMappings.filter(m => m.domain !== domain);
      config.domainMappings.push(newMapping);
      await saveConfigData(config);
    } else if (action === 'delete-mapping') {
      const domain = (body.domain as string)?.toLowerCase()?.trim();
      if (domain) {
        config.domainMappings = config.domainMappings.filter(m => m.domain !== domain);
        await saveConfigData(config);
      }
    }

    const userIds = Object.keys(config.badges);
    const userTagsMap = await getUserTags(userIds);

    // Return the updated dashboard HTML directly for HTMX to swap in
    return ctx.html(renderDashboardHtml(config, userTagsMap));
  }
});
