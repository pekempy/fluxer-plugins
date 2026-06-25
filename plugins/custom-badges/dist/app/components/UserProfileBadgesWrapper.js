import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { wrapComponent } from '@pekempy/fluxer-plugin-sdk/helpers/app';
const UserProfileBadgesWrapper = wrapComponent(({ OriginalComponent, ...props }) => {
    const [customBadges, setCustomBadges] = useState([]);
    const userId = props.user?.id;
    useEffect(() => {
        if (!userId)
            return;
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
    const renderBadge = (badge, index) => {
        const size = props.isModal ? '24px' : '22px';
        const imgEl = (_jsx("img", { src: badge.iconUrl, alt: badge.tooltip, title: badge.tooltip, style: {
                width: size,
                height: size,
                borderRadius: '4px',
                objectFit: 'contain',
                cursor: badge.url ? 'pointer' : 'default',
            } }));
        if (badge.url) {
            return (_jsx("a", { href: badge.url, target: "_blank", rel: "noopener noreferrer", title: badge.tooltip, style: { display: 'inline-flex', padding: '1px' }, children: imgEl }, index));
        }
        return (_jsx("div", { title: badge.tooltip, style: { display: 'inline-flex', padding: '1px' }, children: imgEl }, index));
    };
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }, children: [_jsx(OriginalComponent, { ...props }), customBadges.map((badge, idx) => renderBadge(badge, idx))] }));
});
export default UserProfileBadgesWrapper;
//# sourceMappingURL=UserProfileBadgesWrapper.js.map