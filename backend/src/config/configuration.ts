export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  corsOrigins: (process.env.CORS_ORIGINS ?? '').split(',').filter(Boolean),
  appPublicUrl: process.env.APP_PUBLIC_URL ?? 'http://localhost:3000',

  database: {
    url: process.env.DATABASE_URL,
  },

  throttler: {
    ttlMs: parseInt(process.env.THROTTLE_TTL_MS ?? '60000', 10),
    globalLimit: parseInt(process.env.THROTTLE_GLOBAL_LIMIT ?? '120', 10),
    authLimit: parseInt(process.env.THROTTLE_AUTH_LIMIT ?? '5', 10),
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
  },
});
