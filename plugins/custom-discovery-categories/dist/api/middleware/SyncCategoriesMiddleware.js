import { createMiddleware } from '@pekempy/fluxer-plugin-sdk/helpers/api';
import { getCategories } from '../utils/ConfigHelper.js';
export default createMiddleware({
    position: 'before:ServiceMiddleware',
    handler: async (ctx, next) => {
        const pathName = ctx.req.path;
        const isCategoryRequest = pathName === '/discovery/categories' || pathName === '/v1/discovery/categories';
        const isDiscoveryModify = pathName.includes('/discovery') && (ctx.req.method === 'POST' || ctx.req.method === 'PATCH' || ctx.req.method === 'PUT');
        if (isCategoryRequest || isDiscoveryModify) {
            try {
                const categories = await getCategories();
                if (isCategoryRequest) {
                    return ctx.json(categories);
                }
            }
            catch (err) {
                console.error('[SyncCategoriesMiddleware] Failed to sync discovery categories:', err);
            }
        }
        await next();
    }
});
//# sourceMappingURL=SyncCategoriesMiddleware.js.map