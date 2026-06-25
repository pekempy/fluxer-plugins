import type { PluginContext, PluginLogger, PluginConfigStore } from './types/common.js';

export class BasePluginContext implements PluginContext {
  constructor(
    public name: string,
    public manifest: any,
    public logger: PluginLogger,
    public config: PluginConfigStore,
    public pluginDir: string,
    private getPluginApiFn: (name: string) => Promise<any>
  ) {}

  async getPluginApi<T = any>(pluginName: string): Promise<T | undefined> {
    return this.getPluginApiFn(pluginName);
  }
}
