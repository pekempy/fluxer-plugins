# Writing Admin Plugins

Admin plugins modify the Axum/Maud Rust-based `fluxer-admin` dashboard via the Admin Plugin Proxy sidecar. This enables HTML fragment injection, custom page creation, settings panels, and HTMX endpoints.

---

## 1. Sidebar Fragment Injection

To inject items into the sidebar, register a CSS selector injection in the manifest:

```yaml
targets:
  admin:
    injections:
      - selector: "#sidebar-nav"
        position: "append"
        fragment: "./admin/fragments/sidebar-item.html"
```

The fragment is a raw HTML snippet using HTMX attributes to trigger SPA-like navigation:

```html
<!-- admin/fragments/sidebar-item.html -->
<a href="/admin/plugins/my-plugin/dashboard"
   class="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-300 hover:text-white hover:bg-gray-700"
   hx-get="/admin/plugins/my-plugin/dashboard"
   hx-target="#content-area"
   hx-push-url="true">
  <span class="mr-3">🔌</span>
  My Plugin Dashboard
</a>
```

---

## 2. Custom Pages

Custom pages are rendered directly by the proxy. They are written in TypeScript and return an HTML fragment or document:

```typescript
// admin/pages/Dashboard.ts
import { createAdminPage } from '@pekempy/fluxer-plugin-sdk/helpers/admin';

export default createAdminPage({
  title: 'Plugin Dashboard',
  render: async (context) => {
    return `
      <div class="p-6">
        <h1 class="text-2xl font-bold text-gray-900">Plugin Management Dashboard</h1>
        <p class="text-sm text-gray-500 mt-1">Manage and view custom plugin logs.</p>
        
        <div class="mt-6 bg-white shadow rounded-lg p-6">
          <h2 class="text-lg font-medium text-gray-800">Dynamic Stats</h2>
          <button class="mt-4 px-4 py-2 bg-indigo-600 text-white rounded"
                  hx-post="/admin/plugins/my-first-plugin/api/refresh"
                  hx-target="#stats-result">
            Fetch Live Status
          </button>
          <div id="stats-result" class="mt-4 text-sm text-gray-600">Click to fetch...</div>
        </div>
      </div>
    `;
  }
});
```

---

## 3. Settings Panels

Settings panels provide configuration forms that automatically persist to the plugin's config store:

```typescript
// admin/settings/SettingsPage.ts
import { createSettingsPage } from '@pekempy/fluxer-plugin-sdk/helpers/admin';

export default createSettingsPage({
  title: 'Plugin Settings',
  // Load initial fields from the config store
  load: async (context) => {
    const enabled = await context.config.get('featureEnabled', true);
    const limit = await context.config.get('maxThreshold', 10);
    return { enabled, limit };
  },
  // Form HTML layout
  renderForm: (data) => `
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700">Enable Feature X</label>
        <input type="checkbox" name="enabled" ${data.enabled ? 'checked' : ''} class="mt-1">
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700">Max Threshold</label>
        <input type="number" name="limit" value="${data.limit}" class="mt-1 block w-full rounded border-gray-300">
      </div>
    </div>
  `,
  // Handle POST settings update
  save: async (formData, context) => {
    await context.config.set('featureEnabled', formData.enabled === 'on');
    await context.config.set('maxThreshold', parseInt(formData.limit, 10));
    return { success: true, message: 'Settings saved successfully!' };
  }
});
```

---

## 4. Response Interceptors

Interceptors allow you to parse and rewrite HTML or JSON returned by the upstream Rust `fluxer-admin` server before sending it to the browser:

```typescript
// admin/interceptors/UserInterceptor.ts
import { interceptResponse } from '@pekempy/fluxer-plugin-sdk/helpers/admin';

export default interceptResponse({
  route: '/admin/users/:userId',
  intercept: async (html, context) => {
    // Intercept and inject a banner in the user detail layout
    const originalString = 'id="user-profile-header"';
    const replacement = `id="user-profile-header"
      <div class="bg-yellow-100 p-2 text-xs font-semibold text-yellow-800">
        🛡 Checked by Security Plugin
      </div>`;
    return html.replace(originalString, replacement);
  }
});
```
