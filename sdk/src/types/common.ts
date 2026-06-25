export interface PluginLogger {
  info(message: string, ...args: any[]): void;
  info(obj: object, message?: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  warn(obj: object, message?: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  error(obj: object, message?: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
  debug(obj: object, message?: string, ...args: any[]): void;
  fatal(message: string, ...args: any[]): void;
  fatal(obj: object, message?: string, ...args: any[]): void;
}

export interface PluginConfigStore {
  get<T>(key: string): T | undefined;
  get<T>(key: string, defaultValue: T): T;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  all(): Record<string, any>;
}

export interface PluginContext {
  name: string;
  manifest: any; // PluginManifest (avoid circular type dependency if needed)
  logger: PluginLogger;
  config: PluginConfigStore;
  pluginDir: string;
  getPluginApi<T = any>(pluginName: string): Promise<T | undefined>;
}
