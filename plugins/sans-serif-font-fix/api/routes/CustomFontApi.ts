// @ts-nocheck
import { createRoute } from '@pekempy/fluxer-plugin-sdk/helpers/api';
import path from 'path';

let dbClient: any = null;

async function getDB() {
  if (dbClient) return dbClient;
  try {
    const clientPath = path.resolve(process.cwd(), 'node_modules', '@pkgs', 'postgres', 'src', 'Client.js');
    const { getDefaultPostgresClient } = await import(clientPath);
    dbClient = getDefaultPostgresClient();
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS plugin_custom_font (
        user_id VARCHAR(64) PRIMARY KEY,
        enabled BOOLEAN NOT NULL DEFAULT FALSE,
        font_family TEXT NOT NULL DEFAULT ''
      )
    `);
  } catch (err) {
    console.error('[Sans-Serif Font Fix Plugin] Failed to initialize Postgres DB:', err);
  }
  return dbClient;
}

export interface CustomFontSetting {
  enabled: boolean;
  fontFamily: string;
}

export async function getCustomFontSetting(userId: string): Promise<CustomFontSetting> {
  const db = await getDB();
  if (!db) return { enabled: false, fontFamily: '' };
  try {
    const res = await db.query(
      'SELECT enabled, font_family FROM plugin_custom_font WHERE user_id = $1 LIMIT 1',
      [userId],
    );
    const row = res.rows[0];
    if (row) {
      return { enabled: !!row.enabled, fontFamily: row.font_family || '' };
    }
  } catch (err) {
    console.error('[Sans-Serif Font Fix Plugin] Failed to query custom font setting:', err);
  }
  return { enabled: false, fontFamily: '' };
}

export async function setCustomFontSetting(userId: string, setting: CustomFontSetting): Promise<void> {
  const db = await getDB();
  if (!db) return;
  try {
    await db.query(
      `
      INSERT INTO plugin_custom_font (user_id, enabled, font_family)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id)
      DO UPDATE SET enabled = EXCLUDED.enabled, font_family = EXCLUDED.font_family
      `,
      [userId, setting.enabled, setting.fontFamily],
    );
  } catch (err) {
    console.error('[Sans-Serif Font Fix Plugin] Failed to save custom font setting:', err);
  }
}

export default createRoute({
  prefix: '/v1',
  routes: (app) => {
    // GET the current user's custom font preference
    app.get('/custom-font', async (ctx) => {
      const user = ctx.get('user');
      if (!user || !user.id) {
        return ctx.json({ error: 'Unauthorized' }, 401);
      }
      const setting = await getCustomFontSetting(String(user.id));
      return ctx.json(setting);
    });

    // POST to update the current user's custom font preference
    app.post('/custom-font', async (ctx) => {
      const user = ctx.get('user');
      if (!user || !user.id) {
        return ctx.json({ error: 'Unauthorized' }, 401);
      }
      const body = await ctx.req.json();
      const setting: CustomFontSetting = {
        enabled: !!body.enabled,
        fontFamily: typeof body.fontFamily === 'string' ? body.fontFamily.slice(0, 200) : '',
      };
      await setCustomFontSetting(String(user.id), setting);
      return ctx.json({ success: true, ...setting });
    });
  },
});
