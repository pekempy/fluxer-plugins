# Fluxer Plugin System

Welcome to the Fluxer Plugin System. This system allows you to extend and modify the behavior of `fluxer-api`, `fluxer-app`, and `fluxer-admin` **without modifying the upstream source code**, ensuring 100% merge-friendliness.

---

## Table of Contents
1. [Getting Started](file:///home/pekempy/Development/Software/fluxer-fork/fluxer_plugins/docs/getting-started.md)
2. [API Plugins Guide](file:///home/pekempy/Development/Software/fluxer-fork/fluxer_plugins/docs/api-plugins.md)
3. [App Plugins Guide](file:///home/pekempy/Development/Software/fluxer-fork/fluxer_plugins/docs/app-plugins.md)
4. [Admin Plugins Guide](file:///home/pekempy/Development/Software/fluxer-fork/fluxer_plugins/docs/admin-plugins.md)
5. [Production Deployment Guide](file:///home/pekempy/Development/Software/fluxer-fork/fluxer_plugins/docs/production-deployment.md)
6. [Encora Badge Migration Guide](file:///home/pekempy/Development/Software/fluxer-fork/fluxer_plugins/docs/badges-encora-migration.md)

---

## Loader Architecture

The plugin system targets three main layers using non-intrusive runtime and build-time loaders:

```
                      +-------------------+
                      |      Browser      |
                      +---------+---------+
                                |
             +------------------+------------------+
             |                                     |
    [ Port 3000 / Web ]                    [ Port 3020 / Admin ]
             |                                     |
    +--------v--------+                   +--------v--------+
    |    App Loader   |                   |   Admin Proxy   |
    | (Rspack Wrapper)|                   |  (Hono Router)  |
    +--------+--------+                   +--------+--------+
             |                                     |
             | (Bundled App)                       | (Intercept & Decorate)
             |                                     |
    +--------v--------+                            |
    |   fluxer_app    |                   +--------v--------+
    |  (React/MobX)   |                   |  fluxer_admin   |
    +--------+--------+                   |  (Rust / Axum)  |
             |                            +-----------------+
             | (HTTP/WS API Requests)
             |
    +--------v--------+
    |    API Loader   |
    |  (Hono Wrapper) |
    +--------+--------+
             |
    +--------v--------+
    |   fluxer_api    |
    |   (Hono/Node)   |
    +-----------------+
```

### 1. API Plugin Loader (`api-loader/`)
Replaces the main entrypoint in Docker. It imports the original `createAPIApp()` function, intercepts Hono context, overrides dependency-injected services using proxy wrappers, registers custom Hono middleware before/after system middleware, and mounts new routes.

### 2. App Plugin Loader (`app-loader/`)
Uses an Rspack configuration wrapper extending the original `rspack.config.mjs`. It uses a custom NormalModuleReplacementPlugin to compile and inject React component decorators, hooks into the MobX store singletons at runtime startup, and injects customized route declarations.

### 3. Admin Plugin Proxy (`admin-proxy/`)
Acts as a reverse-proxy sidecar in front of the Rust-based `fluxer_admin`. It intercepts responses, dynamically injects HTML fragments (e.g. sidebar navigation items, custom CSS/JS scripts) using CSS-selector parsing, and hosts custom forms and endpoints to persist plugin-specific settings.

---

## CLI Reference

The `@pekempy/fluxer-plugin-cli` package provides commands to manage and develop plugins:

```bash
# Scaffold a new plugin
fluxer-plugin init my-plugin --target api,app,admin

# Validate plugin manifest and check targets exist
fluxer-plugin validate ./plugins/my-plugin

# Compile TypeScript plugin source files
fluxer-plugin build ./plugins/my-plugin

# List installed plugins and versions
fluxer-plugin list

# Get detailed info about a specific plugin
fluxer-plugin info my-plugin

# Install a plugin from a GitHub repository
fluxer-plugin install github:user/repo[@ref]

# Uninstall a plugin and run dependency checks
fluxer-plugin uninstall my-plugin

# Pull updates from GitHub for a plugin or all plugins
fluxer-plugin update my-plugin [--all]

# Run local development watchers for compilation
fluxer-plugin dev [--watch]
```

---

## Docker Setup

### Production Overlay
To run the Fluxer stack with plugins enabled in self-hosting environments, use the overlay compose file:

```bash
docker compose \
  -f deploy/self-hosting/docker-compose.yml \
  -f fluxer_plugins/docker-compose.plugins.yml \
  up --build
```

### Development Overlay
If developing in the Devcontainer, start the background compilation watcher using:

```bash
docker compose \
  -f .devcontainer/docker-compose.yml \
  -f fluxer_plugins/docker-compose.dev.yml \
  up
```

---

## Hot Reload Behavior

- **API Routes & Middleware**: Re-registered dynamically on file change by clearing node require module cache. Process restarts are bypassed for route logic edits.
- **App Components & Styles**: Utilizes Rspack Hot Module Replacement (HMR) for instant component rerendering.
- **Admin Injections & Pages**: The reverse-proxy monitors changes in plugin configs and page templates to reload HTMX partials instantly.
