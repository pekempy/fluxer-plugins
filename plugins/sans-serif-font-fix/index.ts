import type { PluginLifecycle } from '@pekempy/fluxer-plugin-sdk';

// Keep this in sync with the storage key used by app/components/AppearanceTabWrapper.tsx.
const CONFIG_KEY = 'fluxer:plugin:sans-serif-font-fix:config:customFont';

const FALLBACK_STACK =
  "'Fluxer Sans', 'Fluxer Sans Arabic', 'Fluxer Sans Hebrew', 'Fluxer Sans Devanagari', " +
  "'Fluxer Sans Thai Looped', 'Fluxer Sans SC', 'Fluxer Sans TC', 'Fluxer Sans JP', 'Fluxer Sans KR', " +
  "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif";

function applyStoredFontOverride(): void {
  if (typeof document === 'undefined' || typeof localStorage === 'undefined') return;
  const raw = localStorage.getItem(CONFIG_KEY);
  if (!raw) return;
  let customFont = '';
  try {
    customFont = JSON.parse(raw);
  } catch {
    customFont = raw;
  }
  const trimmed = (customFont || '').trim();
  if (!trimmed) return;
  const stack = `"${trimmed.replace(/"/g, '')}", ${FALLBACK_STACK}`;
  document.documentElement.style.setProperty('--font-sans', stack);
}

const plugin: PluginLifecycle = {
  init(context) {
    try {
      // The bundled stylesheet (app/styles/sans-serif-fix.css) already forces the
      // default sans-serif stack unconditionally. Here we only need to re-apply
      // a user-configured custom font as early as possible on boot, so it's in
      // place before the settings dialog is even opened.
      applyStoredFontOverride();
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
