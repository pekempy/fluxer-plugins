import { createRoute } from '@pekempy/fluxer-plugin-sdk/helpers/api';
import { promises as fs } from 'fs';
import path from 'path';

const configPath = path.resolve(process.cwd(), 'plugins', 'config', 'custom-badges.json');

export interface Badge {
  iconUrl: string;
  tooltip: string;
  url?: string;
}

export async function getBadgesMap(): Promise<Record<string, Badge[]>> {
  try {
    const data = await fs.readFile(configPath, 'utf-8');
    const parsed = JSON.parse(data);
    return parsed.badges || {};
  } catch {
    return {};
  }
}

export async function saveBadgesMap(map: Record<string, Badge[]>): Promise<void> {
  try {
    await fs.mkdir(path.dirname(configPath), { recursive: true });
    await fs.writeFile(configPath, JSON.stringify({ badges: map }, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Custom Badges Plugin] Failed to save badges:', err);
  }
}

export default createRoute({
  prefix: '/v1/custom',
  routes: (app) => {
    // GET custom badges for a specific user
    app.get('/badges/:userId', async (ctx) => {
      const userId = ctx.req.param('userId');
      const badgesMap = await getBadgesMap();
      const userBadges = [...(badgesMap[userId] || [])];

      // Retrieve existing Encora badge database record if present
      try {
        const userService = ctx.get('userService') as any;
        if (userService) {
          const user = await userService.getUserById(userId);
          if (user && user.customBadgeUrl) {
            const hasEncora = userBadges.some(b => b.iconUrl === user.customBadgeUrl);
            if (!hasEncora) {
              userBadges.unshift({
                iconUrl: user.customBadgeUrl,
                tooltip: 'Linked Encora Profile',
                url: user.customBadgeLink || undefined
              });
            }
          }
        }
      } catch (err) {
        // Fallback gracefully if database columns do not exist in schema
      }

      return ctx.json({
        userId,
        badges: userBadges
      });
    });

    // POST /save to overwrite badges for a user (called by admin dashboard / API handlers)
    app.post('/badges/:userId', async (ctx) => {
      const userId = ctx.req.param('userId');
      const body = await ctx.req.json();
      
      if (!body || !Array.isArray(body.badges)) {
        return ctx.json({ ok: false, error: 'Invalid badges array' }, 400);
      }

      const badgesMap = await getBadgesMap();
      badgesMap[userId] = body.badges;
      await saveBadgesMap(badgesMap);

      return ctx.json({
        ok: true,
        userId,
        badges: badgesMap[userId]
      });
    });
  }
});
