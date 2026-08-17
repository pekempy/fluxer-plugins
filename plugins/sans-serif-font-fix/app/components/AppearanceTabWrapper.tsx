// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { wrapComponent } from '@pekempy/fluxer-plugin-sdk/helpers/app';
import { SettingsSection } from '@app/features/app/components/dialogs/shared/SettingsSection';
import { SettingsHeadingLinkButton } from '@app/features/app/components/dialogs/shared/SettingsHeadingLinkButton';
import { Switch } from '@app/features/ui/components/form/FormSwitch';
import { Input } from '@app/features/ui/components/form/FormInput';
import { APP_PROTOCOL_PREFIX } from '@app/features/ui/utils/AppProtocol';

// Keep these in sync with the storage keys used by index.ts.
const CONFIG_KEY_ENABLED = 'fluxer:plugin:sans-serif-font-fix:config:enabled';
const CONFIG_KEY_FONT = 'fluxer:plugin:sans-serif-font-fix:config:customFont';

const FALLBACK_STACK =
  "'Fluxer Sans', 'Fluxer Sans Arabic', 'Fluxer Sans Hebrew', 'Fluxer Sans Devanagari', " +
  "'Fluxer Sans Thai Looped', 'Fluxer Sans SC', 'Fluxer Sans TC', 'Fluxer Sans JP', 'Fluxer Sans KR', " +
  "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif";

// A curated list of fonts that are commonly available on desktop/mobile OSes
// without needing to bundle or fetch anything extra. Clicking a chip fills
// and commits the field immediately; you can still type any other font name
// by hand and it commits on every keystroke, same as the presets.
const FONT_PRESETS = [
  'Fluxer Sans',
  'Inter',
  'Arial',
  'Helvetica',
  'Verdana',
  'Segoe UI',
  'Roboto',
  'Open Sans',
  'Georgia',
  'Times New Roman',
  'Courier New',
  'Comic Sans MS',
];

function applyFont(customFont: string) {
  if (typeof document === 'undefined') return;
  const trimmed = (customFont || '').trim();
  const stack = trimmed ? `"${trimmed.replace(/"/g, '')}", ${FALLBACK_STACK}` : FALLBACK_STACK;
  document.documentElement.style.setProperty('--font-sans', stack);
}

function readJson(key: string) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return undefined;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  } catch {
    return undefined;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('[sans-serif-font-fix] Failed to persist setting:', key, err);
  }
}

const AppearanceTabWrapper = ({ OriginalComponent, ...props }) => {
  const [customFont, setCustomFont] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load persisted state once on mount. `enabled` and `customFont` are two
  // independent keys - enabling the switch is saved immediately regardless
  // of whether a font has been typed yet, so a refresh never silently
  // reverts the toggle.
  useEffect(() => {
    const storedEnabled = readJson(CONFIG_KEY_ENABLED) === true;
    const storedFont = readJson(CONFIG_KEY_FONT);
    const font = typeof storedFont === 'string' ? storedFont : '';
    setEnabled(storedEnabled);
    setCustomFont(font);
    if (storedEnabled && font) applyFont(font);
    setLoaded(true);
  }, []);

  const handleToggle = useCallback(
    (value: boolean) => {
      setEnabled(value);
      writeJson(CONFIG_KEY_ENABLED, value);
      applyFont(value ? customFont : '');
    },
    [customFont],
  );

  // Commits on every keystroke (not just blur/selection) so nothing is lost
  // if the tab is closed or refreshed mid-edit.
  const commitFont = useCallback(
    (value: string) => {
      setCustomFont(value);
      writeJson(CONFIG_KEY_FONT, value);
      if (enabled) applyFont(value);
    },
    [enabled],
  );

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => commitFont(event.target.value),
    [commitFont],
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
            <div style={{ marginTop: '12px', maxWidth: '420px' }}>
              <Input
                label="Font family"
                placeholder="e.g. Inter, Arial, Comic Sans MS"
                value={customFont}
                onChange={handleInputChange}
                data-flx="user.appearance-tab.custom-font.input"
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                {FONT_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => commitFont(preset)}
                    data-flx="user.appearance-tab.custom-font.preset-chip"
                    style={{
                      fontFamily: `"${preset}", sans-serif`,
                      padding: '6px 10px',
                      borderRadius: '999px',
                      border:
                        customFont === preset
                          ? '1px solid var(--brand-500, #5865f2)'
                          : '1px solid var(--border-primary, rgba(255,255,255,0.15))',
                      background:
                        customFont === preset ? 'var(--brand-500, #5865f2)' : 'var(--surface-secondary, transparent)',
                      color: customFont === preset ? '#fff' : 'var(--text-primary, inherit)',
                      cursor: 'pointer',
                      fontSize: '13px',
                      lineHeight: '1.2',
                    }}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          )}
        </SettingsSection>
      )}
    </>
  );
};

export default wrapComponent(AppearanceTabWrapper);
