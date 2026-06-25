interface Badge {
    iconUrl: string;
    tooltip: string;
    url?: string;
}
export declare function getBadgesMap(): Promise<Record<string, Badge[]>>;
export declare function renderBadgesTable(badgesMap: Record<string, Badge[]>): string;
export declare function renderDashboardHtml(badgesMap: Record<string, Badge[]>): string;
declare const _default: import("@pekempy/fluxer-plugin-sdk").AdminPage;
export default _default;
