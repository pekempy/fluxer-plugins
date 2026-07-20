// @ts-nocheck
import { createRoute } from '@pekempy/fluxer-plugin-sdk/helpers/api';
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

const configPath = getPluginConfigPath('encora-privacy.json');
const badgesConfigPath = getPluginConfigPath('custom-badges.json');

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
  prefix: '/v1',
  routes: (app) => {
    // Load config on startup
    void loadPrivacyConfig();

    // GET current user preference
    app.get('/encora-privacy', async (ctx) => {
      const user = ctx.get('user');
      if (!user || !user.id) {
        return ctx.json({ error: 'Unauthorized' }, 401);
      }
      const userIdStr = String(user.id);
      return ctx.json({ hideEncora: !!privacyMap[userIdStr] });
    });

    // POST toggle preference
    app.post('/encora-privacy', async (ctx) => {
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
  }
});

