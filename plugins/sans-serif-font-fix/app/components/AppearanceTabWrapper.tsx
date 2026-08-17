// @ts-nocheck
import React, { useCallback, useEffect, useState } from 'react';
import { wrapComponent } from '@pekempy/fluxer-plugin-sdk/helpers/app';
import { SettingsSection } from '@app/features/app/components/dialogs/shared/SettingsSection';
import { Switch } from '@app/features/ui/components/form/FormSwitch';
import { Input } from '@app/features/ui/components/form/FormInput';

// Keep this in sync with the storage key used by index.ts.
const CONFIG_KEY = 'fluxer:plugin:sans-serif-font-fix:config:customFont';

const FALLBACK_STACK =
  "'Fluxer Sans', 'Fluxer Sans Arabic', 'Fluxer Sans Hebrew', 'Fluxer Sans Devanagari', " +
  "'Fluxer Sans Thai Looped', 'Fluxer Sans SC', 'Fluxer Sans TC', 'Fluxer Sans JP', 'Fluxer Sans KR', " +
  "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif";

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
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setCustomFont(value);
      if (enabled) {
        applyFont(value);
        persistFont(value);
      }
    },
    [enabled],
  );

  return (
    <>
      <OriginalComponent {...props} />
      {loaded && (
        <SettingsSection
          id="custom-font"
          title="Custom Font"
          description="Fluxer always falls back to a sans-serif system font by default. Turn this on to use your own font everywhere in the app instead."
          linkable={false}
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
              <Input
                label="Font family"
                placeholder="e.g. Inter, Arial, Comic Sans MS"
                value={customFont}
                onChange={handleFontChange}
                data-flx="user.appearance-tab.custom-font.input"
              />
            </div>
          )}
        </SettingsSection>
      )}
    </>
  );
};

export default wrapComponent(AppearanceTabWrapper);
