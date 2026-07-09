// @ts-nocheck
import React from 'react';
import { wrapComponent } from '@pekempy/fluxer-plugin-sdk/helpers/app';

const GuildListItemWrapper = ({ OriginalComponent, ...props }) => {
  if (typeof window !== 'undefined') {
    (window as any).__BYPASS_MOBILE_DND__ = true;
  }
  try {
    return <OriginalComponent {...props} />;
  } finally {
    if (typeof window !== 'undefined') {
      (window as any).__BYPASS_MOBILE_DND__ = false;
    }
  }
};

export default wrapComponent(GuildListItemWrapper);
