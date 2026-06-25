import type { HtmlInjection, AdminPage, AdminSettings, ResponseInterceptor, AdminApi } from '../types/admin.js';

export function injectFragment(injection: HtmlInjection): HtmlInjection {
  return injection;
}

export function createAdminPage(page: AdminPage): AdminPage {
  return page;
}

export function createSettingsPage(settings: AdminSettings): AdminSettings {
  return settings;
}

export function interceptResponse(interceptor: ResponseInterceptor): ResponseInterceptor {
  return interceptor;
}

export function createAdminApi(api: AdminApi): AdminApi {
  return api;
}
