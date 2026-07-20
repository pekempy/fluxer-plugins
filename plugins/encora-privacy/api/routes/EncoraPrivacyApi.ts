// @ts-nocheck
import { createRoute } from '@pekempy/fluxer-plugin-sdk/helpers/api';
import { promises as fs } from 'fs';
import path from 'path';

const configPath = process.env.FLUXER_PLUGIN_CONFIG_DIR
  ? path.join(process.env.FLUXER_PLUGIN_CONFIG_DIR, 'encora-privacy.json')
  : path.resolve(process.cwd(), 'plugins', 'config', 'encora-privacy.json');

const badgesConfigPath = process.env.FLUXER_PLUGIN_CONFIG_DIR
  ? path.join(process.env.FLUXER_PLUGIN_CONFIG_DIR, 'custom-badges.json')
  : path.resolve(process.cwd(), 'plugins', 'config', 'custom-badges.json');

// Memory cache for privacy preferences
let privacyMap: Record<string, boolean> = {};

async function loadPrivacyConfig() {
  try {
    const data = await fs.readFile(configPath, 'utf-8');
    privacyMap = JSON.parse(data) || {};
  } catch {
    privacyMap = {};
  }
}

async function savePrivacyConfig() {
  try {
    await fs.mkdir(path.dirname(configPath), { recursive: true });
    await fs.writeFile(configPath, JSON.stringify(privacyMap, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Encora Privacy Plugin] Failed to save config:', err);
  }
}

// Helper to check if a user is Encora Staff
async function isUserEncoraStaff(userId: string): Promise<boolean> {
  try {
    const data = await fs.readFile(badgesConfigPath, 'utf-8');
    const parsed = JSON.parse(data);
    const userBadges = parsed?.badges?.[userId] || [];
    // Check if any badge has the tooltip "Encora Staff" (case insensitive)
    return userBadges.some((b: any) => b.tooltip?.toLowerCase() === 'encora staff');
  } catch {
    return false;
  }
}

export default createRoute({
  prefix: '/v1/encora-privacy',
  routes: (app) => {
    // Load config on startup
    void loadPrivacyConfig();

    // GET current user preference
    app.get('/', async (ctx) => {
      const user = ctx.get('user');
      if (!user || !user.id) {
        return ctx.json({ error: 'Unauthorized' }, 401);
      }
      const userIdStr = String(user.id);
      return ctx.json({ hideEncora: !!privacyMap[userIdStr] });
    });

    // POST toggle preference
    app.post('/', async (ctx) => {
      const user = ctx.get('user');
      if (!user || !user.id) {
        return ctx.json({ error: 'Unauthorized' }, 401);
      }
      const body = await ctx.req.json();
      const userIdStr = String(user.id);
      privacyMap[userIdStr] = !!body.hideEncora;
      await savePrivacyConfig();
      return ctx.json({ success: true, hideEncora: privacyMap[userIdStr] });
    });

    // Intercept profile query to filter out encora.it connection
    app.use('/users/:target_id/profile', async (ctx, next) => {
      await next();

      if (ctx.res.status === 200) {
        try {
          const targetId = ctx.req.param('target_id');
          const targetIdStr = String(targetId);

          // If target user wants to hide Encora
          if (privacyMap[targetIdStr]) {
            const currentUser = ctx.get('user');
            const currentUserIdStr = currentUser ? String(currentUser.id) : '';

            // Owner can always see their own connections
            if (currentUserIdStr !== targetIdStr) {
              const isStaff = currentUserIdStr ? await isUserEncoraStaff(currentUserIdStr) : false;

              if (!isStaff) {
                // Parse the response, strip connections that include encora.it
                const profile = await ctx.res.json();
                if (profile && Array.isArray(profile.connections)) {
                  profile.connections = profile.connections.filter((conn: any) => {
                    const name = String(conn.name || '').toLowerCase();
                    return !name.includes('encora.it');
                  });
                  ctx.res = ctx.json(profile);
                }
              }
            }
          }
        } catch (err) {
          console.error('[Encora Privacy Plugin] Error processing profile response:', err);
        }
      }
    });

    // Intercept custom badges query to remove url link from Encora badge
    app.use('/v1/custom/badges/:userId', async (ctx, next) => {
      await next();

      if (ctx.res.status === 200) {
        try {
          const targetId = ctx.req.param('userId');
          const targetIdStr = String(targetId);

          // If target user wants to hide Encora
          if (privacyMap[targetIdStr]) {
            const currentUser = ctx.get('user');
            const currentUserIdStr = currentUser ? String(currentUser.id) : '';

            // Owner can always see link
            if (currentUserIdStr !== targetIdStr) {
              const isStaff = currentUserIdStr ? await isUserEncoraStaff(currentUserIdStr) : false;

              if (!isStaff) {
                const responseData = await ctx.res.json();
                if (responseData && Array.isArray(responseData.badges)) {
                  responseData.badges = responseData.badges.map((badge: any) => {
                    // Check if this is the Encora badge (by favicon or tooltip)
                    const tooltip = String(badge.tooltip || '').toLowerCase();
                    const iconUrl = String(badge.iconUrl || '').toLowerCase();
                    if (tooltip.includes('encora') || iconUrl.includes('encora.it')) {
                      // Strip the url property so it doesn't link to the profile
                      const { url, ...cleanBadge } = badge;
                      return cleanBadge;
                    }
                    return badge;
                  });
                  ctx.res = ctx.json(responseData);
                }
              }
            }
          }
        } catch (err) {
          console.error('[Encora Privacy Plugin] Error processing custom badges response:', err);
        }
      }
    });
  }
});
