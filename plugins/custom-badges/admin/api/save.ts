import { createAdminApi } from '@pekempy/fluxer-plugin-sdk/helpers/admin';
import { renderDashboardHtml } from '../pages/ManageBadges.js';
import { getConfigData, saveConfigData, ConfigData, DomainMapping } from '../../api/routes/BadgesApi.js';

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
      const userId = body.userId as string;
      const iconUrl = body.iconUrl as string;
      const tooltip = body.tooltip as string;
      const url = (body.url as string) || undefined;

      if (!userId) {
        return ctx.text('Missing User ID', 400);
      }
      if (!iconUrl || !tooltip) {
        return ctx.text('Missing Icon URL or Tooltip', 400);
      }

      const existing = config.badges[userId] || [];
      existing.push({ iconUrl, tooltip, url });
      config.badges[userId] = existing;
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

    // Return the updated dashboard HTML directly for HTMX to swap in
    return ctx.html(renderDashboardHtml(config));
  }
});
