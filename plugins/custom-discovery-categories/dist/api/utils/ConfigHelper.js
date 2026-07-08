import { promises as fs } from 'fs';
import path from 'path';
const configDir = process.env.FLUXER_PLUGIN_CONFIG_DIR || path.resolve(process.cwd(), 'plugin-config');
const configPath = path.join(configDir, 'custom-discovery-categories.json');
export const DEFAULT_CATEGORIES = [
    { id: 0, name: 'Gaming' },
    { id: 1, name: 'Music' },
    { id: 2, name: 'Entertainment' },
    { id: 3, name: 'Education' },
    { id: 4, name: 'Science & technology' },
    { id: 5, name: 'Content creator' },
    { id: 6, name: 'Anime & manga' },
    { id: 7, name: 'Movies & TV' },
    { id: 8, name: 'Other' }
];
let cachedCategoryIds = DEFAULT_CATEGORIES.map(c => c.id);
export function getCustomCategoryIds() {
    return cachedCategoryIds;
}
export function updateCustomCategoryIds(categories) {
    cachedCategoryIds = categories.map(c => c.id);
}
export async function getCategories() {
    try {
        const data = await fs.readFile(configPath, 'utf-8');
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
            updateCustomCategoryIds(parsed);
            return parsed;
        }
        updateCustomCategoryIds(DEFAULT_CATEGORIES);
        return DEFAULT_CATEGORIES;
    }
    catch (err) {
        console.error('[Custom Discovery Categories ConfigHelper] Failed to read or parse config file:', err?.message || err);
        updateCustomCategoryIds(DEFAULT_CATEGORIES);
        return DEFAULT_CATEGORIES;
    }
}
export async function saveCategories(categories) {
    try {
        await fs.mkdir(path.dirname(configPath), { recursive: true });
        await fs.writeFile(configPath, JSON.stringify(categories, null, 2), 'utf-8');
        updateCustomCategoryIds(categories);
    }
    catch (err) {
        console.error('[Custom Discovery Categories] Failed to save config:', err);
    }
}
//# sourceMappingURL=ConfigHelper.js.map