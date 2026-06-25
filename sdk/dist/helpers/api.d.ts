import type { ApiMiddlewareHook, ApiRouteHook, ApiServiceDecorator, ApiEventHook } from '../types/api.js';
export declare function createMiddleware(hook: ApiMiddlewareHook): ApiMiddlewareHook;
export declare function createRoute(hook: ApiRouteHook): ApiRouteHook;
export declare function decorateService(decorator: ApiServiceDecorator): ApiServiceDecorator;
export declare function onEvent(hook: ApiEventHook): ApiEventHook;
//# sourceMappingURL=api.d.ts.map