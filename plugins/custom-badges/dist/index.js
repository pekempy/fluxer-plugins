const plugin = {
    init(context) {
        context.logger.info('Plugin initialized successfully!');
    },
    shutdown(context) {
        context.logger.info('Plugin shutdown.');
    }
};
export default plugin;
//# sourceMappingURL=index.js.map