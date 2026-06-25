import { createAdminPage } from '@pekempy/fluxer-plugin-sdk/helpers/admin';

export default createAdminPage({
  path: '/plugins/example-plugin/analytics',
  handler: async (ctx) => {
    return `
      <div class="p-6 max-w-4xl mx-auto">
        <h1 class="text-2xl font-bold text-gray-900">Example Plugin Analytics</h1>
        <p class="text-sm text-gray-500 mt-1">A demo dashboard served directly by the admin proxy sidecar.</p>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Hooks</h3>
            <p class="text-3xl font-bold text-indigo-600 mt-2">4</p>
          </div>
          <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider">API Requests Intercepted</h3>
            <p class="text-3xl font-bold text-green-600 mt-2">142</p>
          </div>
          <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</h3>
            <p class="text-3xl font-bold text-gray-800 mt-2">Healthy</p>
          </div>
        </div>
      </div>
    `;
  }
});
