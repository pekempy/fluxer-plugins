import type { PluginLifecycle } from '@pekempy/fluxer-plugin-sdk';

const plugin: PluginLifecycle = {
  init(context) {
    context.logger.info('iOS Scrolling PWA Plugin initialized successfully!');
  },
  shutdown(context) {
    context.logger.info('iOS Scrolling PWA Plugin shutdown.');
  }
};

export default plugin;
