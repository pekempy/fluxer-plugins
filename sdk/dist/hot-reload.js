export class HotReloadRegistry {
    static listeners = new Set();
    static addListener(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    static trigger(signal) {
        for (const listener of this.listeners) {
            try {
                listener(signal);
            }
            catch (err) {
                console.error('Failed to trigger hot reload listener', err);
            }
        }
    }
}
//# sourceMappingURL=hot-reload.js.map