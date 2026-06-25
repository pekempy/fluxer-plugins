import { createRoute } from '@pekempy/fluxer-plugin-sdk/helpers/api';

export default createRoute({
  prefix: '/v1/custom',
  routes: (app) => {
    app.get('/hello', (ctx) => {
      return ctx.json({
        ok: true,
        message: 'Hello from the Fluxer Example Plugin!',
        timestamp: Date.now()
      });
    });
  }
});
