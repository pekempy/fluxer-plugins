# Getting Started with Fluxer Plugins

This guide will walk you through creating, configuring, and testing your first plugin.

---

## 1. Scaffold a New Plugin
Run the CLI `init` command to scaffold a new plugin containing stubs for API, App, and Admin extension.

```bash
cd fluxer-fork/fluxer_plugins/cli
node dist/index.js init my-first-plugin --target api,app,admin
```

This creates a new folder in `plugins/my-first-plugin/` with the following structure:

```
plugins/my-first-plugin/
├── fluxer-plugin.yaml       # Plugin manifest
├── package.json             # Dependencies
├── tsconfig.json            # TS compiler settings
├── api/                     # Backend API handlers
│   ├── middleware/          # Custom middlewares
│   ├── routes/              # Custom endpoints
│   ├── services/            # Service decorators
│   └── hooks/               # Event hook listeners
├── app/                     # Frontend SPA code
│   ├── components/          # Component wrapper overrides
│   ├── features/            # Custom feature modules
│   └── stores/              # MobX store decorators
└── admin/                   # Admin Proxy handlers
    ├── fragments/           # HTML templates for injection
    ├── pages/               # Custom pages
    └── settings/            # Custom settings configuration
```

---

## 2. Manifest Specification (`fluxer-plugin.yaml`)

The `fluxer-plugin.yaml` file configures how the loaders inject your plugin code into each service.

```yaml
name: "my-first-plugin"
version: "1.0.0"
description: "Scaffolded Fluxer plugin"
author: "pekempy"
license: "MIT"

# Dependencies that must be auto-installed
dependencies:
  - "github:pekempy/fluxer-plugin-theme-engine@main"

# Target targets configuration
targets:
  api:
    middleware:
      - file: "./api/middleware/LoggerMiddleware.ts"
        position: "before:ServiceMiddleware"
    routes:
      - file: "./api/routes/CustomRoutes.ts"
        prefix: "/v1/custom"
    services:
      - file: "./api/services/UserServiceDecorator.ts"
        decorates: "userService"
    hooks:
      - event: "message:create"
        handler: "./api/hooks/MessageHook.ts"

  app:
    components:
      - target: "features/messaging/components/MessageContent/MessageContent"
        wrapper: "./app/components/MessageContentWrapper.tsx"
    stores:
      - target: "features/messaging/state/MessageStore"
        decorator: "./app/stores/MessageStoreDecorator.ts"
    routes:
      - path: "/plugin-page"
        component: "./app/pages/PluginPage.tsx"
    styles:
      - file: "./app/styles/plugin.css"

  admin:
    injections:
      - selector: "#sidebar-nav"
        position: "append"
        fragment: "./admin/fragments/sidebar-item.html"
    pages:
      - path: "/plugins/my-first-plugin/dashboard"
        handler: "./admin/pages/Dashboard.ts"
        nav:
          label: "Plugin Dashboard"
          icon: "chart-bar"
    settings:
      - path: "/plugins/my-first-plugin/settings"
        handler: "./admin/settings/SettingsPage.ts"
        nav:
          label: "Plugin Settings"
```

---

## 3. Verify and Compile
To verify that your plugin matches the configuration schema and compiles cleanly:

```bash
# Validate manifest structure and targets
node dist/index.js validate ../../plugins/my-first-plugin

# Compile TS files to dist/
node dist/index.js build ../../plugins/my-first-plugin
```
Once validated and built, the plugin is ready to be loaded by the API, App, and Admin runtime systems!
