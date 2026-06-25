import { z } from 'zod';
export declare const ApiMiddlewareSchema: z.ZodObject<{
    file: z.ZodString;
    position: z.ZodString;
}, "strip", z.ZodTypeAny, {
    file: string;
    position: string;
}, {
    file: string;
    position: string;
}>;
export declare const ApiRouteSchema: z.ZodObject<{
    file: z.ZodString;
    prefix: z.ZodString;
}, "strip", z.ZodTypeAny, {
    file: string;
    prefix: string;
}, {
    file: string;
    prefix: string;
}>;
export declare const ApiServiceSchema: z.ZodObject<{
    file: z.ZodString;
    decorates: z.ZodString;
}, "strip", z.ZodTypeAny, {
    file: string;
    decorates: string;
}, {
    file: string;
    decorates: string;
}>;
export declare const ApiHookSchema: z.ZodObject<{
    event: z.ZodString;
    handler: z.ZodString;
}, "strip", z.ZodTypeAny, {
    event: string;
    handler: string;
}, {
    event: string;
    handler: string;
}>;
export declare const AppComponentSchema: z.ZodObject<{
    target: z.ZodString;
    wrapper: z.ZodString;
}, "strip", z.ZodTypeAny, {
    target: string;
    wrapper: string;
}, {
    target: string;
    wrapper: string;
}>;
export declare const AppFeatureSchema: z.ZodObject<{
    directory: z.ZodString;
}, "strip", z.ZodTypeAny, {
    directory: string;
}, {
    directory: string;
}>;
export declare const AppStoreSchema: z.ZodObject<{
    target: z.ZodString;
    decorator: z.ZodString;
}, "strip", z.ZodTypeAny, {
    target: string;
    decorator: string;
}, {
    target: string;
    decorator: string;
}>;
export declare const AppRouteSchema: z.ZodObject<{
    path: z.ZodString;
    component: z.ZodString;
    parentRoute: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    path: string;
    component: string;
    parentRoute?: string | undefined;
}, {
    path: string;
    component: string;
    parentRoute?: string | undefined;
}>;
export declare const AppStyleSchema: z.ZodObject<{
    file: z.ZodString;
    position: z.ZodDefault<z.ZodEnum<["first", "last"]>>;
}, "strip", z.ZodTypeAny, {
    file: string;
    position: "first" | "last";
}, {
    file: string;
    position?: "first" | "last" | undefined;
}>;
export declare const AdminInjectionSchema: z.ZodObject<{
    selector: z.ZodString;
    position: z.ZodEnum<["prepend", "append", "replace", "before", "after"]>;
    fragment: z.ZodString;
}, "strip", z.ZodTypeAny, {
    position: "prepend" | "append" | "replace" | "before" | "after";
    selector: string;
    fragment: string;
}, {
    position: "prepend" | "append" | "replace" | "before" | "after";
    selector: string;
    fragment: string;
}>;
export declare const AdminNavSchema: z.ZodObject<{
    label: z.ZodString;
    icon: z.ZodOptional<z.ZodString>;
    section: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    label: string;
    section: string;
    icon?: string | undefined;
}, {
    label: string;
    icon?: string | undefined;
    section?: string | undefined;
}>;
export declare const AdminPageSchema: z.ZodObject<{
    path: z.ZodString;
    handler: z.ZodString;
    nav: z.ZodOptional<z.ZodObject<{
        label: z.ZodString;
        icon: z.ZodOptional<z.ZodString>;
        section: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        label: string;
        section: string;
        icon?: string | undefined;
    }, {
        label: string;
        icon?: string | undefined;
        section?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    path: string;
    handler: string;
    nav?: {
        label: string;
        section: string;
        icon?: string | undefined;
    } | undefined;
}, {
    path: string;
    handler: string;
    nav?: {
        label: string;
        icon?: string | undefined;
        section?: string | undefined;
    } | undefined;
}>;
export declare const AdminSettingsSchema: z.ZodObject<{
    path: z.ZodString;
    handler: z.ZodString;
    nav: z.ZodOptional<z.ZodObject<{
        label: z.ZodString;
        icon: z.ZodOptional<z.ZodString>;
        section: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        label: string;
        section: string;
        icon?: string | undefined;
    }, {
        label: string;
        icon?: string | undefined;
        section?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    path: string;
    handler: string;
    nav?: {
        label: string;
        section: string;
        icon?: string | undefined;
    } | undefined;
}, {
    path: string;
    handler: string;
    nav?: {
        label: string;
        icon?: string | undefined;
        section?: string | undefined;
    } | undefined;
}>;
export declare const AdminInterceptorSchema: z.ZodObject<{
    route: z.ZodString;
    handler: z.ZodString;
}, "strip", z.ZodTypeAny, {
    handler: string;
    route: string;
}, {
    handler: string;
    route: string;
}>;
export declare const AdminApiSchema: z.ZodObject<{
    method: z.ZodDefault<z.ZodEnum<["GET", "POST", "PUT", "DELETE", "PATCH"]>>;
    path: z.ZodString;
    handler: z.ZodString;
}, "strip", z.ZodTypeAny, {
    path: string;
    handler: string;
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
}, {
    path: string;
    handler: string;
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | undefined;
}>;
export declare const PluginManifestSchema: z.ZodObject<{
    name: z.ZodString;
    version: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    author: z.ZodOptional<z.ZodString>;
    license: z.ZodOptional<z.ZodString>;
    repository: z.ZodOptional<z.ZodString>;
    dependencies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    tested_with: z.ZodOptional<z.ZodString>;
    targets: z.ZodOptional<z.ZodObject<{
        api: z.ZodOptional<z.ZodObject<{
            middleware: z.ZodOptional<z.ZodArray<z.ZodObject<{
                file: z.ZodString;
                position: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                file: string;
                position: string;
            }, {
                file: string;
                position: string;
            }>, "many">>;
            routes: z.ZodOptional<z.ZodArray<z.ZodObject<{
                file: z.ZodString;
                prefix: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                file: string;
                prefix: string;
            }, {
                file: string;
                prefix: string;
            }>, "many">>;
            services: z.ZodOptional<z.ZodArray<z.ZodObject<{
                file: z.ZodString;
                decorates: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                file: string;
                decorates: string;
            }, {
                file: string;
                decorates: string;
            }>, "many">>;
            hooks: z.ZodOptional<z.ZodArray<z.ZodObject<{
                event: z.ZodString;
                handler: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                event: string;
                handler: string;
            }, {
                event: string;
                handler: string;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            middleware?: {
                file: string;
                position: string;
            }[] | undefined;
            routes?: {
                file: string;
                prefix: string;
            }[] | undefined;
            services?: {
                file: string;
                decorates: string;
            }[] | undefined;
            hooks?: {
                event: string;
                handler: string;
            }[] | undefined;
        }, {
            middleware?: {
                file: string;
                position: string;
            }[] | undefined;
            routes?: {
                file: string;
                prefix: string;
            }[] | undefined;
            services?: {
                file: string;
                decorates: string;
            }[] | undefined;
            hooks?: {
                event: string;
                handler: string;
            }[] | undefined;
        }>>;
        app: z.ZodOptional<z.ZodObject<{
            components: z.ZodOptional<z.ZodArray<z.ZodObject<{
                target: z.ZodString;
                wrapper: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                target: string;
                wrapper: string;
            }, {
                target: string;
                wrapper: string;
            }>, "many">>;
            features: z.ZodOptional<z.ZodArray<z.ZodObject<{
                directory: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                directory: string;
            }, {
                directory: string;
            }>, "many">>;
            stores: z.ZodOptional<z.ZodArray<z.ZodObject<{
                target: z.ZodString;
                decorator: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                target: string;
                decorator: string;
            }, {
                target: string;
                decorator: string;
            }>, "many">>;
            routes: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodString;
                component: z.ZodString;
                parentRoute: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                path: string;
                component: string;
                parentRoute?: string | undefined;
            }, {
                path: string;
                component: string;
                parentRoute?: string | undefined;
            }>, "many">>;
            styles: z.ZodOptional<z.ZodArray<z.ZodObject<{
                file: z.ZodString;
                position: z.ZodDefault<z.ZodEnum<["first", "last"]>>;
            }, "strip", z.ZodTypeAny, {
                file: string;
                position: "first" | "last";
            }, {
                file: string;
                position?: "first" | "last" | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            routes?: {
                path: string;
                component: string;
                parentRoute?: string | undefined;
            }[] | undefined;
            components?: {
                target: string;
                wrapper: string;
            }[] | undefined;
            features?: {
                directory: string;
            }[] | undefined;
            stores?: {
                target: string;
                decorator: string;
            }[] | undefined;
            styles?: {
                file: string;
                position: "first" | "last";
            }[] | undefined;
        }, {
            routes?: {
                path: string;
                component: string;
                parentRoute?: string | undefined;
            }[] | undefined;
            components?: {
                target: string;
                wrapper: string;
            }[] | undefined;
            features?: {
                directory: string;
            }[] | undefined;
            stores?: {
                target: string;
                decorator: string;
            }[] | undefined;
            styles?: {
                file: string;
                position?: "first" | "last" | undefined;
            }[] | undefined;
        }>>;
        admin: z.ZodOptional<z.ZodObject<{
            injections: z.ZodOptional<z.ZodArray<z.ZodObject<{
                selector: z.ZodString;
                position: z.ZodEnum<["prepend", "append", "replace", "before", "after"]>;
                fragment: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                position: "prepend" | "append" | "replace" | "before" | "after";
                selector: string;
                fragment: string;
            }, {
                position: "prepend" | "append" | "replace" | "before" | "after";
                selector: string;
                fragment: string;
            }>, "many">>;
            pages: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodString;
                handler: z.ZodString;
                nav: z.ZodOptional<z.ZodObject<{
                    label: z.ZodString;
                    icon: z.ZodOptional<z.ZodString>;
                    section: z.ZodDefault<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    label: string;
                    section: string;
                    icon?: string | undefined;
                }, {
                    label: string;
                    icon?: string | undefined;
                    section?: string | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                path: string;
                handler: string;
                nav?: {
                    label: string;
                    section: string;
                    icon?: string | undefined;
                } | undefined;
            }, {
                path: string;
                handler: string;
                nav?: {
                    label: string;
                    icon?: string | undefined;
                    section?: string | undefined;
                } | undefined;
            }>, "many">>;
            settings: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodString;
                handler: z.ZodString;
                nav: z.ZodOptional<z.ZodObject<{
                    label: z.ZodString;
                    icon: z.ZodOptional<z.ZodString>;
                    section: z.ZodDefault<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    label: string;
                    section: string;
                    icon?: string | undefined;
                }, {
                    label: string;
                    icon?: string | undefined;
                    section?: string | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                path: string;
                handler: string;
                nav?: {
                    label: string;
                    section: string;
                    icon?: string | undefined;
                } | undefined;
            }, {
                path: string;
                handler: string;
                nav?: {
                    label: string;
                    icon?: string | undefined;
                    section?: string | undefined;
                } | undefined;
            }>, "many">>;
            interceptors: z.ZodOptional<z.ZodArray<z.ZodObject<{
                route: z.ZodString;
                handler: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                handler: string;
                route: string;
            }, {
                handler: string;
                route: string;
            }>, "many">>;
            api: z.ZodOptional<z.ZodArray<z.ZodObject<{
                method: z.ZodDefault<z.ZodEnum<["GET", "POST", "PUT", "DELETE", "PATCH"]>>;
                path: z.ZodString;
                handler: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                path: string;
                handler: string;
                method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
            }, {
                path: string;
                handler: string;
                method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            api?: {
                path: string;
                handler: string;
                method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
            }[] | undefined;
            injections?: {
                position: "prepend" | "append" | "replace" | "before" | "after";
                selector: string;
                fragment: string;
            }[] | undefined;
            pages?: {
                path: string;
                handler: string;
                nav?: {
                    label: string;
                    section: string;
                    icon?: string | undefined;
                } | undefined;
            }[] | undefined;
            settings?: {
                path: string;
                handler: string;
                nav?: {
                    label: string;
                    section: string;
                    icon?: string | undefined;
                } | undefined;
            }[] | undefined;
            interceptors?: {
                handler: string;
                route: string;
            }[] | undefined;
        }, {
            api?: {
                path: string;
                handler: string;
                method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | undefined;
            }[] | undefined;
            injections?: {
                position: "prepend" | "append" | "replace" | "before" | "after";
                selector: string;
                fragment: string;
            }[] | undefined;
            pages?: {
                path: string;
                handler: string;
                nav?: {
                    label: string;
                    icon?: string | undefined;
                    section?: string | undefined;
                } | undefined;
            }[] | undefined;
            settings?: {
                path: string;
                handler: string;
                nav?: {
                    label: string;
                    icon?: string | undefined;
                    section?: string | undefined;
                } | undefined;
            }[] | undefined;
            interceptors?: {
                handler: string;
                route: string;
            }[] | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        api?: {
            middleware?: {
                file: string;
                position: string;
            }[] | undefined;
            routes?: {
                file: string;
                prefix: string;
            }[] | undefined;
            services?: {
                file: string;
                decorates: string;
            }[] | undefined;
            hooks?: {
                event: string;
                handler: string;
            }[] | undefined;
        } | undefined;
        app?: {
            routes?: {
                path: string;
                component: string;
                parentRoute?: string | undefined;
            }[] | undefined;
            components?: {
                target: string;
                wrapper: string;
            }[] | undefined;
            features?: {
                directory: string;
            }[] | undefined;
            stores?: {
                target: string;
                decorator: string;
            }[] | undefined;
            styles?: {
                file: string;
                position: "first" | "last";
            }[] | undefined;
        } | undefined;
        admin?: {
            api?: {
                path: string;
                handler: string;
                method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
            }[] | undefined;
            injections?: {
                position: "prepend" | "append" | "replace" | "before" | "after";
                selector: string;
                fragment: string;
            }[] | undefined;
            pages?: {
                path: string;
                handler: string;
                nav?: {
                    label: string;
                    section: string;
                    icon?: string | undefined;
                } | undefined;
            }[] | undefined;
            settings?: {
                path: string;
                handler: string;
                nav?: {
                    label: string;
                    section: string;
                    icon?: string | undefined;
                } | undefined;
            }[] | undefined;
            interceptors?: {
                handler: string;
                route: string;
            }[] | undefined;
        } | undefined;
    }, {
        api?: {
            middleware?: {
                file: string;
                position: string;
            }[] | undefined;
            routes?: {
                file: string;
                prefix: string;
            }[] | undefined;
            services?: {
                file: string;
                decorates: string;
            }[] | undefined;
            hooks?: {
                event: string;
                handler: string;
            }[] | undefined;
        } | undefined;
        app?: {
            routes?: {
                path: string;
                component: string;
                parentRoute?: string | undefined;
            }[] | undefined;
            components?: {
                target: string;
                wrapper: string;
            }[] | undefined;
            features?: {
                directory: string;
            }[] | undefined;
            stores?: {
                target: string;
                decorator: string;
            }[] | undefined;
            styles?: {
                file: string;
                position?: "first" | "last" | undefined;
            }[] | undefined;
        } | undefined;
        admin?: {
            api?: {
                path: string;
                handler: string;
                method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | undefined;
            }[] | undefined;
            injections?: {
                position: "prepend" | "append" | "replace" | "before" | "after";
                selector: string;
                fragment: string;
            }[] | undefined;
            pages?: {
                path: string;
                handler: string;
                nav?: {
                    label: string;
                    icon?: string | undefined;
                    section?: string | undefined;
                } | undefined;
            }[] | undefined;
            settings?: {
                path: string;
                handler: string;
                nav?: {
                    label: string;
                    icon?: string | undefined;
                    section?: string | undefined;
                } | undefined;
            }[] | undefined;
            interceptors?: {
                handler: string;
                route: string;
            }[] | undefined;
        } | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    version: string;
    description?: string | undefined;
    author?: string | undefined;
    license?: string | undefined;
    repository?: string | undefined;
    dependencies?: string[] | undefined;
    tested_with?: string | undefined;
    targets?: {
        api?: {
            middleware?: {
                file: string;
                position: string;
            }[] | undefined;
            routes?: {
                file: string;
                prefix: string;
            }[] | undefined;
            services?: {
                file: string;
                decorates: string;
            }[] | undefined;
            hooks?: {
                event: string;
                handler: string;
            }[] | undefined;
        } | undefined;
        app?: {
            routes?: {
                path: string;
                component: string;
                parentRoute?: string | undefined;
            }[] | undefined;
            components?: {
                target: string;
                wrapper: string;
            }[] | undefined;
            features?: {
                directory: string;
            }[] | undefined;
            stores?: {
                target: string;
                decorator: string;
            }[] | undefined;
            styles?: {
                file: string;
                position: "first" | "last";
            }[] | undefined;
        } | undefined;
        admin?: {
            api?: {
                path: string;
                handler: string;
                method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
            }[] | undefined;
            injections?: {
                position: "prepend" | "append" | "replace" | "before" | "after";
                selector: string;
                fragment: string;
            }[] | undefined;
            pages?: {
                path: string;
                handler: string;
                nav?: {
                    label: string;
                    section: string;
                    icon?: string | undefined;
                } | undefined;
            }[] | undefined;
            settings?: {
                path: string;
                handler: string;
                nav?: {
                    label: string;
                    section: string;
                    icon?: string | undefined;
                } | undefined;
            }[] | undefined;
            interceptors?: {
                handler: string;
                route: string;
            }[] | undefined;
        } | undefined;
    } | undefined;
}, {
    name: string;
    version: string;
    description?: string | undefined;
    author?: string | undefined;
    license?: string | undefined;
    repository?: string | undefined;
    dependencies?: string[] | undefined;
    tested_with?: string | undefined;
    targets?: {
        api?: {
            middleware?: {
                file: string;
                position: string;
            }[] | undefined;
            routes?: {
                file: string;
                prefix: string;
            }[] | undefined;
            services?: {
                file: string;
                decorates: string;
            }[] | undefined;
            hooks?: {
                event: string;
                handler: string;
            }[] | undefined;
        } | undefined;
        app?: {
            routes?: {
                path: string;
                component: string;
                parentRoute?: string | undefined;
            }[] | undefined;
            components?: {
                target: string;
                wrapper: string;
            }[] | undefined;
            features?: {
                directory: string;
            }[] | undefined;
            stores?: {
                target: string;
                decorator: string;
            }[] | undefined;
            styles?: {
                file: string;
                position?: "first" | "last" | undefined;
            }[] | undefined;
        } | undefined;
        admin?: {
            api?: {
                path: string;
                handler: string;
                method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | undefined;
            }[] | undefined;
            injections?: {
                position: "prepend" | "append" | "replace" | "before" | "after";
                selector: string;
                fragment: string;
            }[] | undefined;
            pages?: {
                path: string;
                handler: string;
                nav?: {
                    label: string;
                    icon?: string | undefined;
                    section?: string | undefined;
                } | undefined;
            }[] | undefined;
            settings?: {
                path: string;
                handler: string;
                nav?: {
                    label: string;
                    icon?: string | undefined;
                    section?: string | undefined;
                } | undefined;
            }[] | undefined;
            interceptors?: {
                handler: string;
                route: string;
            }[] | undefined;
        } | undefined;
    } | undefined;
}>;
export type PluginManifest = z.infer<typeof PluginManifestSchema>;
//# sourceMappingURL=manifest.d.ts.map