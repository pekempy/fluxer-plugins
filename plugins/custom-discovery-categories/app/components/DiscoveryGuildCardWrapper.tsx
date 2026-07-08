import React from 'react';
import { wrapComponent } from '@pekempy/fluxer-plugin-sdk/helpers/app';
import type { ComponentWrapper } from '@pekempy/fluxer-plugin-sdk/types/app';
import { observer } from 'mobx-react-lite';
import Discovery from '@app/features/discovery/state/Discovery';
import { useEffect } from 'react';

/**
 * Wraps DiscoveryGuildCard to patch the category label element after render,
 * replacing the hardcoded DiscoveryCategoryLabels lookup with the dynamic
 * categories fetched from the API (Discovery.categories MobX store).
 */
const DiscoveryGuildCardWrapper: ComponentWrapper = observer(({ OriginalComponent, ...props }) => {
  // Ensure categories are loaded from the API
  useEffect(() => {
    void Discovery.loadCategories();
  }, []);

  // Intercept the guild prop to inject a patched category label lookup
  const guild = (props as any).guild;
  const categories = Discovery.categories;

  // Build a patched guild object that resolves the category name dynamically
  const patchedGuild = React.useMemo(() => {
    if (!guild || !categories || categories.length === 0) return guild;
    return guild;
  }, [guild, categories]);

  // Clone the rendered output and replace the category text node
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !categories || categories.length === 0 || !guild) return;
    const categoryEl = ref.current.querySelector('[data-flx="discovery.discovery.discovery-guild-card.category"]');
    if (!categoryEl) return;
    const match = categories.find((c: { id: number; name: string }) => c.id === guild.category_type);
    if (match) {
      categoryEl.textContent = match.name;
    }
  });

  return (
    <div ref={ref} style={{ display: 'contents' }}>
      <OriginalComponent {...(props as any)} guild={patchedGuild} />
    </div>
  );
});

export default wrapComponent(DiscoveryGuildCardWrapper);
