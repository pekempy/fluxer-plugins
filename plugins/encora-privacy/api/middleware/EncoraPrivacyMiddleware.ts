import { createMiddleware } from '@pekempy/fluxer-plugin-sdk/helpers/api';
import { promises as fs } from 'fs';
import path from 'path';

const configPath = process.env.FLUXER_PLUGIN_CONFIG_DIR
  ? path.join(process.env.FLUXER_PLUGIN_CONFIG_DIR, 'encora-privacy.json')
  : path.resolve(process.cwd(), 'plugins', 'config', 'encora-privacy.json');

const badgesConfigPath = process.env.FLUXER_PLUGIN_CONFIG_DIR
  ? path.join(process.env.FLUXER_PLUGIN_CONFIG_DIR, 'custom-badges.json')
  : path.resolve(process.cwd(), 'plugins', 'config', 'custom-badges.json');

let privacyMap: Record<string, boolean> = {};
let lastLoadTime = 0;

async function loadPrivacyConfig() {
  if (Date.now() - lastLoadTime < 2000) return;
  try {
    const data = await fs.readFile(configPath, 'utf-8');
    privacyMap = JSON.parse(data) || {};
    lastLoadTime = Date.now();
  } catch {
    privacyMap = {};
  }
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

    await loadPrivacyConfig();

    const targetIdStr = profileMatch ? profileMatch[1] : badgesMatch![1];

    // If target user doesn't hide Encora, proceed normally
    if (!privacyMap[targetIdStr]) {
      return next();
    }

    const currentUser = ctx.get('user');
    const currentUserIdStr = currentUser ? String(currentUser.id) : '';

    // Owner can always see their own connections/links
    if (currentUserIdStr === targetIdStr) {
      return next();
    }

    // Check if viewer has the Staff badge
    const isStaff = currentUserIdStr ? await isUserEncoraStaff(currentUserIdStr) : false;
    if (isStaff) {
      return next();
    }

    // Otherwise, intercept and filter
    await next();

    if (ctx.res.status === 200) {
      try {
        if (profileMatch) {
          const profile = await ctx.res.json();
          if (profile && Array.isArray(profile.connections)) {
            profile.connections = profile.connections.filter((conn: any) => {
              const name = String(conn.name || '').toLowerCase();
              return !name.includes('encora.it');
            });
            ctx.res = ctx.json(profile);
          }
        } else if (badgesMatch) {
          const responseData = await ctx.res.json();
          if (responseData && Array.isArray(responseData.badges)) {
            responseData.badges = responseData.badges.map((badge: any) => {
              const tooltip = String(badge.tooltip || '').toLowerCase();
              const iconUrl = String(badge.iconUrl || '').toLowerCase();
              if (tooltip.includes('encora') || iconUrl.includes('encora.it')) {
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
