import { createRoute } from '@pekempy/fluxer-plugin-sdk/helpers/api';
import { promises as fs } from 'fs';
import path from 'path';
const configPath = path.resolve(process.cwd(), 'plugins', 'config', 'custom-badges.json');
export async function getBadgesMap() {
    try {
        const data = await fs.readFile(configPath, 'utf-8');
        const parsed = JSON.parse(data);
        return parsed.badges || {};
    }
    catch {
        return {};
    }
}
export async function saveBadgesMap(map) {
    try {
        await fs.mkdir(path.dirname(configPath), { recursive: true });
        await fs.writeFile(configPath, JSON.stringify({ badges: map }, null, 2), 'utf-8');
    }
    catch (err) {
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
            // Retrieve existing Encora badge database record if present (raw DB query fallback)
            try {
                let customBadgeUrl = null;
                let customBadgeLink = null;
                // Try Postgres KV first
                try {
                    const clientPath = path.resolve(process.cwd(), 'fluxer_api', 'pkgs', 'postgres', 'src', 'Client.js');
                    const { getDefaultPostgresClient } = await import(clientPath);
                    const client = getDefaultPostgresClient();
                    const result = await client.query(`SELECT row_data FROM "${client.kvTable()}" WHERE table_name = $1 AND row_key = $2 LIMIT 1`, ['users', String(userId)]);
                    const row = result.rows[0];
                    if (row && row.row_data) {
                        const rowData = typeof row.row_data === 'string' ? JSON.parse(row.row_data) : row.row_data;
                        if (rowData) {
                            customBadgeUrl = rowData.custom_badge_url || rowData.customBadgeUrl || null;
                            customBadgeLink = rowData.custom_badge_link || rowData.customBadgeLink || null;
                        }
                    }
                }
                catch (pgErr) {
                    // If Postgres fails, try Cassandra
                    try {
                        const cassandraPath = path.resolve(process.cwd(), 'fluxer_api', 'pkgs', 'cassandra', 'src', 'Client.js');
                        const { getClient } = await import(cassandraPath);
                        const client = getClient();
                        const result = await client.execute('SELECT custom_badge_url, custom_badge_link FROM users WHERE user_id = ? LIMIT 1', [BigInt(userId)], { prepare: true });
                        const row = result.first();
                        if (row) {
                            customBadgeUrl = row.custom_badge_url || row.customBadgeUrl || null;
                            customBadgeLink = row.custom_badge_link || row.customBadgeLink || null;
                        }
                    }
                    catch (casErr) {
                        // Ignore if both fail
                    }
                }
                if (customBadgeUrl) {
                    const hasEncora = userBadges.some(b => b.iconUrl === customBadgeUrl);
                    if (!hasEncora) {
                        userBadges.unshift({
                            iconUrl: customBadgeUrl,
                            tooltip: 'Linked Encora Profile',
                            url: customBadgeLink || undefined
                        });
                    }
                }
            }
            catch (err) {
                // Fallback gracefully
            }
            // Fallback: Check verified encora.it domain connection in standard connections table
            try {
                const connectionService = ctx.get('connectionService');
                if (connectionService) {
                    const bigIntUserId = BigInt(userId);
                    const connections = await connectionService.getConnectionsForUser(bigIntUserId);
                    if (Array.isArray(connections)) {
                        const encoraConn = connections.find((c) => c.connection_type === 'domain' &&
                            c.verified &&
                            (c.name.includes('encora.it/traders/') || c.name.startsWith('encora.it/')));
                        if (encoraConn) {
                            let slug = '';
                            if (encoraConn.name.includes('encora.it/traders/')) {
                                slug = encoraConn.name.split('encora.it/traders/')[1] || '';
                            }
                            else if (encoraConn.name.includes('encora.it/')) {
                                slug = encoraConn.name.split('encora.it/')[1] || '';
                            }
                            const badgeUrl = 'https://encora.it/images/favicon.png';
                            const hasEncora = userBadges.some(b => b.iconUrl === badgeUrl);
                            if (!hasEncora) {
                                userBadges.unshift({
                                    iconUrl: badgeUrl,
                                    tooltip: 'Linked Encora Profile',
                                    url: `https://encora.it/traders/${slug}`
                                });
                            }
                        }
                    }
                }
            }
            catch (err) {
                // Fallback gracefully
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
//# sourceMappingURL=BadgesApi.js.map