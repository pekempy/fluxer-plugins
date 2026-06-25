import type { Context } from 'hono';
export interface HtmlInjection {
    selector: string;
    position: 'prepend' | 'append' | 'replace' | 'before' | 'after';
    fragment: string;
}
export interface AdminNav {
    label: string;
    icon?: string;
    section?: string;
}
export interface AdminPage {
    path: string;
    handler: (ctx: Context) => Promise<string> | string;
    nav?: AdminNav;
}
export interface AdminSettings {
    path: string;
    handler: (ctx: Context) => Promise<string> | string;
    nav?: AdminNav;
}
export interface ResponseInterceptor {
    route: string;
    handler: (content: string, ctx: Context) => Promise<string> | string;
}
export interface AdminApi {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    path: string;
    handler: (ctx: Context) => Promise<any> | any;
}
//# sourceMappingURL=admin.d.ts.map