import { storeDecorations } from './generated/plugin-metadata.js';

export function setupStoreDecoration() {
  for (const dec of storeDecorations as any[]) {
    if (dec.decorator && typeof dec.decorator.decorate === 'function') {
      try {
        dec.decorator.decorate(dec.store);
      } catch (err) {
        console.error(`[App Loader] Failed to decorate store '${dec.target}':`, err);
      }
    }
  }
}
