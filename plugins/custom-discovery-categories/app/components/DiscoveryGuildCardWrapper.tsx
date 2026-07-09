import React, { useLayoutEffect, useRef, useEffect } from 'react';
import { wrapComponent } from '@pekempy/fluxer-plugin-sdk/helpers/app';
import type { ComponentWrapper } from '@pekempy/fluxer-plugin-sdk/types/app';
import { observer } from 'mobx-react-lite';
import Discovery from '@app/features/discovery/state/Discovery';

/**
 * Wraps DiscoveryGuildCard to replace the category label text with the
 * custom category name from the API, bypassing the hardcoded DiscoveryCategoryLabels map.
 *
 * We use a ref + useLayoutEffect to directly update the text of the category
 * span after every render — this runs synchronously before paint so there's
 * no flicker, and runs again whenever Discovery.categories updates (via MobX observer).
 */
const DiscoveryGuildCardWrapper: ComponentWrapper = observer(({ OriginalComponent, ...props }) => {
  const guild = (props as any).guild;
  const categories = Discovery.categories;
  const containerRef = useRef<HTMLDivElement>(null);

  // Ensure categories are loaded from the API
  useEffect(() => {
    void Discovery.loadCategories();
  }, []);

  // After every render (including when categories load), update/inject the category span text
  useLayoutEffect(() => {
    if (!containerRef.current || !categories || categories.length === 0) return;
    const span = containerRef.current.querySelector(
      '[data-flx="discovery.discovery.discovery-guild-card.category"]'
    ) as HTMLElement | null;
    if (!span || guild?.category_type == null) return;

    // Check if we already injected our custom label
    let customSpan = span.parentElement?.querySelector('.custom-category-badge') as HTMLElement | null;
    if (!customSpan) {
      customSpan = document.createElement('span');
      customSpan.className = 'custom-category-badge ' + span.className;
      // Copy over data-flx for testing if needed or keep it clean
      customSpan.setAttribute('data-flx-custom', 'discovery.discovery.discovery-guild-card.custom-category');
      span.parentNode?.insertBefore(customSpan, span.nextSibling);
    }

    const match = categories.find((c: { id: number; name: string }) => c.id === guild.category_type);
    if (match) {
      customSpan.textContent = match.name;
    }
  });

  return (
    // display:contents makes this div invisible to layout so card grid is unaffected
    <div ref={containerRef} style={{ display: 'contents' }}>
      <OriginalComponent {...(props as any)} />
    </div>
  );
});

export default wrapComponent(DiscoveryGuildCardWrapper);

