export interface HotReloadSignal {
    type: 'reload' | 'restart';
    pluginName: string;
    file?: string;
}
export type HotReloadListener = (signal: HotReloadSignal) => void;
export declare class HotReloadRegistry {
    private static listeners;
    static addListener(listener: HotReloadListener): () => void;
    static trigger(signal: HotReloadSignal): void;
}
//# sourceMappingURL=hot-reload.d.ts.map