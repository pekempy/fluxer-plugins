# Writing API Plugins

API plugins run inside `fluxer-api` (Hono framework) to modify routes, inject middleware, decorate services, and listen to database events.

---

## 1. Custom Routes

A custom route registration file exports a default route handler defined using the `createRoute` helper:

```typescript
// api/routes/CustomRoutes.ts
import { createRoute } from '@pekempy/fluxer-plugin-sdk/helpers/api';

export default createRoute({
  prefix: '/v1/custom',
  routes: (app) => {
    // Custom endpoint
    app.get('/hello', async (ctx) => {
      return ctx.json({ message: 'Hello from custom route!' });
    });

    // Endpoint accessing internal services
    app.post('/verify-user', async (ctx) => {
      const userService = ctx.get('userService'); // Injected service
      const body = await ctx.req.json();
      const user = await userService.getUserById(body.userId);
      return ctx.json({ exists: !!user });
    });
  },
});
```

---

## 2. Middleware Injection

Custom Hono middlewares can be injected relative to system middlewares:

```typescript
// api/middleware/LoggerMiddleware.ts
import { createMiddleware } from '@pekempy/fluxer-plugin-sdk/helpers/api';

export default createMiddleware(async (ctx, next) => {
  const startTime = Date.now();
  console.log(`[Plugin] Request initiated: ${ctx.req.path}`);
  await next();
  console.log(`[Plugin] Request finished in ${Date.now() - startTime}ms`);
});
```

In your manifest, configure the injection position:
```yaml
targets:
  api:
    middleware:
      - file: "./api/middleware/LoggerMiddleware.ts"
        position: "before:ServiceMiddleware"  # runs before ServiceMiddleware
```

Supported position flags:
- `before:MiddlewareName`
- `after:MiddlewareName`
- `first`
- `last`

---

## 3. Service Decoration

Service decoration allows plugins to intercept and extend internal services (e.g. `userService`, `messageService`) using a JS Proxy:

```typescript
// api/services/UserServiceDecorator.ts
import { decorateService } from '@pekempy/fluxer-plugin-sdk/helpers/api';

export default decorateService({
  decorates: 'userService',
  decorate: (originalService, context) => {
    return new Proxy(originalService, {
      get(target, prop, receiver) {
        // Intercept getUserById method
        if (prop === 'getUserById') {
          return async (userId: string) => {
            context.logger.info(`getUserById was called with id: ${userId}`);
            const user = await target.getUserById(userId);
            if (user) {
              // Inject custom plugin properties into the user object
              user.customBadge = 'Plugin Developer';
            }
            return user;
          };
        }
        return Reflect.get(target, prop, receiver);
      }
    });
  }
});
```

---

## 4. Event Hooks

Plugins can listen to system events broadcast by the Event Bus:

```typescript
// api/hooks/MessageHook.ts
import { onEvent } from '@pekempy/fluxer-plugin-sdk/helpers/api';

export default onEvent({
  event: 'message:create',
  handler: async (eventData, context) => {
    const { message } = eventData;
    context.logger.info(`Intercepted message creation: ${message.id} - content: ${message.content}`);
    
    // Perform custom checks or logging
    if (message.content.includes('forbidden-word')) {
       // Flag message
    }
  }
});
```
