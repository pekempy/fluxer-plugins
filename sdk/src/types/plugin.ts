import type { PluginContext } from './common.js';
import type { PluginManifest } from '../manifest.js';

export interface PluginLifecycle {
  init?(context: PluginContext): Promise<void> | void;
  shutdown?(context: PluginContext): Promise<void> | void;
  api?: any;
}

export interface LoadedPlugin {
  name: string;
  manifest: PluginManifest;
  context: PluginContext;
  module: PluginLifecycle;
  pluginDir: string;
}
