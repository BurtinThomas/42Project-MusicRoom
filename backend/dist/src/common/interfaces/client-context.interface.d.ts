export type ClientPlatform = 'ANDROID' | 'IOS' | 'WEB' | 'UNKNOWN';
export interface ClientContext {
    platform: ClientPlatform;
    deviceModel: string;
    appVersion: string;
    installationId?: string;
}
