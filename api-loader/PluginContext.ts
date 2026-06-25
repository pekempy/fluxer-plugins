import type { PluginContext as IPluginContext, PluginLogger, PluginConfigStore } from '@pekempy/fluxer-plugin-sdk/types/common';
import { BasePluginContext } from '@pekempy/fluxer-plugin-sdk/context';
import { Logger } from '../../fluxer_api/src/Logger.js';

export function createPluginLogger(name: string): PluginLogger {
  const childLogger = Logger.child({ plugin: name }) as any;

  return {
    info(objOrMsg: any, msgOrArgs?: any, ...args: any[]) {
      if (typeof objOrMsg === 'string') {
        childLogger.info(objOrMsg, msgOrArgs, ...args);
      } else {
        childLogger.info(objOrMsg, msgOrArgs, ...args);
      }
    },
    warn(objOrMsg: any, msgOrArgs?: any, ...args: any[]) {
      if (typeof objOrMsg === 'string') {
        childLogger.warn(objOrMsg, msgOrArgs, ...args);
      } else {
        childLogger.warn(objOrMsg, msgOrArgs, ...args);
      }
    },
    error(objOrMsg: any, msgOrArgs?: any, ...args: any[]) {
      if (typeof objOrMsg === 'string') {
        childLogger.error(objOrMsg, msgOrArgs, ...args);
      } else {
        childLogger.error(objOrMsg, msgOrArgs, ...args);
      }
    },
    debug(objOrMsg: any, msgOrArgs?: any, ...args: any[]) {
      if (typeof objOrMsg === 'string') {
        childLogger.debug(objOrMsg, msgOrArgs, ...args);
      } else {
        childLogger.debug(objOrMsg, msgOrArgs, ...args);
      }
    },
    fatal(objOrMsg: any, msgOrArgs?: any, ...args: any[]) {
      if (typeof objOrMsg === 'string') {
        childLogger.fatal(objOrMsg, msgOrArgs, ...args);
      } else {
        childLogger.fatal(objOrMsg, msgOrArgs, ...args);
      }
    },
  };
}

export class PluginContext extends BasePluginContext implements IPluginContext {
  constructor(
    name: string,
    manifest: any,
    logger: PluginLogger,
    config: PluginConfigStore,
    pluginDir: string,
    getPluginApiFn: (name: string) => Promise<any>
  ) {
    super(name, manifest, logger, config, pluginDir, getPluginApiFn);
  }
}
