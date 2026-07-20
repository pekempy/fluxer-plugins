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
    // Initialize table
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS encora_privacy (
        user_id VARCHAR(64) PRIMARY KEY,
        hide_encora BOOLEAN NOT NULL DEFAULT FALSE
      )
    `);
  } catch (err) {
    console.error('[Encora Privacy Plugin] Failed to initialize Postgres DB:', err);
  }
  return dbClient;
}

export async function getPrivacySetting(userId: string): Promise<boolean> {
  const db = await getDB();
  if (!db) return false;
  try {
    const res = await db.query('SELECT hide_encora FROM encora_privacy WHERE user_id = $1 LIMIT 1', [userId]);
    if (res.rows[0]) {
      return !!res.rows[0].hide_encora;
    }
  } catch (err) {
    console.error('[Encora Privacy Plugin] Failed to query privacy setting:', err);
  }
  return false;
}

export async function setPrivacySetting(userId: string, hideEncora: boolean): Promise<void> {
  const db = await getDB();
  if (!db) return;
  try {
    await db.query(`
      INSERT INTO encora_privacy (user_id, hide_encora)
      VALUES ($1, $2)
      ON CONFLICT (user_id)
      DO UPDATE SET hide_encora = EXCLUDED.hide_encora
    `, [userId, hideEncora]);
  } catch (err) {
    console.error('[Encora Privacy Plugin] Failed to save privacy setting:', err);
  }
}

export default createRoute({
  prefix: '/v1',
  routes: (app) => {
    // GET current user preference
    app.get('/encora-privacy', async (ctx) => {
      const user = ctx.get('user');
      if (!user || !user.id) {
        return ctx.json({ error: 'Unauthorized' }, 401);
      }
      const userIdStr = String(user.id);
      const hideEncora = await getPrivacySetting(userIdStr);
      return ctx.json({ hideEncora });
    });

    // POST toggle preference
    app.post('/encora-privacy', async (ctx) => {
      const user = ctx.get('user');
      if (!user || !user.id) {
        return ctx.json({ error: 'Unauthorized' }, 401);
      }
      const body = await ctx.req.json();
      const userIdStr = String(user.id);
      const hideEncora = !!body.hideEncora;
      await setPrivacySetting(userIdStr, hideEncora);
      return ctx.json({ success: true, hideEncora });
    });
  }
});
