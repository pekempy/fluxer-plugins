import { createAdminPage } from '@pekempy/fluxer-plugin-sdk/helpers/admin';
export default createAdminPage({
    title: 'Plugin Analytics',
    render: async (ctx) => {
        return `
      <div style="padding: 20px;">
        <h1 style="font-size: 24px; font-weight: bold;">Plugin Dashboard</h1>
        <p style="margin-top: 10px; color: #666;">This page is rendered directly by the Admin Plugin Proxy.</p>
      </div>
    `;
    },
});
//# sourceMappingURL=analytics.js.map