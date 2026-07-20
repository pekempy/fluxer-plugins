// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { wrapComponent } from '@pekempy/fluxer-plugin-sdk/helpers/app';
import { Switch } from '@app/features/ui/components/form/FormSwitch';
import { SettingsTabSection } from '@app/features/app/components/dialogs/shared/SettingsTabLayout';
import { http } from '@app/features/platform/transport/RestTransport';

const RadioGroupWrapper = ({ OriginalComponent, ...props }) => {
  const isProfilePrivacy = props['data-flx'] === 'user.privacy-safety-tab.profile-privacy-tab.radio-group.profile-privacy-change';

  const [hideEncora, setHideEncora] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch current setting on mount (only for the targeted radio group)
  useEffect(() => {
    if (!isProfilePrivacy) return;
    let active = true;
    async function fetchPrivacy() {
      try {
        const res = await http.get('/encora-privacy');
        if (res && active) {
          setHideEncora(!!res.body?.hideEncora);
        }
      } catch (err) {
        console.error('[Encora Privacy Plugin] Failed to fetch privacy setting:', err);
      } finally {
        if (active) setLoading(false);
      }
    }
    void fetchPrivacy();
    return () => {
      active = false;
    };
  }, [isProfilePrivacy]);

  const handleToggle = useCallback(async (value: boolean) => {
    setHideEncora(value);
    try {
      await http.post('/encora-privacy', {
        body: { hideEncora: value }
      });
    } catch (err) {
      console.error('[Encora Privacy Plugin] Failed to save privacy setting:', err);
      setHideEncora(!value);
    }
  }, []);

  if (!isProfilePrivacy) {
    return <OriginalComponent {...props} />;
  }

  return (
    <>
      <OriginalComponent {...props} />
      {!loading && (
        <>
          <div style={{ height: '1.5rem' }} />
          <SettingsTabSection
            title="Encora connection privacy"
            data-flx="user.privacy-safety-tab.encora-privacy.settings-tab-section"
          >
            <Switch
              label="Hide my Encora from other Prelude users"
              value={hideEncora}
              onChange={handleToggle}
              data-flx="user.privacy-safety-tab.encora-privacy.switch"
            />
          </SettingsTabSection>
        </>
      )}
    </>
  );
};

export default wrapComponent(RadioGroupWrapper);
