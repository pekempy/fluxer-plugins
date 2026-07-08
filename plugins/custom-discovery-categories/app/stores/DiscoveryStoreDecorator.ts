import { extendStore } from '@pekempy/fluxer-plugin-sdk/helpers/app';
import { DiscoveryCategoryLabels } from '@fluxer/constants/src/DiscoveryConstants';
import { runInAction } from 'mobx';

function patchCategoryLabels(store: any) {
  const cats = store.categories as { id: number; name: string }[];
  if (!cats || cats.length === 0) return;
  for (const cat of cats) {
    (DiscoveryCategoryLabels as Record<number, string>)[cat.id] = cat.name;
  }
  console.log('[custom-discovery-categories] Patched DiscoveryCategoryLabels with custom names:', cats.map((c) => `${c.id}=${c.name}`).join(', '));
  // If cards are already rendered, force DiscoveryPage to re-render them
  runInAction(() => {
    if (store.guilds.length > 0) {
      store.guilds = [...store.guilds];
    }
  });
}

export default extendStore({
  target: 'features/discovery/state/Discovery',
  decorate(store: any) {
    // If categories already loaded (e.g., hot-reload), patch immediately
    if (store.categoriesLoaded) {
      patchCategoryLabels(store);
    }

    // Override loadCategories to always patch labels after loading
    const originalLoadCategories = store.loadCategories.bind(store);
    store.loadCategories = async function () {
      await originalLoadCategories();
      patchCategoryLabels(store);
    };

    // Kick off the load immediately so labels are ready before cards render
    void store.loadCategories();

    return store;
  },
});
