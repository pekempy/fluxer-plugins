// @ts-nocheck
// Purely a side-effect wrapper - renders no UI of its own. AppLayout is the
// shared route layout for the entire authenticated app (see
// src/app/router/routes/AppRoutes.tsx), mounted once right after login and
// staying mounted across every guild/DM/settings navigation for the rest of
// the session. That makes it the right place to fetch-and-apply a saved
// custom font on boot, rather than only when Settings > Appearance happens
// to be opened (see app/components/AppearanceTabWrapper.tsx, which still
// owns the actual settings UI and re-applies/persists changes live).
//
// This can't live in index.ts (the plugin lifecycle file) instead: that file
// is compiled by plain tsc with no access to the @app/* alias, so it has no
// way to reach the app's `http` client or the bearer token it attaches (this
// app authenticates via an Authorization header, not cookies).
import React, { useEffect, useRef } from 'react';
import { wrapComponent } from '@pekempy/fluxer-plugin-sdk/helpers/app';
import { http } from '@app/features/platform/transport/RestTransport';

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

const AppLayoutFontLoader = ({ OriginalComponent, ...props }) => {
  const fetchedOnce = useRef(false);

  useEffect(() => {
    if (fetchedOnce.current) return;
    fetchedOnce.current = true;
    (async () => {
      try {
        const res = await http.get('/custom-font');
        const data = res?.body;
        if (data?.enabled && typeof data.fontFamily === 'string' && data.fontFamily.trim()) {
          applyFont(data.fontFamily);
        }
      } catch (err) {
        console.error('[sans-serif-font-fix] Failed to load custom font setting on boot:', err);
      }
    })();
  }, []);

  return <OriginalComponent {...props} />;
};

export default wrapComponent(AppLayoutFontLoader);
