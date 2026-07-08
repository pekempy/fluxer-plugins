import { createMiddleware } from '@pekempy/fluxer-plugin-sdk/helpers/api';
import { getCategories, getCustomCategoryIds } from '../utils/ConfigHelper.js';

let patchApplied = false;

function applySetPatch() {
  if (patchApplied) return;
  patchApplied = true;

  const originalHas = Set.prototype.has;
  Set.prototype.has = function (this: Set<any>, value: any): boolean {
    // Identify the target validation Set: it has exactly size 9 and contains all default category IDs (0 to 8)
    const isCategorySet = this.size === 9 &&
      [0, 1, 2, 3, 4, 5, 6, 7, 8].every(v => originalHas.call(this, v));

    if (isCategorySet) {
      const customIds = getCustomCategoryIds();
      return customIds.includes(Number(value));
    }

    return originalHas.call(this, value);
  };
}

export default createMiddleware({
  position: 'before:ServiceMiddleware',
  handler: async (ctx: any, next: any) => {
    // Apply the Set.prototype.has monkeypatch on first request inside the API process
    applySetPatch();

    const pathName = ctx.req.path;
    const isCategoryRequest = pathName === '/discovery/categories' || pathName === '/v1/discovery/categories';
    const isDiscoveryModify = pathName.includes('/discovery') && (ctx.req.method === 'POST' || ctx.req.method === 'PATCH' || ctx.req.method === 'PUT');

    if (isCategoryRequest || isDiscoveryModify) {
      try {
        const categories = await getCategories();
        
        if (isCategoryRequest) {
          return ctx.json(categories);
        }
      } catch (err) {
        console.error('[SyncCategoriesMiddleware] Failed to sync discovery categories:', err);
      }
    }

    await next();
  }
});
