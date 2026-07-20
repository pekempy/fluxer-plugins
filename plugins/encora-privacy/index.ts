import type { PluginLifecycle } from '@pekempy/fluxer-plugin-sdk';

const lifecycle: PluginLifecycle = {
  init(context) {
    console.log('[Plugin:encora-privacy] Encora Privacy Plugin initialized successfully!');
  },

  shutdown(context) {
    console.log('[Plugin:encora-privacy] Encora Privacy Plugin shut down.');
  }
};

export default lifecycle;
