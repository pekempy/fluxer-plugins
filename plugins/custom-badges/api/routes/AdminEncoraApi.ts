import { createRoute } from '@pekempy/fluxer-plugin-sdk/helpers/api';
import { createHash } from 'crypto';

function createDomainConnectionId(userId: any, identifier: string): string {
  return createHash('sha256')
    .update(`${String(userId)}:${identifier.toLowerCase()}`)
    .digest('hex');
}

export function mapConnectionToResponse(row: any) {
  return {
    id: row.connection_id,
    type: row.connection_type,
    name: row.name,
    verified: row.verified,
    visibility_flags: row.visibility_flags,
    sort_order: row.sort_order,
  };
}

export default createRoute({
  prefix: '/',
  routes: (app) => {
    // 1. Admin endpoint to link account
    app.post('/admin/users/link-encora', async (ctx) => {
      // Authorization Check
      const adminUser = ctx.get('user');
      if (!adminUser) {
        return ctx.json({ error: 'Unauthorized' }, 401);
      }

      const acls = ctx.get('adminUserAcls') || ctx.get('adminApiKeyAcls') || adminUser.acls || new Set<string>();
      const hasPermission = acls.has('*') || acls.has('user:update:flags');
      if (!hasPermission) {
        return ctx.json({ error: 'Forbidden' }, 403);
      }

      const body = await ctx.req.json();
      if (!body || !body.user_id || !body.encora_username) {
        return ctx.json({ error: 'Missing required parameters' }, 400);
      }

      const userId = BigInt(body.user_id) as any;
      const encoraUsername = body.encora_username;
      const encoraSlug = body.encora_slug ?? encoraUsername;
      const domainName = `encora.it/traders/${encoraSlug}`.toLowerCase();

      const connectionService = ctx.get('connectionService') as any;
      const gateway = ctx.get('gatewayService') as any;

      if (!connectionService || !gateway) {
        return ctx.json({ error: 'Internal Server Error: Services unavailable' }, 500);
      }

      const repository = connectionService.repository;
      if (!repository) {
        return ctx.json({ error: 'Internal Server Error: Repository unavailable' }, 500);
      }

      // Check if connection already exists
      const existing = await repository.findByTypeAndIdentifier(userId, 'domain', domainName);
      let resultRow;
      const now = new Date();

      if (existing) {
        // Update existing connection
        await repository.update(userId, 'domain', existing.connection_id, {
          name: domainName,
          verified: true,
          verified_at: existing.verified_at ?? now,
          last_verified_at: now,
        });
        resultRow = await repository.findById(userId, 'domain', existing.connection_id);
      } else {
        // Create new connection
        const count = await repository.count(userId);
        const connectionId = createDomainConnectionId(userId, domainName);
        resultRow = await repository.create({
          user_id: userId,
          connection_id: connectionId,
          connection_type: 'domain',
          identifier: domainName,
          name: domainName,
          visibility_flags: 1, // ConnectionVisibilityFlags.EVERYONE
          sort_order: count,
          verification_token: '',
          verified: true,
          verified_at: now,
          last_verified_at: now,
        });
      }

      if (!resultRow) {
        return ctx.json({ error: 'Failed to retrieve connection' }, 500);
      }

      // Broadcast gateway update to push change in real-time to active clients
      const connections = await repository.findByUserId(userId);
      await gateway.dispatchPresence({
        userId,
        event: 'USER_CONNECTIONS_UPDATE',
        data: { connections: connections.map(mapConnectionToResponse) },
      });

      return ctx.json(mapConnectionToResponse(resultRow));
    });

    // 2. Admin endpoint to unlink account
    app.delete('/admin/users/unlink-encora', async (ctx) => {
      // Authorization Check
      const adminUser = ctx.get('user');
      if (!adminUser) {
        return ctx.json({ error: 'Unauthorized' }, 401);
      }

      const acls = ctx.get('adminUserAcls') || ctx.get('adminApiKeyAcls') || adminUser.acls || new Set<string>();
      const hasPermission = acls.has('*') || acls.has('user:update:flags');
      if (!hasPermission) {
        return ctx.json({ error: 'Forbidden' }, 403);
      }

      const body = await ctx.req.json();
      if (!body || !body.user_id) {
        return ctx.json({ error: 'Missing required parameters' }, 400);
      }

      const userId = BigInt(body.user_id) as any;

      const connectionService = ctx.get('connectionService') as any;
      const gateway = ctx.get('gatewayService') as any;

      if (!connectionService || !gateway) {
        return ctx.json({ error: 'Internal Server Error: Services unavailable' }, 500);
      }

      const repository = connectionService.repository;
      if (!repository) {
        return ctx.json({ error: 'Internal Server Error: Repository unavailable' }, 500);
      }

      // Find all domain connections and delete the encora.it one
      const connections = await repository.findByUserId(userId);
      const encoraConnection = connections.find(
        (c: any) => c.connection_type === 'domain' && c.name.includes('encora.it')
      );

      if (encoraConnection) {
        await repository.delete(userId, 'domain', encoraConnection.connection_id);
      }

      // Broadcast gateway update
      const updatedConnections = await repository.findByUserId(userId);
      await gateway.dispatchPresence({
        userId,
        event: 'USER_CONNECTIONS_UPDATE',
        data: { connections: updatedConnections.map(mapConnectionToResponse) },
      });

      return ctx.body(null, 204);
    });
  }
});
