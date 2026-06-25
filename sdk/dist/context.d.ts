import type { PluginContext, PluginLogger, PluginConfigStore } from './types/common.js';
export declare class BasePluginContext implements PluginContext {
    name: string;
    manifest: any;
    logger: PluginLogger;
    config: PluginConfigStore;
    pluginDir: string;
    private getPluginApiFn;
    constructor(name: string, manifest: any, logger: PluginLogger, config: PluginConfigStore, pluginDir: string, getPluginApiFn: (name: string) => Promise<any>);
    getPluginApi<T = any>(pluginName: string): Promise<T | undefined>;
}
//# sourceMappingURL=context.d.ts.map