import { createRoute } from '@pekempy/fluxer-plugin-sdk/helpers/api';
import { promises as fs } from 'fs';
import path from 'path';

const configPath = process.env.FLUXER_PLUGIN_CONFIG_DIR
  ? path.join(process.env.FLUXER_PLUGIN_CONFIG_DIR, 'custom-badges.json')
  : path.resolve(process.cwd(), 'plugins', 'config', 'custom-badges.json');

export interface Badge {
  iconUrl: string;
  tooltip: string;
  url?: string;
}

export interface DomainMapping {
  domain: string;
  iconUrl: string;
  tooltip: string;
  urlTemplate?: string;
}

export interface ConfigData {
  badges: Record<string, Badge[]>;
  domainMappings: DomainMapping[];
}

const DEFAULT_DOMAIN_MAPPINGS: DomainMapping[] = [
  {
    domain: 'encora.it',
    iconUrl: 'https://encora.it/images/favicon.png',
    tooltip: 'Linked Encora Profile',
    urlTemplate: 'https://encora.it/traders/{slug}'
  }
];

export async function getConfigData(): Promise<ConfigData> {
  try {
    const data = await fs.readFile(configPath, 'utf-8');
    const parsed = JSON.parse(data);
    return {
      badges: parsed.badges || {},
      domainMappings: parsed.domainMappings || DEFAULT_DOMAIN_MAPPINGS,
    };
  } catch {
    return {
      badges: {},
      domainMappings: DEFAULT_DOMAIN_MAPPINGS,
    };
  }
}

export async function saveConfigData(config: ConfigData): Promise<void> {
  try {
    await fs.mkdir(path.dirname(configPath), { recursive: true });
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Custom Badges Plugin] Failed to save config:', err);
  }
}

// Keep the old maps exports for compatibility if needed elsewhere
export async function getBadgesMap(): Promise<Record<string, Badge[]>> {
  const config = await getConfigData();
  return config.badges;
}

export async function saveBadgesMap(map: Record<string, Badge[]>): Promise<void> {
  const config = await getConfigData();
  config.badges = map;
  await saveConfigData(config);
}

export default createRoute({
  prefix: '/v1/custom',
  routes: (app) => {
    // GET custom badges for a specific user
    app.get('/badges/:userId', async (ctx) => {
      const userId = ctx.req.param('userId');
      const config = await getConfigData();
      const userBadges = [...(config.badges[userId] || [])];

      // Retrieve existing Encora badge database record if present (raw DB query fallback)
      try {
        let customBadgeUrl: string | null = null;
        let customBadgeLink: string | null = null;

        // Try Postgres KV first
        try {
          const clientPath = path.resolve(process.cwd(), 'fluxer_api', 'pkgs', 'postgres', 'src', 'Client.js');
          const { getDefaultPostgresClient } = await import(clientPath);
          const client = getDefaultPostgresClient();
          const result = await client.query(
            `SELECT row_data FROM "${client.kvTable()}" WHERE table_name = $1 AND row_key = $2 LIMIT 1`,
            ['users', String(userId)]
          );
          const row = result.rows[0];
          if (row && row.row_data) {
            const rowData = typeof row.row_data === 'string' ? JSON.parse(row.row_data) : row.row_data;
            if (rowData) {
              customBadgeUrl = rowData.custom_badge_url || rowData.customBadgeUrl || null;
              customBadgeLink = rowData.custom_badge_link || rowData.customBadgeLink || null;
            }
          }
        } catch (pgErr) {
          // If Postgres fails, try Cassandra
          try {
            const cassandraPath = path.resolve(process.cwd(), 'fluxer_api', 'pkgs', 'cassandra', 'src', 'Client.js');
            const { getClient } = await import(cassandraPath);
            const client = getClient();
            const result = await client.execute(
              'SELECT custom_badge_url, custom_badge_link FROM users WHERE user_id = ? LIMIT 1',
              [BigInt(userId)],
              { prepare: true }
            );
            const row = result.first();
            if (row) {
              customBadgeUrl = row.custom_badge_url || row.customBadgeUrl || null;
              customBadgeLink = row.custom_badge_link || row.customBadgeLink || null;
            }
          } catch (casErr) {
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
      } catch (err) {
        // Fallback gracefully
      }

      // Fallback: Check verified domain connections in standard connections table
      try {
        const connectionService = ctx.get('connectionService') as any;
        if (connectionService) {
          const bigIntUserId = BigInt(userId) as any;
          const connections = await connectionService.getConnectionsForUser(bigIntUserId);
          if (Array.isArray(connections)) {
            for (const conn of connections) {
              if (conn.connection_type === 'domain' && conn.verified) {
                // Find matching domain mapping
                const mapping = config.domainMappings.find(m => 
                  conn.name.toLowerCase().includes(m.domain.toLowerCase()) || 
                  conn.name.toLowerCase().startsWith(m.domain.toLowerCase())
                );
                if (mapping) {
                  // Extract slug (e.g. part after domain/)
                  let slug = '';
                  const domainIdx = conn.name.toLowerCase().indexOf(mapping.domain.toLowerCase());
                  if (domainIdx !== -1) {
                    const domainPart = conn.name.substring(domainIdx + mapping.domain.length);
                    // Strip leading slash or other format (e.g. traders/)
                    slug = domainPart.replace(/^\/(traders\/)?/, '');
                  }
                  
                  const url = mapping.urlTemplate 
                    ? mapping.urlTemplate.replace('{slug}', slug)
                    : undefined;
                  
                  const hasBadge = userBadges.some(b => b.iconUrl === mapping.iconUrl);
                  if (!hasBadge) {
                    userBadges.push({
                      iconUrl: mapping.iconUrl,
                      tooltip: mapping.tooltip,
                      url
                    });
                  }
                }
              }
            }
          }
        }
      } catch (err) {
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

      const config = await getConfigData();
      config.badges[userId] = body.badges;
      await saveConfigData(config);

      return ctx.json({
        ok: true,
        userId,
        badges: config.badges[userId]
      });
    });
  }
});
