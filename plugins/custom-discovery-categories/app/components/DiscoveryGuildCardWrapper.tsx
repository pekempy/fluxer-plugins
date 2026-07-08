import React from 'react';
import { wrapComponent } from '@pekempy/fluxer-plugin-sdk/helpers/app';
import type { ComponentWrapper } from '@pekempy/fluxer-plugin-sdk/types/app';
import { observer } from 'mobx-react-lite';
import Discovery from '@app/features/discovery/state/Discovery';
import { DiscoveryCategoryLabels } from '@fluxer/constants/src/DiscoveryConstants';
import { useEffect } from 'react';

/**
 * Wraps DiscoveryGuildCard to patch the DiscoveryCategoryLabels static map
 * in-place with the dynamic categories fetched from the API, before the
 * original component renders so it picks up the custom names automatically.
 */
const DiscoveryGuildCardWrapper: ComponentWrapper = observer(({ OriginalComponent, ...props }) => {
  const categories = Discovery.categories;

  // Load categories from the API if not yet loaded
  useEffect(() => {
    void Discovery.loadCategories();
  }, []);

  // Mutate the static label map before OriginalComponent renders.
  // Both this module and DiscoveryGuildCard import the same ESM singleton,
  // so patching it here is immediately visible to OriginalComponent.
  if (categories && categories.length > 0) {
    for (const cat of categories as { id: number; name: string }[]) {
      (DiscoveryCategoryLabels as Record<number, string>)[cat.id] = cat.name;
    }
  }

  return <OriginalComponent {...(props as any)} />;
});

export default wrapComponent(DiscoveryGuildCardWrapper);
