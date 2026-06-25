import type * as React from 'react';
export type ComponentWrapperProps<Props = any> = Props & {
    OriginalComponent: React.ComponentType<Props>;
};
export type ComponentWrapper<Props = any> = React.ComponentType<ComponentWrapperProps<Props>>;
export interface StoreDecorator {
    target: string;
    decorate: (originalStore: any) => any;
}
export interface AppRouteHook {
    path: string;
    component: React.ComponentType<any>;
    parentRoute?: string;
}
export interface AppStyleHook {
    file: string;
    position?: 'first' | 'last';
}
export interface AppFeatureHook {
    directory: string;
}
//# sourceMappingURL=app.d.ts.map