import { createRoute } from '@pekempy/fluxer-plugin-sdk/helpers/api';
export default createRoute({
    prefix: '/v1/custom',
    routes: (app) => {
        app.get('/hello', async (ctx) => {
            return ctx.json({ message: 'Hello from plugin API!' });
        });
    },
});
//# sourceMappingURL=CustomEndpoints.js.map