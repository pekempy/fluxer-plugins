import { z } from 'zod';
export const ApiMiddlewareSchema = z.object({
    file: z.string(),
    position: z.string(), // e.g. "before:UserMiddleware", "after:ServiceMiddleware", "first", "last"
});
export const ApiRouteSchema = z.object({
    file: z.string(),
    prefix: z.string(),
});
export const ApiServiceSchema = z.object({
    file: z.string(),
    decorates: z.string(), // Name of the service to decorate
});
export const ApiHookSchema = z.object({
    event: z.string(), // Event name e.g. "message:create"
    handler: z.string(),
});
export const AppComponentSchema = z.object({
    target: z.string(), // Path to target component relative to src/
    wrapper: z.string(), // Path to wrapper component relative to plugin root
});
export const AppFeatureSchema = z.object({
    directory: z.string(), // Path to feature directory relative to plugin root
});
export const AppStoreSchema = z.object({
    target: z.string(), // Path to target store relative to src/
    decorator: z.string(), // Path to decorator relative to plugin root
});
export const AppRouteSchema = z.object({
    path: z.string(),
    component: z.string(),
    parentRoute: z.string().optional(),
});
export const AppStyleSchema = z.object({
    file: z.string(),
    position: z.enum(['first', 'last']).default('last'),
});
export const AdminInjectionSchema = z.object({
    selector: z.string(),
    position: z.enum(['prepend', 'append', 'replace', 'before', 'after']),
    fragment: z.string(),
});
export const AdminNavSchema = z.object({
    label: z.string(),
    icon: z.string().optional(),
    section: z.string().default('plugins'),
});
export const AdminPageSchema = z.object({
    path: z.string(),
    handler: z.string(),
    nav: AdminNavSchema.optional(),
});
export const AdminSettingsSchema = z.object({
    path: z.string(),
    handler: z.string(),
    nav: AdminNavSchema.optional(),
});
export const AdminInterceptorSchema = z.object({
    route: z.string(), // URL pattern to match
    handler: z.string(),
});
export const AdminApiSchema = z.object({
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).default('GET'),
    path: z.string(),
    handler: z.string(),
});
export const PluginManifestSchema = z.object({
    name: z.string().regex(/^[a-z0-9-_]+$/, {
        message: 'Plugin name must only contain alphanumeric characters, hyphens, and underscores.',
    }),
    version: z.string(),
    description: z.string().optional(),
    author: z.string().optional(),
    license: z.string().optional(),
    repository: z.string().optional(),
    dependencies: z.array(z.string()).optional(),
    tested_with: z.string().optional(),
    targets: z.object({
        api: z.object({
            middleware: z.array(ApiMiddlewareSchema).optional(),
            routes: z.array(ApiRouteSchema).optional(),
            services: z.array(ApiServiceSchema).optional(),
            hooks: z.array(ApiHookSchema).optional(),
        }).optional(),
        app: z.object({
            components: z.array(AppComponentSchema).optional(),
            features: z.array(AppFeatureSchema).optional(),
            stores: z.array(AppStoreSchema).optional(),
            routes: z.array(AppRouteSchema).optional(),
            styles: z.array(AppStyleSchema).optional(),
        }).optional(),
        admin: z.object({
            injections: z.array(AdminInjectionSchema).optional(),
            pages: z.array(AdminPageSchema).optional(),
            settings: z.array(AdminSettingsSchema).optional(),
            interceptors: z.array(AdminInterceptorSchema).optional(),
            api: z.array(AdminApiSchema).optional(),
        }).optional(),
    }).optional(),
});
//# sourceMappingURL=manifest.js.map