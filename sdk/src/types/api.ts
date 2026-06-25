import type { Context, Hono, Next } from 'hono';
import type { PluginContext } from './common.js';

export type ApiMiddlewareHandler = (ctx: Context, next: Next) => Promise<Response | void | undefined> | Response | void | undefined;

export interface ApiMiddlewareHook {
  position: string; // e.g. "before:UserMiddleware", "first", "last"
  handler: ApiMiddlewareHandler;
}

export interface ApiRouteHook {
  prefix: string;
  routes: (app: Hono<any>) => void;
}

export interface ApiServiceDecoratorContext {
  ctx: Context;
  eventBus: any;
  pluginContext: PluginContext;
}

export interface ApiServiceDecorator {
  decorates: string; // Name of service e.g. "userService"
  decorate: (originalService: any, context: ApiServiceDecoratorContext) => any;
}

export interface ApiEventHook {
  event: string;
  handler: (data: any, pluginContext: PluginContext) => Promise<void> | void;
}
