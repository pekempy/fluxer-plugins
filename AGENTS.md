# fluxer-plugins — Agent Notes

## Plugin Philosophy (INVIOLABLE)
- **Every plugin must be individual, self-contained, and independently deployable.** No shared state between plugins.
- **Plugins MUST NOT modify upstream Fluxer code, images, or compose files.** All overrides go in `compose.plugins.yaml` only.
- **Plugins must be shareable** — another Fluxer instance should be able to drop in a plugin folder and have it work.
- **If a feature can be served cleanly via a backend API response modification, do that.** Remove any JS/client-side workarounds that duplicate it once confirmed working.
- **No dead code.** When a backend approach replaces a client-side hack, delete the hack.

## What this is
The **proper plugin SDK** for Prelude (`prelude.chat`). TypeScript plugins that load inside the Fluxer API/app process without modifying upstream Fluxer images.
## Active plugins
| Plugin | Purpose | Status |
|---|---|---|
| `custom-badges` | Badge API routes, Encora link/unlink, admin UI | ✅ Code complete |
| `custom-discovery-categories` | Discovery category overrides via middleware | ✅ Code complete |
| `encora-privacy` | Profile privacy settings | ❌ Removed (dead) |
| `ios-scrolling-pwa` | iOS PWA scrolling fix | ❌ Removed (dead) |
| `sans-serif-font-fix` | Font fix | ❌ Removed (dead) |

## Production deployment status
**Partially deployed.** The api-loader (which wires plugins into the Fluxer API process) has outstanding issues with Fluxer's internal module resolution. Currently only the **admin-proxy** is deployed for admin page injection.

The legacy `prelude-plugin-runtime` repo (`server.js`) handles badges and discovery categories until the api-loader is fully working.

## GitHub
`pekempy/fluxer-plugins` (public)
Tags trigger GA to publish:
- `ghcr.io/pekempy/fluxer-plugins:latest` — api-loader + SDK image
- `ghcr.io/pekempy/fluxer-plugins-admin:latest` — admin proxy image

Tag and push to release:
```bash
git tag v0.1.XX && git push origin main --tags
```

## Server-side files (IONOS)
- **Plugin source**: `/home/pekempy/Documents/Docker/fluxer-plugins/` (git clone of this repo)
- **Plugin config**: `/home/pekempy/Documents/Docker/fluxer-plugin-config/` (persistent JSON configs)
  - `custom-badges.json` — badge definitions and user assignments
  - `custom-discovery-categories.json` — category overrides

## Fluxer compose override
The fluxer stack (`fluxer-plugin-availability`) has a `compose.plugins.yaml` override alongside the main `compose.yaml`. This is the proper way to wire plugins — zero changes to `compose.yaml`.

Currently `compose.plugins.yaml` is empty/unused pending api-loader fix. When ready:
```yaml
# compose.plugins.yaml
services:
  api:
    working_dir: /usr/src/app/fluxer_api
    command: ["./node_modules/.bin/tsx", "../fluxer_plugins/api-loader/entry.ts"]
    volumes:
      - /home/pekempy/Documents/Docker/fluxer-plugins/api-loader:/usr/src/app/fluxer_plugins/api-loader:ro
      - /home/pekempy/Documents/Docker/fluxer-plugins/sdk:/usr/src/app/fluxer_plugins/sdk:ro
      - /home/pekempy/Documents/Docker/fluxer-plugins/plugins:/plugins:ro
      - /home/pekempy/Documents/Docker/fluxer-plugin-config:/plugin-config
    environment:
      NODE_OPTIONS: --enable-source-maps
      FLUXER_PLUGIN_DIR: /plugins
      FLUXER_PLUGINS_ENABLED: "true"
      FLUXER_PLUGIN_CONFIG_DIR: /plugin-config
  worker:
    # same as api
```
Deploy with both files:
```bash
docker compose -f compose.yaml -f compose.plugins.yaml --env-file .env up -d --no-deps api worker
```

## Writing a plugin
Each plugin lives in `plugins/<name>/` with:
- `fluxer-plugin.yaml` — manifest (name, version, targets)
- `api/routes/*.ts` — Hono route handlers
- `api/middleware/*.ts` — Hono middleware
- `app/components/*.tsx` — React component wrappers (need app-builder)
- `admin/pages/*.ts` — Admin page HTML
- `admin/api/*.ts` — Admin API handlers

See `plugins/custom-badges/` as the reference implementation.

## Known issues with api-loader
`api-loader/entry.ts` imports Fluxer internals via relative paths (`../../fluxer_api/src/`). The upstream fluxer-api image has these but internal packages like `@fluxer/hono` need path fixes. The Hono version mismatch (api-loader uses 4.12.2, Fluxer ships 4.13.14) causes `TypeError` in Fluxer's error handler when requests hit unmatched routes. The error handler's `matchedRoutes()` call receives a context from the wrong Hono app instance.

## Fluxer stack location (IONOS)
`/home/pekempy/Documents/Docker/Dockhand/data/stacks/Prelude Production/fluxer-plugin-availability/`
- `compose.yaml` — main Fluxer stack (do NOT modify directly; use override file)
- `compose.plugins.yaml` — plugin overrides (this is where changes go)
- `Caddyfile` — reverse proxy config (uses `plugin-server` not `encora-badges`)
- `.gitignore` excludes `.env`; stack is git-tracked locally
