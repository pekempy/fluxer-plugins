// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { wrapComponent } from '@pekempy/fluxer-plugin-sdk/helpers/app';
import { SettingsSection } from '@app/features/app/components/dialogs/shared/SettingsSection';
import { SettingsHeadingLinkButton } from '@app/features/app/components/dialogs/shared/SettingsHeadingLinkButton';
import { Switch } from '@app/features/ui/components/form/FormSwitch';
import { Combobox } from '@app/features/ui/components/form/FormCombobox';
import { APP_PROTOCOL_PREFIX } from '@app/features/ui/utils/AppProtocol';

// Keep this in sync with the storage key used by index.ts.
const CONFIG_KEY = 'fluxer:plugin:sans-serif-font-fix:config:customFont';

const FALLBACK_STACK =
  "'Fluxer Sans', 'Fluxer Sans Arabic', 'Fluxer Sans Hebrew', 'Fluxer Sans Devanagari', " +
  "'Fluxer Sans Thai Looped', 'Fluxer Sans SC', 'Fluxer Sans TC', 'Fluxer Sans JP', 'Fluxer Sans KR', " +
  "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif";

// A curated list of fonts that are commonly available on desktop/mobile OSes
// without needing to bundle or fetch anything extra. Users can still type
// any other font name and it'll be used verbatim (with the same sans-serif
// fallback chain appended for safety).
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

function readStoredFont(): string {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return '';
    try {
      return JSON.parse(raw) || '';
    } catch {
      return raw;
    }
  } catch {
    return '';
  }
}

function persistFont(value: string) {
  try {
    if (value) {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(value));
    } else {
      localStorage.removeItem(CONFIG_KEY);
    }
  } catch (err) {
    console.error('[sans-serif-font-fix] Failed to persist custom font:', err);
  }
}

// If the typed text exactly matches a known option (by name), snap to it so
// the dropdown shows it as "selected". Otherwise pass the raw typed value
// straight through, so any custom system font name still works.
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

  useEffect(() => {
    const stored = readStoredFont();
    if (stored) {
      setCustomFont(stored);
      setEnabled(true);
      applyFont(stored);
    }
    setLoaded(true);
  }, []);

  const handleToggle = useCallback(
    (value: boolean) => {
      setEnabled(value);
      if (value) {
        applyFont(customFont);
        persistFont(customFont);
      } else {
        applyFont('');
        persistFont('');
      }
    },
    [customFont],
  );

  const handleFontChange = useCallback(
    (value: string) => {
      setCustomFont(value);
      if (enabled) {
        applyFont(value);
        persistFont(value);
      }
    },
    [enabled],
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
          description="Fluxer always falls back to a sans-serif system font by default. Turn this on to pick your own font instead."
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
