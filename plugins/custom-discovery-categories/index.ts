import type { PluginLifecycle } from '@pekempy/fluxer-plugin-sdk';

const plugin: PluginLifecycle = {
  init(context) {
    context.logger.info('Custom discovery categories plugin initialized.');
  },
  shutdown(context) {
    context.logger.info('Custom discovery categories plugin shutdown.');
  }
};

export default plugin;
