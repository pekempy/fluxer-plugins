import type { ApiMiddlewareHook, ApiRouteHook, ApiServiceDecorator, ApiEventHook } from '../types/api.js';

export function createMiddleware(hook: ApiMiddlewareHook): ApiMiddlewareHook {
  return hook;
}

export function createRoute(hook: ApiRouteHook): ApiRouteHook {
  return hook;
}

export function decorateService(decorator: ApiServiceDecorator): ApiServiceDecorator {
  return decorator;
}

export function onEvent(hook: ApiEventHook): ApiEventHook {
  return hook;
}
