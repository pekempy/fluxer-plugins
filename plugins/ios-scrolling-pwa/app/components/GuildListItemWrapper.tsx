// @ts-nocheck
import React from 'react';

const GuildListItemWrapper = (OriginalComponent: any) => {
  return (props: any) => {
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
};

export default GuildListItemWrapper;
