import { createAdminPage } from '@pekempy/fluxer-plugin-sdk/helpers/admin';
import { getCategories } from '../../api/utils/ConfigHelper.js';
export function renderCategoriesTable(categories) {
    const rows = categories.map((c) => `
    <tr class="border-t border-gray-100 hover:bg-gray-50">
      <td class="px-4 py-3 font-mono text-sm text-gray-800">${c.id}</td>
      <td class="px-4 py-3 font-medium text-sm text-gray-800">${c.name}</td>
      <td class="px-4 py-3 text-right">
        <button class="text-red-500 hover:text-red-700 text-sm font-semibold"
                hx-post="/admin/plugins/custom-discovery-categories/api/save"
                hx-vals='{"categoryId": "${c.id}", "action": "delete-category"}'
                hx-target="#categories-dashboard"
                hx-swap="innerHTML">
          Delete
        </button>
      </td>
    </tr>
  `).join('');
    if (categories.length === 0) {
        return `
      <div class="text-center py-8 text-gray-500 bg-gray-50 rounded border border-dashed border-gray-200">
        No custom discovery categories/badges configured yet.
      </div>
    `;
    }
    return `
    <div class="overflow-x-auto bg-white rounded border border-gray-200 shadow-sm">
      <table class="min-w-full text-left border-collapse">
        <thead>
          <tr class="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
            <th class="px-4 py-3 w-24">ID</th>
            <th class="px-4 py-3">Category Name</th>
            <th class="px-4 py-3 w-24"></th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}
export function renderDashboardHtml(categories) {
    return `
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Custom Discovery Categories</h1>
        <p class="text-sm text-gray-500 mt-1">Configure custom badges and filter options shown in the community discover window.</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Forms Column (Left) -->
      <div class="space-y-6 lg:col-span-1">
        <!-- Form: Add Category -->
        <div class="bg-white p-6 rounded border border-gray-200 shadow-sm">
          <h2 class="text-lg font-medium text-gray-800 mb-4">Add Category</h2>
          <form hx-post="/admin/plugins/custom-discovery-categories/api/save"
                hx-target="#categories-dashboard"
                hx-swap="innerHTML"
                class="space-y-4">
            <input type="hidden" name="action" value="add-category" />
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase">Category ID (Numeric)</label>
              <input type="number" name="categoryId" required placeholder="e.g. 10" min="0"
                     class="mt-1 block w-full rounded border-gray-300 shadow-sm text-sm focus:border-indigo-500 focus:ring-indigo-500">
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase">Category Name</label>
              <input type="text" name="categoryName" required placeholder="e.g. Art & Design"
                     class="mt-1 block w-full rounded border-gray-300 shadow-sm text-sm focus:border-indigo-500 focus:ring-indigo-500">
            </div>
            
            <button type="submit" class="w-full py-2 px-4 border border-transparent rounded shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Add Category
            </button>
          </form>
        </div>
        
        <!-- Form: Reset to Defaults -->
        <div class="bg-white p-6 rounded border border-gray-200 shadow-sm">
          <h2 class="text-lg font-medium text-gray-800 mb-2">Reset to Defaults</h2>
          <p class="text-xs text-gray-500 mb-4">Resetting will restore the original 9 default categories (Gaming, Music, etc.).</p>
          <button hx-post="/admin/plugins/custom-discovery-categories/api/save"
                  hx-vals='{"action": "reset-defaults"}'
                  hx-target="#categories-dashboard"
                  hx-swap="innerHTML"
                  class="w-full py-2 px-4 border border-gray-300 rounded shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Reset to default categories
          </button>
        </div>
      </div>

      <!-- Lists Column (Right) -->
      <div class="lg:col-span-2">
        <h2 class="text-lg font-medium text-gray-800 mb-3">Discovery Categories List</h2>
        ${renderCategoriesTable(categories)}
      </div>
    </div>
  `;
}
export default createAdminPage({
    path: '/plugins/custom-discovery-categories/manage',
    handler: async (ctx) => {
        const categories = await getCategories();
        return `
      <script src="https://cdn.tailwindcss.com"></script>
      <div class="p-6 max-w-7xl mx-auto" id="categories-dashboard">
        ${renderDashboardHtml(categories)}
      </div>
    `;
    }
});
//# sourceMappingURL=ManageCategories.js.map