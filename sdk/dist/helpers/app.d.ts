import type { ComponentWrapper, StoreDecorator, AppRouteHook, AppStyleHook, AppFeatureHook } from '../types/app.js';
export declare function wrapComponent<Props = any>(wrapper: ComponentWrapper<Props>): ComponentWrapper<Props>;
export declare function extendStore(decorator: StoreDecorator): StoreDecorator;
export declare function addRoute(route: AppRouteHook): AppRouteHook;
export declare function addStyles(style: AppStyleHook): AppStyleHook;
export declare function createFeature(feature: AppFeatureHook): AppFeatureHook;
//# sourceMappingURL=app.d.ts.map