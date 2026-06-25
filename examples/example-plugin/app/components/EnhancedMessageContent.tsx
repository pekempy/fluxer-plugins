import React from 'react';
import { wrapComponent } from '@pekempy/fluxer-plugin-sdk/helpers/app';

interface UserMessageProps {
  message: {
    id: string;
    content: string;
    senderId: string;
  };
}

const EnhancedMessageContent = wrapComponent<UserMessageProps>(({ OriginalComponent, ...props }) => {
  return (
    <div style={{ borderLeft: '3px solid #6366f1', paddingLeft: '8px' }}>
      <OriginalComponent {...props} />
      <div style={{ fontSize: '10px', color: '#6366f1', marginTop: '2px', opacity: 0.7 }}>
        🔌 Decorated by Example Plugin
      </div>
    </div>
  );
});

export default EnhancedMessageContent;
