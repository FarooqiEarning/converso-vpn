/**
 * Converso VPN - Environment Validation Schema
 * Uses Joi-like validation at startup
 */

const Joi = require('joi');

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'staging', 'production').default('development'),
  APP_PORT: Joi.number().default(3000),
  APP_NAME: Joi.string().default('converso-api'),
  APP_VERSION: Joi.string().default('1.0.0'),
  FRONTEND_URL: Joi.string().uri().required(),
  ADMIN_URL: Joi.string().uri().required(),
  CORS_ORIGINS: Joi.string().required(),

  DATABASE_HOST: Joi.string().default('localhost'),
  DATABASE_PORT: Joi.number().default(5432),
  DATABASE_USERNAME: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().required(),
  DATABASE_NAME: Joi.string().default('converso_vpn'),
  DATABASE_SSL: Joi.boolean().default(false),
  DATABASE_POOL_MIN: Joi.number().default(5),
  DATABASE_POOL_MAX: Joi.number().default(30),

  REDIS_URL: Joi.string().default('redis://localhost:6379'),
  REDIS_TTL_SECONDS: Joi.number().default(86400),

  JWT_ACCESS_SECRET: Joi.string().min(64).required(),
  JWT_REFRESH_SECRET: Joi.string().min(64).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),

  GOOGLE_CLIENT_ID: Joi.string().allow(''),
  GOOGLE_CLIENT_SECRET: Joi.string().allow(''),
  GOOGLE_CALLBACK_URL: Joi.string().uri().allow(''),

  STRIPE_SECRET_KEY: Joi.string().allow(''),
  STRIPE_WEBHOOK_SECRET: Joi.string().allow(''),
  STRIPE_PUBLISHABLE_KEY: Joi.string().allow(''),

  SENDGRID_API_KEY: Joi.string().allow(''),
  EMAIL_FROM: Joi.string().email().default('noreply@vpn.conversoempire.world'),
  EMAIL_FROM_NAME: Joi.string().default('Converso VPN'),

  NODE_AGENT_SECRET: Joi.string().required(),
  NODE_HEARTBEAT_INTERVAL_SECONDS: Joi.number().default(30),

  WG_DNS_PRIMARY: Joi.string().default('1.1.1.1'),
  WG_DNS_SECONDARY: Joi.string().default('1.0.0.1'),
  WG_KEEPALIVE_SECONDS: Joi.number().default(25),

  ENCRYPTION_KEY: Joi.string().min(32).required(),

  RATE_LIMIT_WINDOW_MS: Joi.number().default(60000),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),
  AUTH_RATE_LIMIT_MAX: Joi.number().default(10),

  LOG_LEVEL: Joi.string().valid('debug', 'info', 'warn', 'error').default('info'),
}).unknown();

const { error } = envSchema.validate(process.env, { abortEarly: false });

if (error) {
  console.error('❌ Environment validation failed:');
  error.details.forEach((detail: { message: string }) => {
    console.error(`  - ${detail.message}`);
  });
  process.exit(1);
}

module.exports = envSchema;