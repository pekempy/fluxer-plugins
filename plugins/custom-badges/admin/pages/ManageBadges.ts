import { createAdminPage } from '@pekempy/fluxer-plugin-sdk/helpers/admin';
import { promises as fs } from 'fs';
import path from 'path';

const configPath = path.resolve(process.cwd(), 'plugins', 'config', 'custom-badges.json');

interface Badge {
  iconUrl: string;
  tooltip: string;
  url?: string;
}

export async function getBadgesMap(): Promise<Record<string, Badge[]>> {
  try {
    const data = await fs.readFile(configPath, 'utf-8');
    const parsed = JSON.parse(data);
    return parsed.badges || {};
  } catch {
    return {};
  }
}

export function renderBadgesTable(badgesMap: Record<string, Badge[]>): string {
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
                  hx-post="/plugins/custom-badges/api/save"
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
        No custom badges configured yet.
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

export function renderDashboardHtml(badgesMap: Record<string, Badge[]>): string {
  return `
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Custom User Badges</h1>
        <p class="text-sm text-gray-500 mt-1">Configure multiple profile badges for users with images, tooltips, and links.</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Form Panel -->
      <div class="bg-white p-6 rounded border border-gray-200 shadow-sm h-fit md:col-span-1">
        <h2 class="text-lg font-medium text-gray-800 mb-4">Add / Edit Badge</h2>
        <form hx-post="/plugins/custom-badges/api/save"
              hx-target="#badges-dashboard"
              hx-swap="innerHTML"
              class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-gray-500 uppercase">User ID</label>
            <input type="text" name="userId" required placeholder="User Snowflake ID"
                   class="mt-1 block w-full rounded border-gray-300 shadow-sm text-sm focus:border-indigo-500 focus:ring-indigo-500">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-500 uppercase">Icon URL</label>
            <input type="url" name="iconUrl" required placeholder="https://example.com/icon.png"
                   class="mt-1 block w-full rounded border-gray-300 shadow-sm text-sm focus:border-indigo-500 focus:ring-indigo-500">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-500 uppercase">Tooltip Text</label>
            <input type="text" name="tooltip" required placeholder="Linked Profile"
                   class="mt-1 block w-full rounded border-gray-300 shadow-sm text-sm focus:border-indigo-500 focus:ring-indigo-500">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-500 uppercase">Redirect URL (Optional)</label>
            <input type="url" name="url" placeholder="https://..."
                   class="mt-1 block w-full rounded border-gray-300 shadow-sm text-sm focus:border-indigo-500 focus:ring-indigo-500">
          </div>
          
          <button type="submit" class="w-full py-2 px-4 border border-transparent rounded shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Save Badge
          </button>
        </form>
      </div>

      <!-- List Panel -->
      <div class="md:col-span-2">
        <h2 class="text-lg font-medium text-gray-800 mb-4">Configured User Badges</h2>
        ${renderBadgesTable(badgesMap)}
      </div>
    </div>
  `;
}

export default createAdminPage({
  path: '/plugins/custom-badges/manage',
  handler: async (ctx) => {
    const badgesMap = await getBadgesMap();
    return `
      <div class="p-6 max-w-4xl mx-auto" id="badges-dashboard">
        ${renderDashboardHtml(badgesMap)}
      </div>
    `;
  }
});
