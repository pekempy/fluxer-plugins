import type { ComponentWrapper, StoreDecorator, AppRouteHook, AppStyleHook, AppFeatureHook } from '../types/app.js';

export function wrapComponent<Props = any>(wrapper: ComponentWrapper<Props>): ComponentWrapper<Props> {
  return wrapper;
}

export function extendStore(decorator: StoreDecorator): StoreDecorator {
  return decorator;
}

export function addRoute(route: AppRouteHook): AppRouteHook {
  return route;
}

export function addStyles(style: AppStyleHook): AppStyleHook {
  return style;
}

export function createFeature(feature: AppFeatureHook): AppFeatureHook {
  return feature;
}
