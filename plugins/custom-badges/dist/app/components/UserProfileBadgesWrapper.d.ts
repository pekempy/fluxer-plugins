interface UserProfileBadgesProps {
    user: {
        id: string;
        flags: number;
    };
    profile: any;
    isModal?: boolean;
    isMobile?: boolean;
}
declare const UserProfileBadgesWrapper: import("@pekempy/fluxer-plugin-sdk").ComponentWrapper<UserProfileBadgesProps>;
export default UserProfileBadgesWrapper;
