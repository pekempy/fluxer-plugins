# Fluxer Plugins — Resuming Checklist

This checklist is provided to help you resume development of the plugin system and the `custom-badges` plugin.

---

## 1. Project Status Summary

- **Upstream Merges**: 100% clean. No upstream files modified. All plugin work lives in `fluxer_plugins/` and `plugins/`.
- **SDK & CLI**: Fully operational and compiled.
- **API Loader & App Loader**: Fully implemented and tested.
- **Admin Plugin Proxy**: Reverse proxies admin panel, injects HTML fragments, serves custom dashboards, and supports custom API endpoints.
- **`custom-badges` Plugin**: Scaffolded, customized, verified, and successfully compiled. It contains:
  - Custom routes at `/v1/custom/badges/:userId` to get/set user badges map.
  - Component wrapper (`UserProfileBadgesWrapper.tsx`) to query and render multiple badges with tooltips and redirect URLs.
  - Admin dashboard page (`ManageBadges.ts`) to manage user badges using form controls.
  - Admin API handler (`save.ts`) to process HTMX submissions and update local configurations.

---

## 2. Dev Environment Boot Checklist

When resuming work, follow these steps to boot the plugin development stack:

- [ ] **Step 1: Start Valkey, Postgres, and NATS**
  Make sure your local dev containers are running:
  ```bash
  docker compose -f .devcontainer/docker-compose.yml up -d postgres valkey nats
  ```

- [ ] **Step 2: Start the Plugin Compiler Watcher**
  This watcher monitors all active plugins and auto-compiles TypeScript source changes into `/dist`:
  ```bash
  cd fluxer_plugins/cli
  pnpm install --ignore-workspace
  node dist/index.js dev --watch
  ```

- [ ] **Step 3: Run the API Server with Loaders**
  Start Hono with the plugin entrypoint:
  ```bash
  FLUXER_DEV=true FLUXER_PLUGIN_DIR=../../plugins npx tsx fluxer_plugins/api-loader/entry.ts
  ```

- [ ] **Step 4: Run the SPA Dev Server with Loaders**
  Run the React app with Rspack wrapper configurations:
  ```bash
  cd fluxer_app
  pnpm run dev --config ../fluxer_plugins/app-loader/rspack.config.mjs
  ```

- [ ] **Step 5: Run the Admin Proxy**
  Run the proxy forwarding to your upstream admin port:
  ```bash
  cd fluxer_plugins/admin-proxy
  pnpm install --ignore-workspace
  pnpm run build
  UPSTREAM_ADMIN_URL=http://localhost:3021 PORT=3020 node dist/index.js
  ```

---

## 3. Next Steps for `custom-badges` Plugin

Here are tasks to implement next or verify inside the plugin:

- [ ] **Verify End-to-End Badge Creation**:
  1. Open the admin page at `http://localhost:3020/admin/plugins/custom-badges/manage` (routed through the proxy).
  2. Input a user ID, icon URL, and tooltip, and click save.
  3. Verify that the badge displays in the "Configured User Badges" list.
  4. Inspect `plugins/config/custom-badges.json` on the host to verify the settings saved correctly.
  
- [ ] **Verify Client Profile Render**:
  1. Open the React app at `http://localhost:3000`.
  2. Click on a user's profile card to open the popout.
  3. Verify that custom badges render next to default ones, showing tooltips on hover and navigating to links on click.

- [ ] **Future Features & Ideas**:
  - [ ] **Badge Uploads**: Add a file upload field in the Admin page to upload badge image files directly to the server.
  - [ ] **Chat message badges**: Wrap the chat username component to display custom badges next to names in channels.
  - [ ] **Role-based auto-badges**: Create a decorator that auto-assigns badges based on a user's guild roles.
