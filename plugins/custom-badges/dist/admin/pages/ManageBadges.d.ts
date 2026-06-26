import { ConfigData, Badge, DomainMapping } from '../../api/routes/BadgesApi.js';
export declare function renderUserBadgesTable(badgesMap: Record<string, Badge[]>, userTagsMap: Record<string, string>): string;
export declare function renderDomainMappingsTable(mappings: DomainMapping[]): string;
export declare function renderDashboardHtml(config: ConfigData, userTagsMap: Record<string, string>): string;
declare const _default: import("@pekempy/fluxer-plugin-sdk").AdminPage;
export default _default;
