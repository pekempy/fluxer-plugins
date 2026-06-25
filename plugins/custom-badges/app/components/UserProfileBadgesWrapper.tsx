import React, { useState, useEffect } from 'react';
import { wrapComponent } from '@pekempy/fluxer-plugin-sdk/helpers/app';

interface Badge {
  iconUrl: string;
  tooltip: string;
  url?: string;
}

interface UserProfileBadgesProps {
  user: {
    id: string;
    flags: number;
  };
  profile: any;
  isModal?: boolean;
  isMobile?: boolean;
}

const UserProfileBadgesWrapper = wrapComponent<UserProfileBadgesProps>(({ OriginalComponent, ...props }) => {
  const [customBadges, setCustomBadges] = useState<Badge[]>([]);
  const userId = props.user?.id;

  useEffect(() => {
    if (!userId) return;
    let active = true;

    fetch(`/api/v1/custom/badges/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (active && data && Array.isArray(data.badges)) {
          setCustomBadges(data.badges);
        }
      })
      .catch((err) => console.error('[Custom Badges Plugin] Failed to load badges:', err));

    return () => {
      active = false;
    };
  }, [userId]);

  const renderBadge = (badge: Badge, index: number) => {
    const size = props.isModal ? '24px' : '22px';
    const imgEl = (
      <img
        src={badge.iconUrl}
        alt={badge.tooltip}
        title={badge.tooltip}
        style={{
          width: size,
          height: size,
          borderRadius: '4px',
          objectFit: 'contain',
          cursor: badge.url ? 'pointer' : 'default',
        }}
      />
    );

    if (badge.url) {
      return (
        <a
          key={index}
          href={badge.url}
          target="_blank"
          rel="noopener noreferrer"
          title={badge.tooltip}
          style={{ display: 'inline-flex', padding: '1px' }}
        >
          {imgEl}
        </a>
      );
    }

    return (
      <div key={index} title={badge.tooltip} style={{ display: 'inline-flex', padding: '1px' }}>
        {imgEl}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
      <OriginalComponent {...props} />
      {customBadges.map((badge, idx) => renderBadge(badge, idx))}
    </div>
  );
});

export default UserProfileBadgesWrapper;
