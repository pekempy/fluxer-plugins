export interface Badge {
    iconUrl: string;
    tooltip: string;
    url?: string;
}
export interface DomainMapping {
    domain: string;
    iconUrl: string;
    tooltip: string;
    urlTemplate?: string;
}
export interface ConfigData {
    badges: Record<string, Badge[]>;
    domainMappings: DomainMapping[];
}
export declare function getConfigData(): Promise<ConfigData>;
export declare function saveConfigData(config: ConfigData): Promise<void>;
export declare function getBadgesMap(): Promise<Record<string, Badge[]>>;
export declare function saveBadgesMap(map: Record<string, Badge[]>): Promise<void>;
declare const _default: import("@pekempy/fluxer-plugin-sdk").ApiRouteHook;
export default _default;
