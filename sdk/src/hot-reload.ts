export interface HotReloadSignal {
  type: 'reload' | 'restart';
  pluginName: string;
  file?: string;
}

export type HotReloadListener = (signal: HotReloadSignal) => void;

export class HotReloadRegistry {
  private static listeners = new Set<HotReloadListener>();

  static addListener(listener: HotReloadListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  static trigger(signal: HotReloadSignal): void {
    for (const listener of this.listeners) {
      try {
        listener(signal);
      } catch (err) {
        console.error('Failed to trigger hot reload listener', err);
      }
    }
  }
}
