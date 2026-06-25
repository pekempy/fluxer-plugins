# Production Deployment of Fluxer Plugins

This guide explains how to integrate the Fluxer Plugin System into your existing remote production server setup.

---

## Deployment Architecture

In production, the original services are containerized. The plugin system overlays onto these containers without modifying their underlying images:

1. **API / Worker**: Mounts the plugin code and loader entrypoint, overriding the runtime command.
2. **Admin Panel**: Starts a sidecar container running the Hono-based Admin Plugin Proxy, which routes and modifies traffic going to the original Rust admin service.
3. **App SPA**: Spawns an ephemeral build container (`app-builder`) that compiles the React frontend assets with active plugins, sharing the output folder with `app-proxy` using a Docker volume.

---

## Step 1: Deploy Files to Remote Server

Ensure your fork (which contains the `fluxer_plugins/` directory) is cloned on your remote server.

```bash
# Clone the repository on your remote production server
git clone https://github.com/pekempy/fluxer-fork.git /srv/fluxer
cd /srv/fluxer
```

---

## Step 2: Configure Environment Variables

Make sure you copy and configure your production environment variables. Create a `.env` file under `/srv/fluxer/deploy/self-hosting/` (or update your existing one) containing:

```env
FLUXER_DOMAIN=yourdomain.com
POSTGRES_PASSWORD=your_secure_password
MEILI_MASTER_KEY=your_meili_key
LIVEKIT_API_KEY=your_livekit_key
LIVEKIT_API_SECRET=your_livekit_secret
FLUXER_S3_ACCESS_KEY=your_s3_key
FLUXER_S3_SECRET_KEY=your_s3_secret
FLUXER_SUDO_MODE_SECRET=your_sudo_secret
FLUXER_CONNECTION_INITIATION_SECRET=your_connection_secret
FLUXER_VAPID_PUBLIC_KEY=your_vapid_pub
FLUXER_VAPID_PRIVATE_KEY=your_vapid_priv
FLUXER_GATEWAY_RPC_AUTH_TOKEN=your_rpc_token
FLUXER_MEDIA_PROXY_SECRET_KEY=your_media_secret
FLUXER_MEDIA_PROXY_UPLOAD_RELAY_SECRET_BASE64=your_upload_secret
FLUXER_ADMIN_SECRET_KEY_BASE=your_admin_secret
FLUXER_ADMIN_OAUTH_CLIENT_SECRET=your_oauth_secret
```

---

## Step 3: Run the Stack with Plugin Overlay

Start the stack by combining the base self-hosting compose file and the plugin system overlay file:

```bash
# Run from the root directory
docker compose \
  -f deploy/self-hosting/docker-compose.yml \
  -f fluxer_plugins/docker-compose.plugins.yml \
  up -d --build
```

This command will:
- Spin up Valkey, Valkey-client, PostgreSQL, SeaweedFS, and NATS.
- Run `app-builder` to compile the React SPA bundle with your custom plugin modules, writing them into the shared volume `app-assets`.
- Start the `app-proxy` container serving your newly compiled plugin-enabled React SPA assets.
- Override the `api` and `worker` start commands to run the Hono loaders.
- Run the Hono-based proxy server (`admin`) and redirect port routing to proxy inputs.

---

## Step 4: Installing Plugins on the Remote Server

You can install plugins on your remote server using either of the following approaches:

### Method A: Host Mounting (Recommended for Git updates)
Create a `plugins/` directory on the host server and manage it directly using the CLI:

```bash
# 1. Create plugins directory
mkdir -p /srv/fluxer/plugins

# 2. Build the plugin CLI locally on the host
cd /srv/fluxer/fluxer_plugins/cli
pnpm install --ignore-workspace
pnpm run build

# 3. Use the CLI tool to install plugins
node dist/index.js install github:user/plugin-repo
```

### Method B: Container Execution
If Node is not installed directly on the host machine, execute the command directly inside the running `api` container:

```bash
docker compose \
  -f deploy/self-hosting/docker-compose.yml \
  -f fluxer_plugins/docker-compose.plugins.yml \
  exec api node fluxer_plugins/cli/dist/index.js install github:user/plugin-repo
```

---

## Step 5: Verify Deployment
1. **API**: Test custom routes by visiting `https://yourdomain.com/api/v1/custom/hello`.
2. **App**: Visit `https://yourdomain.com` and verify that wrapped components render correctly.
3. **Admin**: Navigate to `https://yourdomain.com/admin` and verify that the sidebar includes the "Plugins" section and lists custom plugin settings/pages.
