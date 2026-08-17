// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { wrapComponent } from '@pekempy/fluxer-plugin-sdk/helpers/app';
import { SettingsSection } from '@app/features/app/components/dialogs/shared/SettingsSection';
import { SettingsHeadingLinkButton } from '@app/features/app/components/dialogs/shared/SettingsHeadingLinkButton';
import { Switch } from '@app/features/ui/components/form/FormSwitch';
import { Combobox } from '@app/features/ui/components/form/FormCombobox';
import { APP_PROTOCOL_PREFIX } from '@app/features/ui/utils/AppProtocol';
import { http } from '@app/features/platform/transport/RestTransport';

// Using the app's own `http` client (not raw fetch) matters for two reasons:
// 1. It automatically prefixes requests with /api/v1 - the reverse proxy only
//    forwards /api/* to the actual API service (see deploy/self-hosting/Caddyfile),
//    everything else falls through to the SPA's static file server.
// 2. This app authenticates via a bearer token attached by RestTransport's
//    installAuth() (see src/app/SetupHttp.ts), not cookies - so a plain
//    fetch(), even with credentials:'include', has no way to authenticate.
const API_PATH = '/custom-font';

const FALLBACK_STACK =
  "'Fluxer Sans', 'Fluxer Sans Arabic', 'Fluxer Sans Hebrew', 'Fluxer Sans Devanagari', " +
  "'Fluxer Sans Thai Looped', 'Fluxer Sans SC', 'Fluxer Sans TC', 'Fluxer Sans JP', 'Fluxer Sans KR', " +
  "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif";

const FONT_OPTIONS = [
  // Sans-serif
  { value: 'Fluxer Sans', label: 'Fluxer Sans (default)' },
  { value: 'Inter', label: 'Inter' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Tahoma', label: 'Tahoma' },
  { value: 'Trebuchet MS', label: 'Trebuchet MS' },
  { value: 'Segoe UI', label: 'Segoe UI' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Calibri', label: 'Calibri' },
  { value: 'Candara', label: 'Candara' },
  { value: 'Corbel', label: 'Corbel' },
  { value: 'Century Gothic', label: 'Century Gothic' },
  { value: 'Franklin Gothic Medium', label: 'Franklin Gothic Medium' },
  { value: 'Lucida Sans Unicode', label: 'Lucida Sans Unicode' },
  { value: 'Noto Sans', label: 'Noto Sans' },
  { value: 'Ubuntu', label: 'Ubuntu' },
  { value: 'Arial Narrow', label: 'Arial Narrow' },
  { value: 'Geneva', label: 'Geneva' },
  // Serif
  { value: 'Georgia', label: 'Georgia (serif)' },
  { value: 'Times New Roman', label: 'Times New Roman (serif)' },
  { value: 'Garamond', label: 'Garamond (serif)' },
  { value: 'Cambria', label: 'Cambria (serif)' },
  { value: 'Book Antiqua', label: 'Book Antiqua (serif)' },
  { value: 'Palatino Linotype', label: 'Palatino Linotype (serif)' },
  { value: 'Bookman Old Style', label: 'Bookman Old Style (serif)' },
  { value: 'Constantia', label: 'Constantia (serif)' },
  { value: 'Rockwell', label: 'Rockwell (serif)' },
  { value: 'Baskerville', label: 'Baskerville (serif)' },
  { value: 'Didot', label: 'Didot (serif)' },
  { value: 'Goudy Old Style', label: 'Goudy Old Style (serif)' },
  // Monospace
  { value: 'Courier New', label: 'Courier New (monospace)' },
  { value: 'Consolas', label: 'Consolas (monospace)' },
  { value: 'Menlo', label: 'Menlo (monospace)' },
  { value: 'Monaco', label: 'Monaco (monospace)' },
  { value: 'Lucida Console', label: 'Lucida Console (monospace)' },
  { value: 'Source Code Pro', label: 'Source Code Pro (monospace)' },
  { value: 'Fira Code', label: 'Fira Code (monospace)' },
  { value: 'Cascadia Code', label: 'Cascadia Code (monospace)' },
  // Display / decorative / handwriting
  { value: 'Comic Sans MS', label: 'Comic Sans MS' },
  { value: 'Impact', label: 'Impact' },
  { value: 'Papyrus', label: 'Papyrus' },
  { value: 'Brush Script MT', label: 'Brush Script MT' },
  { value: 'Copperplate', label: 'Copperplate' },
  { value: 'Chalkboard', label: 'Chalkboard' },
  { value: 'Marker Felt', label: 'Marker Felt' },
  { value: 'Bradley Hand', label: 'Bradley Hand' },
];

function applyFont(customFont: string) {
  if (typeof document === 'undefined') return;
  const trimmed = (customFont || '').trim();
  const stack = trimmed ? `"${trimmed.replace(/"/g, '')}", ${FALLBACK_STACK}` : FALLBACK_STACK;
  document.documentElement.style.setProperty('--font-sans', stack);
}

async function fetchSetting(): Promise<{ enabled: boolean; fontFamily: string } | null> {
  try {
    const res = await http.get(API_PATH);
    const data = res?.body;
    if (!data) return null;
    return { enabled: !!data.enabled, fontFamily: typeof data.fontFamily === 'string' ? data.fontFamily : '' };
  } catch (err) {
    console.error('[sans-serif-font-fix] Failed to load custom font setting:', err);
    return null;
  }
}

async function saveSetting(enabled: boolean, fontFamily: string): Promise<void> {
  try {
    await http.post(API_PATH, { body: { enabled, fontFamily } });
  } catch (err) {
    console.error('[sans-serif-font-fix] Failed to save custom font setting:', err);
  }
}

function resolveFontInput(inputValue: string, options: ReadonlyArray<{ value: string; label: string }>) {
  const trimmed = inputValue.trim();
  if (!trimmed) return undefined;
  const lowered = trimmed.toLowerCase();
  const match = options.find(
    (option) => option.value.toLowerCase() === lowered || option.label.toLowerCase() === lowered,
  );
  return match ? match.value : trimmed;
}

const AppearanceTabWrapper = ({ OriginalComponent, ...props }) => {
  const [customFont, setCustomFont] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const setting = await fetchSetting();
      if (!active || !setting) {
        setLoaded(true);
        return;
      }
      setEnabled(setting.enabled);
      setCustomFont(setting.fontFamily);
      if (setting.enabled && setting.fontFamily) applyFont(setting.fontFamily);
      setLoaded(true);
    })();
    return () => {
      active = false;
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  // Persist to the server, debounced slightly so rapid toggle+select clicks
  // don't fire duplicate requests.
  const persist = useCallback((nextEnabled: boolean, nextFont: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void saveSetting(nextEnabled, nextFont);
    }, 150);
  }, []);

  const handleToggle = useCallback(
    (value: boolean) => {
      setEnabled(value);
      applyFont(value ? customFont : '');
      persist(value, customFont);
    },
    [customFont, persist],
  );

  const handleFontChange = useCallback(
    (value: string) => {
      setCustomFont(value);
      if (enabled) applyFont(value);
      persist(enabled, value);
    },
    [enabled, persist],
  );

  const sectionLinkHref = useMemo(
    () => `${APP_PROTOCOL_PREFIX}settings/user?${new URLSearchParams({ tab: 'appearance', section: 'custom-font' }).toString()}`,
    [],
  );

  return (
    <>
      <OriginalComponent {...props} />
      {loaded && (
        <SettingsSection
          id="custom-font"
          title="Custom Font"
          description="Fluxer always falls back to a sans-serif system font by default. Turn this on to pick your own font instead. Saved to your account, so it follows you across devices and browsers."
          linkable={false}
          actions={
            <SettingsHeadingLinkButton
              href={sectionLinkHref}
              data-flx="user.appearance-tab.custom-font.settings-heading-link-button"
            />
          }
          data-flx="user.appearance-tab.custom-font.settings-section"
        >
          <Switch
            label="Use a custom font"
            value={enabled}
            onChange={handleToggle}
            data-flx="user.appearance-tab.custom-font.switch"
          />
          {enabled && (
            <div style={{ marginTop: '12px', maxWidth: '360px' }}>
              <Combobox
                label="Font family"
                placeholder="Search or type any font name…"
                value={customFont}
                options={FONT_OPTIONS}
                onChange={handleFontChange}
                isSearchable
                isClearable
                autoSelectValueFromInput={resolveFontInput}
                renderOption={(option) => (
                  <span style={{ fontFamily: `"${option.value}", sans-serif` }}>{option.label}</span>
                )}
                data-flx="user.appearance-tab.custom-font.combobox"
              />
            </div>
          )}
        </SettingsSection>
      )}
    </>
  );
};

export default wrapComponent(AppearanceTabWrapper);
