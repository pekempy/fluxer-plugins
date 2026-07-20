import { createMiddleware } from '@pekempy/fluxer-plugin-sdk/helpers/api';
import { promises as fs } from 'fs';
import path from 'path';

const getPluginConfigPath = (filename: string) => {
  if (process.env.FLUXER_PLUGIN_CONFIG_DIR) {
    return path.join(process.env.FLUXER_PLUGIN_CONFIG_DIR, filename);
  }
  if (process.env.FLUXER_PLUGIN_DIR) {
    return path.join(process.env.FLUXER_PLUGIN_DIR, 'config', filename);
  }
  return path.resolve(process.cwd(), 'plugins', 'config', filename);
};

const badgesConfigPath = getPluginConfigPath('custom-badges.json');

let dbClient: any = null;

async function getDB() {
  if (dbClient) return dbClient;
  try {
    const clientPath = path.resolve(process.cwd(), 'node_modules', '@pkgs', 'postgres', 'src', 'Client.ts');
    const { getDefaultPostgresClient } = await import(clientPath);
    dbClient = getDefaultPostgresClient();
  } catch (err) {
    console.error('[Encora Privacy Plugin] Failed to import Postgres client in middleware:', err);
  }
  return dbClient;
}

async function getPrivacySetting(userId: string): Promise<boolean> {
  const db = await getDB();
  if (!db) return false;
  try {
    const res = await db.query('SELECT hide_encora FROM encora_privacy WHERE user_id = $1 LIMIT 1', [userId]);
    if (res.rows[0]) {
      return !!res.rows[0].hide_encora;
    }
  } catch (err) {
    // If the table doesn't exist yet, return false
  }
  return false;
}

async function isUserEncoraStaff(userId: string): Promise<boolean> {
  try {
    const data = await fs.readFile(badgesConfigPath, 'utf-8');
    const parsed = JSON.parse(data);
    const userBadges = parsed?.badges?.[userId] || [];
    return userBadges.some((b: any) => b.tooltip?.toLowerCase() === 'encora staff');
  } catch {
    return false;
  }
}

export default createMiddleware({
  position: 'before:ServiceMiddleware',
  handler: async (ctx: any, next: any) => {
    const pathName = ctx.req.path;
    
    // Check if this is a profile query: /v1/users/:target_id/profile
    const profileMatch = pathName.match(/^\/v1\/users\/(\d+)\/profile$/);
    // Check if this is a badges query: /v1/custom/badges/:userId
    const badgesMatch = pathName.match(/^\/v1\/custom\/badges\/(\d+)$/);

    if (!profileMatch && !badgesMatch) {
      return next();
    }

    console.log('[EncoraPrivacyMiddleware] Matching path intercepted:', pathName);

    const targetIdStr = profileMatch ? profileMatch[1] : badgesMatch![1];
    const hideEncora = await getPrivacySetting(targetIdStr);
    console.log(`[EncoraPrivacyMiddleware] Target User ID: ${targetIdStr}, Privacy Enabled: ${hideEncora}`);

    // If target user doesn't hide Encora, proceed normally
    if (!hideEncora) {
      return next();
    }

    const currentUser = ctx.get('user');
    const currentUserIdStr = currentUser ? String(currentUser.id) : '';
    console.log(`[EncoraPrivacyMiddleware] Current Viewer User ID: ${currentUserIdStr}`);

    // Owner can always see their own connections/links
    if (currentUserIdStr === targetIdStr) {
      console.log(`[EncoraPrivacyMiddleware] Viewer is owner. Bypassing filter.`);
      return next();
    }

    // Check if viewer has the Staff badge
    const isStaff = currentUserIdStr ? await isUserEncoraStaff(currentUserIdStr) : false;
    console.log(`[EncoraPrivacyMiddleware] Viewer is Staff: ${isStaff}`);
    if (isStaff) {
      console.log(`[EncoraPrivacyMiddleware] Viewer is Staff. Bypassing filter.`);
      return next();
    }

    console.log(`[EncoraPrivacyMiddleware] Proceeding to intercept and filter response...`);
    // Otherwise, intercept and filter
    await next();

    if (ctx.res.status === 200) {
      try {
        if (profileMatch) {
          const profile = await ctx.res.json();
          console.log('[EncoraPrivacyMiddleware] Original profile connected_accounts:', JSON.stringify(profile.connected_accounts));
          if (profile && Array.isArray(profile.connected_accounts)) {
            profile.connected_accounts = profile.connected_accounts.filter((conn: any) => {
              const name = String(conn.name || '').toLowerCase();
              const isEncora = name.includes('encora.it');
              if (isEncora) console.log(`[EncoraPrivacyMiddleware] Filtering out connection: ${conn.name}`);
              return !isEncora;
            });
            ctx.res = ctx.json(profile);
          }
        } else if (badgesMatch) {
          const responseData = await ctx.res.json();
          console.log('[EncoraPrivacyMiddleware] Original badges:', JSON.stringify(responseData.badges));
          if (responseData && Array.isArray(responseData.badges)) {
            responseData.badges = responseData.badges.map((badge: any) => {
              const tooltip = String(badge.tooltip || '').toLowerCase();
              const iconUrl = String(badge.iconUrl || '').toLowerCase();
              if (tooltip.includes('encora') || iconUrl.includes('encora.it')) {
                console.log(`[EncoraPrivacyMiddleware] Stripping URL link from Encora badge: ${badge.tooltip}`);
                const { url, ...cleanBadge } = badge;
                return cleanBadge;
              }
              return badge;
            });
            ctx.res = ctx.json(responseData);
          }
        }
      } catch (err) {
        console.error('[Encora Privacy Plugin] Error processing response intercept:', err);
      }
    }
  }
});
