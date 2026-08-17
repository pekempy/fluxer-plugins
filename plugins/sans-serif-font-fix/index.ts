import type { PluginLifecycle } from '@pekempy/fluxer-plugin-sdk';

const FALLBACK_STACK =
  "'Fluxer Sans', 'Fluxer Sans Arabic', 'Fluxer Sans Hebrew', 'Fluxer Sans Devanagari', " +
  "'Fluxer Sans Thai Looped', 'Fluxer Sans SC', 'Fluxer Sans TC', 'Fluxer Sans JP', 'Fluxer Sans KR', " +
  "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif";

function applyFont(customFont: string): void {
  if (typeof document === 'undefined') return;
  const trimmed = (customFont || '').trim();
  const stack = trimmed ? `"${trimmed.replace(/"/g, '')}", ${FALLBACK_STACK}` : FALLBACK_STACK;
  document.documentElement.style.setProperty('--font-sans', stack);
}

async function applyServerFontOverride(): Promise<void> {
  if (typeof fetch === 'undefined') return;
  try {
    const res = await fetch('/v1/custom-font', { credentials: 'include' });
    if (!res.ok) return; // e.g. 401 before login - nothing to apply yet
    const data = await res.json();
    if (data?.enabled && typeof data.fontFamily === 'string' && data.fontFamily.trim()) {
      applyFont(data.fontFamily);
    }
  } catch {
    // Not logged in yet, or the API isn't reachable at boot - not fatal,
    // the settings page will re-fetch and re-apply once opened.
  }
}

const plugin: PluginLifecycle = {
  init(context) {
    try {
      // The bundled stylesheet (app/styles/sans-serif-fix.css) already forces
      // the default sans-serif stack unconditionally. Here we asynchronously
      // fetch the signed-in user's saved custom font (stored server-side, not
      // in localStorage - some browsers/profiles disable Storage APIs
      // entirely) and re-apply it as early as possible on boot.
      void applyServerFontOverride();
      context.logger.info('Sans-serif font fix initialized.');
    } catch (err) {
      context.logger.error('Failed to apply stored custom font on init:', err);
    }
  },
  shutdown(context) {
    context.logger.info('Sans-serif font fix shutdown.');
  }
};

export default plugin;
