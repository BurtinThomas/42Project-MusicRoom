function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} in backend/.env`);
  return value;
}

export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  corsOrigins: (process.env.CORS_ORIGINS ?? '').split(',').filter(Boolean),
  appPublicUrl: process.env.APP_PUBLIC_URL ?? 'http://localhost:3000',

  throttler: {
    ttlMs: parseInt(process.env.THROTTLE_TTL_MS ?? '60000', 10),
    globalLimit: parseInt(process.env.THROTTLE_GLOBAL_LIMIT ?? '120', 10),
  },

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET'),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
  },

  mail: {
    host: process.env.SMTP_HOST ?? '',
    port: parseInt(process.env.SMTP_PORT ?? '587', 10),
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    from: process.env.MAIL_FROM ?? 'Music Room <no-reply@musicroom.local>',
  },
});
