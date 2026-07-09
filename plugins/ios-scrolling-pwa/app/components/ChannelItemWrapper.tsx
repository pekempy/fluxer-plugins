// @ts-nocheck
import React from 'react';
import { wrapComponent } from '@pekempy/fluxer-plugin-sdk/helpers/app';

const ChannelItemWrapper = ({ OriginalComponent, ...props }) => {
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

export default wrapComponent(ChannelItemWrapper);
