import type { PluginLifecycle } from '@pekempy/fluxer-plugin-sdk';
import { getCategories, getCustomCategoryIds } from './api/utils/ConfigHelper.js';

// Monkeypatch Set.prototype.has to bypass GuildDiscoveryService's private VALID_CATEGORY_TYPES check
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

const plugin: PluginLifecycle = {
  async init(context) {
    try {
      const categories = await getCategories();
      context.logger.info(`Initialized custom discovery categories plugin with ${categories.length} categories.`);
    } catch (err) {
      context.logger.error('Failed to initialize custom discovery categories:', err);
    }
  },
  shutdown(context) {
    context.logger.info('Custom discovery categories plugin shutdown.');
  }
};

export default plugin;
