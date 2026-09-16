declare const _default: () => {
    nodeEnv: string;
    port: number;
    corsOrigins: string[];
    appPublicUrl: string;
    database: {
        url: string | undefined;
    };
    throttler: {
        ttlMs: number;
        globalLimit: number;
        authLimit: number;
    };
    jwt: {
        accessSecret: string;
        accessExpiresIn: string;
        refreshSecret: string;
        refreshExpiresIn: string;
    };
    google: {
        clientId: string;
        clientSecret: string;
        callbackUrl: string;
    };
    facebook: {
        appId: string;
        appSecret: string;
        callbackUrl: string;
    };
    mail: {
        host: string;
        port: number;
        user: string;
        password: string;
        from: string;
        devMode: boolean;
    };
};
export default _default;
