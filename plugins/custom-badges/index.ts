import type { PluginLifecycle } from '@pekempy/fluxer-plugin-sdk';

const plugin: PluginLifecycle = {
  init(context) {
    context.logger.info('Plugin initialized successfully!');
  },
  shutdown(context) {
    context.logger.info('Plugin shutdown.');
  }
};

export default plugin;
