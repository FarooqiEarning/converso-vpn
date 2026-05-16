/**
 * Converso VPN - Configuration
 */

export default () => ({
  app: {
    port: parseInt(process.env.APP_PORT || '3000', 10),
    name: process.env.APP_NAME || 'converso-api',
    version: process.env.APP_VERSION || '1.0.0',
    nodeEnv: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
    adminUrl: process.env.ADMIN_URL || 'http://localhost:3002',
    corsOrigins: process.env.CORS_ORIGINS || 'http://localhost:3001,http://localhost:3002',
  },
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USERNAME || 'converso_user',
    password: process.env.DATABASE_PASSWORD || '',
    name: process.env.DATABASE_NAME || 'converso_vpn',
    ssl: process.env.DATABASE_SSL === 'true',
    poolMin: parseInt(process.env.DATABASE_POOL_MIN || '5', 10),
    poolMax: parseInt(process.env.DATABASE_POOL_MAX || '30', 10),
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    ttl: parseInt(process.env.REDIS_TTL_SECONDS || '86400', 10),
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || '',
    refreshSecret: process.env.JWT_REFRESH_SECRET || '',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || '',
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  },
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY || '',
    emailFrom: process.env.EMAIL_FROM || 'noreply@vpn.conversoempire.world',
    emailFromName: process.env.EMAIL_FROM_NAME || 'Converso VPN',
  },
  nodeAgent: {
    secret: process.env.NODE_AGENT_SECRET || '',
    heartbeatInterval: parseInt(process.env.NODE_HEARTBEAT_INTERVAL_SECONDS || '30', 10),
  },
  wireguard: {
    dnsPrimary: process.env.WG_DNS_PRIMARY || '1.1.1.1',
    dnsSecondary: process.env.WG_DNS_SECONDARY || '1.0.0.1',
    keepalive: parseInt(process.env.WG_KEEPALIVE_SECONDS || '25', 10),
  },
  encryption: {
    key: process.env.ENCRYPTION_KEY || '',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '10', 10),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
});