import { createAdminApi } from '@pekempy/fluxer-plugin-sdk/helpers/admin';
import { renderDashboardHtml } from '../pages/ManageCategories.js';
import { getCategories, saveCategories, DEFAULT_CATEGORIES } from '../../api/utils/ConfigHelper.js';
export default createAdminApi({
    method: 'POST',
    path: '/plugins/custom-discovery-categories/api/save',
    handler: async (ctx) => {
        const body = await ctx.req.parseBody();
        const action = body.action;
        let categories = await getCategories();
        if (action === 'delete-category') {
            const categoryIdRaw = body.categoryId;
            if (categoryIdRaw !== undefined) {
                const categoryId = parseInt(categoryIdRaw, 10);
                categories = categories.filter(c => c.id !== categoryId);
                await saveCategories(categories);
            }
        }
        else if (action === 'add-category') {
            const categoryIdRaw = body.categoryId;
            const categoryName = (body.categoryName || '').trim();
            if (categoryIdRaw !== undefined && categoryName) {
                const categoryId = parseInt(categoryIdRaw, 10);
                // Remove existing category if it has the same ID
                categories = categories.filter(c => c.id !== categoryId);
                categories.push({ id: categoryId, name: categoryName });
                // Sort by ID ascending
                categories.sort((a, b) => a.id - b.id);
                await saveCategories(categories);
            }
        }
        else if (action === 'reset-defaults') {
            categories = [...DEFAULT_CATEGORIES];
            await saveCategories(categories);
        }
        // Return the updated dashboard HTML directly for HTMX to swap in
        return ctx.html(renderDashboardHtml(categories));
    }
});
//# sourceMappingURL=save.js.map