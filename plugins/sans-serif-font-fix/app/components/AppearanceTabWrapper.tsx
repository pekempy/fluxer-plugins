// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { wrapComponent } from '@pekempy/fluxer-plugin-sdk/helpers/app';
import { SettingsSection } from '@app/features/app/components/dialogs/shared/SettingsSection';
import { SettingsHeadingLinkButton } from '@app/features/app/components/dialogs/shared/SettingsHeadingLinkButton';
import { Switch } from '@app/features/ui/components/form/FormSwitch';
import { Combobox } from '@app/features/ui/components/form/FormCombobox';
import { APP_PROTOCOL_PREFIX } from '@app/features/ui/utils/AppProtocol';

const API_PATH = '/v1/custom-font';

const FALLBACK_STACK =
  "'Fluxer Sans', 'Fluxer Sans Arabic', 'Fluxer Sans Hebrew', 'Fluxer Sans Devanagari', " +
  "'Fluxer Sans Thai Looped', 'Fluxer Sans SC', 'Fluxer Sans TC', 'Fluxer Sans JP', 'Fluxer Sans KR', " +
  "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif";

const FONT_OPTIONS = [
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
  { value: 'Georgia', label: 'Georgia (serif)' },
  { value: 'Times New Roman', label: 'Times New Roman (serif)' },
  { value: 'Garamond', label: 'Garamond (serif)' },
  { value: 'Courier New', label: 'Courier New (monospace)' },
  { value: 'Consolas', label: 'Consolas (monospace)' },
  { value: 'Comic Sans MS', label: 'Comic Sans MS' },
];

function applyFont(customFont: string) {
  if (typeof document === 'undefined') return;
  const trimmed = (customFont || '').trim();
  const stack = trimmed ? `"${trimmed.replace(/"/g, '')}", ${FALLBACK_STACK}` : FALLBACK_STACK;
  document.documentElement.style.setProperty('--font-sans', stack);
}

async function fetchSetting(): Promise<{ enabled: boolean; fontFamily: string } | null> {
  try {
    const res = await fetch(API_PATH, { credentials: 'include' });
    if (!res.ok) return null;
    const data = await res.json();
    return { enabled: !!data.enabled, fontFamily: typeof data.fontFamily === 'string' ? data.fontFamily : '' };
  } catch (err) {
    console.error('[sans-serif-font-fix] Failed to load custom font setting:', err);
    return null;
  }
}

async function saveSetting(enabled: boolean, fontFamily: string): Promise<void> {
  try {
    const res = await fetch(API_PATH, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled, fontFamily }),
    });
    if (!res.ok) {
      console.error('[sans-serif-font-fix] Failed to save custom font setting: HTTP', res.status);
    }
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
