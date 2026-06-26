# Fluxer Plugin System

> [!WARNING]
> This codebase contains AI-generated code. It has not been fully audited or reviewed and should **NOT** be relied upon for anything relating to security. Perform a complete manual code and security review before deploying or relying on this system in production environments.

The Fluxer Plugin System allows you to extend and modify the behavior of the `fluxer-api` (backend), `fluxer-app` (React/MobX frontend SPA), and `fluxer-admin` (admin panel dashboard) **without modifying the upstream source code**, ensuring 100% clean merges.

This workspace contains:
*   `api-loader/`: Intercepts Hono context and registers custom Hono middleware/routes on the API server.
*   `app-loader/`: Rspack configuration wrapper that generates decorators and injectors to override frontend components at compile-time.
*   `admin-proxy/`: Sidecar service that intercepts admin panel traffic, injects HTML templates, and hosts dashboard pages.
*   `cli/`: CLI utility (`@pekempy/fluxer-plugin-cli`) to scaffold, validate, build, install, and manage plugins.
*   `sdk/`: Shared TypeScript helper types and functions.
*   `plugins/`: The folder containing active plugins (e.g. `custom-badges`).

---

## How to Get It Working

### 1. Docker Compose Configurations

To enable the plugin system on a production/self-hosted deployment, your `compose.yaml` should incorporate the following overlays:

#### A. Backend services (`api` and `worker`)
Override their commands and mount the plugin loaders:
```yaml
  api:
    command: ["./node_modules/.bin/tsx", "api-loader/entry.ts"]
    environment:
      FLUXER_PLUGIN_DIR: /fluxer-plugins/plugins
      FLUXER_PLUGINS_ENABLED: "true"
      FLUXER_PLUGIN_CONFIG_DIR: /plugin-config
    volumes:
      - ../../../fluxer-plugins:/fluxer-plugins:ro
      - plugins-loader-share:/usr/src/app/fluxer_plugins:ro
      - plugin-config:/plugin-config

  worker:
    command: ["./node_modules/.bin/tsx", "api-loader/entry.ts"]
    environment:
      FLUXER_PLUGIN_DIR: /fluxer-plugins/plugins
      FLUXER_PLUGINS_ENABLED: "true"
      FLUXER_PLUGIN_CONFIG_DIR: /plugin-config
    volumes:
      - ../../../fluxer-plugins:/fluxer-plugins:ro
      - plugins-loader-share:/usr/src/app/fluxer_plugins:ro
      - plugin-config:/plugin-config
```

#### B. Admin Proxy services (`admin` and `admin-upstream`)
Run the original admin container on an internal service named `admin-upstream`, and spin up the Hono admin proxy on the `admin` service name to intercept traffic:
```yaml
  admin-upstream:
    image: ghcr.io/fluxerapp/fluxer-admin:v1
    # Original admin configurations go here...

  admin:
    build:
      context: ./fluxer_plugins
      dockerfile: admin-proxy/Dockerfile
    environment:
      UPSTREAM_ADMIN_URL: http://admin-upstream:8080
      FLUXER_PLUGIN_DIR: /fluxer-plugins/plugins
      PORT: "8080"
      FLUXER_PLUGIN_CONFIG_DIR: /plugin-config
    volumes:
      - ../../../fluxer-plugins:/fluxer-plugins:ro
      - plugin-config:/plugin-config
```

#### C. Ephemeral SPA builder (`app-builder`)
Add a service to compile the React frontend bundle with plugin modules:
```yaml
  app-builder:
    image: node:24-bookworm-slim
    working_dir: /workspace
    command: >
      bash -c "
        apt-get update && apt-get install -y curl build-essential clang &&
        [ -f \"$$HOME/.cargo/env\" ] && . \"$$HOME/.cargo/env\";
        if ! command -v cargo &> /dev/null; then
          curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable --target wasm32-unknown-unknown &&
          . \"$$HOME/.cargo/env\";
        fi &&
        corepack enable && corepack prepare pnpm@10.29.3 --activate &&
        pnpm install &&
        cd fluxer_app &&
        pnpm wasm:codegen && pnpm generate:colors && pnpm generate:message-layout && pnpm generate:theme-variables && pnpm generate:masks && pnpm generate:css-types && pnpm lingui:compile && rm -rf dist &&
        npx rspack build --mode production --config /workspace/fluxer_plugins/app-loader/rspack.config.mjs &&
        pnpm tsx scripts/build-sw.mjs &&
        rm -rf /assets/* &&
        cp -r dist/* /assets/
      "
    volumes:
      - ../../../fluxer-fork:/workspace
      - app-assets:/assets
      - ../../../fluxer-plugins/plugins:/workspace/plugins:ro
      - ../../../fluxer-plugins:/workspace/fluxer_plugins
```

---

### 2. Caddy / Content-Security-Policy (CSP) Adjustments

If your plugins load assets from external sources (e.g. badge icons from `encora.it` or `prelude.chat`), you must modify the `Caddyfile` to permit these connections. Add a search-and-replace `header_down` rewrite block within Caddy's routing handler for the `app-proxy`:

```caddy
handle {
    reverse_proxy app-proxy:8080 {
        header_down Content-Security-Policy "img-src " "img-src https://encora.it https://*.encora.it https://prelude.chat https://*.prelude.chat "
    }
}
```

---

### 3. How to Manage and Install Plugins

You can manage plugins using the CLI tool. 

#### A. Build the CLI Tool
Before running CLI commands, compile it locally:
```bash
cd cli/
pnpm install
pnpm run build
```

#### B. CLI Usage
*   **Install a Plugin**:
    ```bash
    node dist/index.js install github:user/repo[@ref]
    ```
*   **Uninstall a Plugin**:
    ```bash
    node dist/index.js uninstall <plugin-name>
    ```
*   **List Installed Plugins**:
    ```bash
    node dist/index.js list
    ```

---

### 4. How to Develop & Build Plugins

Each plugin folder contains a `tsconfig.json` and its source code. To write and build a plugin:

#### A. Scaffold a Plugin
```bash
node dist/index.js init my-plugin --target api,app,admin
```

#### B. Local Compilation
To compile a plugin's TypeScript files for backend/admin execution:
```bash
# Verify the manifest structure and target files
node dist/index.js validate ../plugins/my-plugin

# Compile code to the plugin's /dist folder
node dist/index.js build ../plugins/my-plugin
```

For live development, you can start the compiler watcher:
```bash
node dist/index.js dev --watch
```

#### C. Exclude frontend files from tsc
Ensure your plugin's `tsconfig.json` has `app` listed in the `exclude` block so that `tsc` compiles only backend/admin code (frontend components are resolved and compiled directly by Rspack in the `app-builder` container):
```json
  "exclude": [
    "node_modules",
    "dist",
    "app"
  ]
```
