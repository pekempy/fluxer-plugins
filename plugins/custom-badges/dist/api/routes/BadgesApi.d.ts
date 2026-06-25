export interface Badge {
    iconUrl: string;
    tooltip: string;
    url?: string;
}
export declare function getBadgesMap(): Promise<Record<string, Badge[]>>;
export declare function saveBadgesMap(map: Record<string, Badge[]>): Promise<void>;
declare const _default: import("@pekempy/fluxer-plugin-sdk").ApiRouteHook;
export default _default;
