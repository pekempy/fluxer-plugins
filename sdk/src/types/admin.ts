import type { Context } from 'hono';

export interface HtmlInjection {
  selector: string;
  position: 'prepend' | 'append' | 'replace' | 'before' | 'after';
  fragment: string; // HTML string or path to HTML fragment file
}

export interface AdminNav {
  label: string;
  icon?: string;
  section?: string; // defaults to 'plugins'
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
  route: string; // Pattern or exact path to intercept e.g. "/users/:id"
  handler: (content: string, ctx: Context) => Promise<string> | string;
}

export interface AdminApi {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  handler: (ctx: Context) => Promise<any> | any;
}
