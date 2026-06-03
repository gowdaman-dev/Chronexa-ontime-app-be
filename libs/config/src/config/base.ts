export default () => ({
  port: parseInt(process.env.PORT ?? '', 10) || 8000,
  databaseUrl: process.env.DATABASE_URL ?? process.env.DATABASE_URL_UNPOOLED,
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
  accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN ?? '30d',
  smtpHost: process.env.SMTP_HOST,
  smtpPort: parseInt(process.env.SMTP_PORT ?? '', 10) || 587,
  smtpUser: process.env.SMTP_USER,
  smtpPassword: process.env.SMTP_PASSWORD,
  smtpSecure: process.env.SMTP_SECURE === 'true',
  smtpMaxConnections: parseInt(process.env.SMTP_MAX_CONNECTIONS ?? '', 10) || 5,
  smtpMaxMessages: parseInt(process.env.SMTP_MAX_MESSAGES ?? '', 10) || 100,
});
