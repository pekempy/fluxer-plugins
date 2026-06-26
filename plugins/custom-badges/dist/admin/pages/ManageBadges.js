import { createAdminPage } from '@pekempy/fluxer-plugin-sdk/helpers/admin';
import { getConfigData } from '../../api/routes/BadgesApi.js';
export function renderUserBadgesTable(badgesMap) {
    const entries = Object.entries(badgesMap);
    const rows = entries.map(([userId, badges]) => {
        const badgeList = badges.map((b) => `
      <div class="inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs border border-gray-200">
        <img src="${b.iconUrl}" class="w-4 h-4 object-contain" />
        <span class="font-medium">${b.tooltip}</span>
        ${b.url ? `<a href="${b.url}" target="_blank" class="text-blue-500 hover:underline">🔗</a>` : ''}
      </div>
    `).join(' ');
        return `
      <tr class="border-t border-gray-100 hover:bg-gray-50">
        <td class="px-4 py-3 font-mono text-sm text-gray-600">${userId}</td>
        <td class="px-4 py-3">${badgeList}</td>
        <td class="px-4 py-3 text-right">
          <button class="text-red-500 hover:text-red-700 text-sm font-semibold"
                  hx-post="/admin/plugins/custom-badges/api/save"
                  hx-vals='{"userId": "${userId}", "action": "delete"}'
                  hx-target="#badges-dashboard"
                  hx-swap="innerHTML">
            Delete All
          </button>
        </td>
      </tr>
    `;
    }).join('');
    if (entries.length === 0) {
        return `
      <div class="text-center py-8 text-gray-500 bg-gray-50 rounded border border-dashed border-gray-200">
        No custom user badges configured yet.
      </div>
    `;
    }
    return `
    <div class="overflow-x-auto bg-white rounded border border-gray-200 shadow-sm">
      <table class="min-w-full text-left border-collapse">
        <thead>
          <tr class="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
            <th class="px-4 py-3">User ID</th>
            <th class="px-4 py-3">Badges</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}
export function renderDomainMappingsTable(mappings) {
    const rows = mappings.map((m) => {
        return `
      <tr class="border-t border-gray-100 hover:bg-gray-50">
        <td class="px-4 py-3 font-mono text-sm text-gray-800">${m.domain}</td>
        <td class="px-4 py-3">
          <div class="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs border border-indigo-100">
            <img src="${m.iconUrl}" class="w-4 h-4 object-contain" />
            <span class="font-medium">${m.tooltip}</span>
          </div>
        </td>
        <td class="px-4 py-3 font-mono text-xs text-gray-500 truncate max-w-xs" title="${m.urlTemplate || ''}">
          ${m.urlTemplate || '<span class="text-gray-400">None</span>'}
        </td>
        <td class="px-4 py-3 text-right">
          <button class="text-red-500 hover:text-red-700 text-sm font-semibold"
                  hx-post="/admin/plugins/custom-badges/api/save"
                  hx-vals='{"domain": "${m.domain}", "action": "delete-mapping"}'
                  hx-target="#badges-dashboard"
                  hx-swap="innerHTML">
            Delete
          </button>
        </td>
      </tr>
    `;
    }).join('');
    if (mappings.length === 0) {
        return `
      <div class="text-center py-8 text-gray-500 bg-gray-50 rounded border border-dashed border-gray-200">
        No domain-to-badge mappings configured yet.
      </div>
    `;
    }
    return `
    <div class="overflow-x-auto bg-white rounded border border-gray-200 shadow-sm">
      <table class="min-w-full text-left border-collapse">
        <thead>
          <tr class="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
            <th class="px-4 py-3">Domain</th>
            <th class="px-4 py-3">Badge Info</th>
            <th class="px-4 py-3">URL Template</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}
export function renderDashboardHtml(config) {
    return `
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Custom User Badges & Connections</h1>
        <p class="text-sm text-gray-500 mt-1">Configure profile badges for specific users or assign them dynamically using domain connection mappings.</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Forms Column (Left) -->
      <div class="space-y-6 lg:col-span-1">
        <!-- Form 1: Add Badge by User ID -->
        <div class="bg-white p-6 rounded border border-gray-200 shadow-sm">
          <h2 class="text-lg font-medium text-gray-800 mb-4">Add User Badge</h2>
          <form hx-post="/admin/plugins/custom-badges/api/save"
                hx-target="#badges-dashboard"
                hx-swap="innerHTML"
                class="space-y-4">
            <input type="hidden" name="action" value="save-badge" />
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase">User Snowflake ID</label>
              <input type="text" name="userId" required placeholder="e.g. 1518021155376594944"
                     class="mt-1 block w-full rounded border-gray-300 shadow-sm text-sm focus:border-indigo-500 focus:ring-indigo-500">
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase">Icon URL</label>
              <input type="url" name="iconUrl" required placeholder="https://example.com/icon.png"
                     class="mt-1 block w-full rounded border-gray-300 shadow-sm text-sm focus:border-indigo-500 focus:ring-indigo-500">
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase">Tooltip Text</label>
              <input type="text" name="tooltip" required placeholder="e.g. VIP Member"
                     class="mt-1 block w-full rounded border-gray-300 shadow-sm text-sm focus:border-indigo-500 focus:ring-indigo-500">
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase">Redirect URL (Optional)</label>
              <input type="url" name="url" placeholder="https://..."
                     class="mt-1 block w-full rounded border-gray-300 shadow-sm text-sm focus:border-indigo-500 focus:ring-indigo-500">
            </div>
            
            <button type="submit" class="w-full py-2 px-4 border border-transparent rounded shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Save User Badge
            </button>
          </form>
        </div>

        <!-- Form 2: Add Domain Mapping -->
        <div class="bg-white p-6 rounded border border-gray-200 shadow-sm">
          <h2 class="text-lg font-medium text-gray-800 mb-4">Add Domain Mapping</h2>
          <form hx-post="/admin/plugins/custom-badges/api/save"
                hx-target="#badges-dashboard"
                hx-swap="innerHTML"
                class="space-y-4">
            <input type="hidden" name="action" value="save-mapping" />
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase">Domain Pattern</label>
              <input type="text" name="domain" required placeholder="e.g. github.com"
                     class="mt-1 block w-full rounded border-gray-300 shadow-sm text-sm focus:border-indigo-500 focus:ring-indigo-500">
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase">Icon URL</label>
              <input type="url" name="iconUrl" required placeholder="https://github.githubassets.com/favicons/favicon.svg"
                     class="mt-1 block w-full rounded border-gray-300 shadow-sm text-sm focus:border-indigo-500 focus:ring-indigo-500">
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase">Tooltip Text</label>
              <input type="text" name="tooltip" required placeholder="e.g. GitHub Connection"
                     class="mt-1 block w-full rounded border-gray-300 shadow-sm text-sm focus:border-indigo-500 focus:ring-indigo-500">
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase">URL Template (Optional)</label>
              <input type="text" name="urlTemplate" placeholder="e.g. https://github.com/{slug}"
                     class="mt-1 block w-full rounded border-gray-300 shadow-sm text-sm focus:border-indigo-500 focus:ring-indigo-500">
              <p class="text-[10px] text-gray-400 mt-1">Use <code class="font-mono">{slug}</code> to insert the connection's username slug.</p>
            </div>
            
            <button type="submit" class="w-full py-2 px-4 border border-transparent rounded shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Save Domain Mapping
            </button>
          </form>
        </div>
      </div>

      <!-- Lists Column (Right) -->
      <div class="space-y-6 lg:col-span-2">
        <div>
          <h2 class="text-lg font-medium text-gray-800 mb-3">Domain connection Mappings</h2>
          ${renderDomainMappingsTable(config.domainMappings)}
        </div>
        <div>
          <h2 class="text-lg font-medium text-gray-800 mb-3">Configured User Badges</h2>
          ${renderUserBadgesTable(config.badges)}
        </div>
      </div>
    </div>
  `;
}
export default createAdminPage({
    path: '/plugins/custom-badges/manage',
    handler: async (ctx) => {
        const config = await getConfigData();
        return `
      <script src="https://cdn.tailwindcss.com"></script>
      <div class="p-6 max-w-7xl mx-auto" id="badges-dashboard">
        ${renderDashboardHtml(config)}
      </div>
    `;
    }
});
//# sourceMappingURL=ManageBadges.js.map