export class BasePluginContext {
    name;
    manifest;
    logger;
    config;
    pluginDir;
    getPluginApiFn;
    constructor(name, manifest, logger, config, pluginDir, getPluginApiFn) {
        this.name = name;
        this.manifest = manifest;
        this.logger = logger;
        this.config = config;
        this.pluginDir = pluginDir;
        this.getPluginApiFn = getPluginApiFn;
    }
    async getPluginApi(pluginName) {
        return this.getPluginApiFn(pluginName);
    }
}
//# sourceMappingURL=context.js.map