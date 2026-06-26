import React, { useState, useEffect } from 'react';
import { wrapComponent } from '@pekempy/fluxer-plugin-sdk/helpers/app';
import styles from '@app/features/user/components/popouts/UserProfileBadges.module.css';
import { Tooltip } from '@app/features/ui/tooltip/Tooltip';
import FocusRing from '@app/features/ui/focus_ring/FocusRing';
import { handleExternalLinkClick } from '@app/features/ui/utils/NativeUtils';

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

  if (customBadges.length === 0) {
    return <OriginalComponent {...props} />;
  }

  const isModal = !!props.isModal;
  const isMobile = !!props.isMobile;
  const isDesktopInteractions = !isMobile;

  const containerClassName = isModal
    ? [styles.containerModal, isMobile ? styles.containerModalMobile : styles.containerModalDesktop].filter(Boolean).join(' ')
    : styles.containerPopout;

  const badgeClassName = isModal && isMobile ? styles.badgeMobile : styles.badgeDesktop;

  const renderBadge = (badge: Badge, index: number) => {
    const badgeContent = (
      <img
        src={badge.iconUrl}
        alt={badge.tooltip}
        className={badgeClassName}
        style={{
          borderRadius: '4px',
          objectFit: 'contain',
        }}
      />
    );

    const renderInteractiveWrapper = () => {
      if (badge.url && isDesktopInteractions) {
        return (
          <a
            href={badge.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
            onClick={(event) => handleExternalLinkClick(event, badge.url!)}
          >
            {badgeContent}
          </a>
        );
      }
      return (
        <div className={styles.link}>
          {badgeContent}
        </div>
      );
    };

    return (
      <Tooltip key={`custom-${index}`} text={badge.tooltip} maxWidth="xl">
        <FocusRing offset={-2}>
          {renderInteractiveWrapper()}
        </FocusRing>
      </Tooltip>
    );
  };

  return (
    <div className={containerClassName}>
      <style>{`
        .custom-badges-container-override > div {
          position: static !important;
          background: transparent !important;
          padding: 0 !important;
          border-radius: 0 !important;
          display: contents !important;
        }
      `}</style>
      <div className="custom-badges-container-override" style={{ display: 'contents' }}>
        <OriginalComponent {...props} />
      </div>
      {customBadges.map((badge, idx) => renderBadge(badge, idx))}
    </div>
  );
});

export default UserProfileBadgesWrapper;

