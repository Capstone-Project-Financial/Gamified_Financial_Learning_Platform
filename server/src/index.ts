import { startServer } from './server';
import logger from './utils/logger';
import { env } from './config/env';

// Diagnostic: log email config presence at startup
logger.info({
  emailConfigured: !!(env.EMAIL_HOST && env.EMAIL_USER && env.EMAIL_PASSWORD),
  EMAIL_HOST: env.EMAIL_HOST || 'NOT SET',
  EMAIL_PORT: env.EMAIL_PORT || 'NOT SET',
  EMAIL_USER: env.EMAIL_USER ? env.EMAIL_USER.slice(0, 8) + '...' : 'NOT SET',
  EMAIL_PASSWORD: env.EMAIL_PASSWORD ? 'SET (' + env.EMAIL_PASSWORD.length + ' chars)' : 'NOT SET',
  EMAIL_FROM: env.EMAIL_FROM || 'NOT SET',
}, 'Email configuration at startup');

startServer().catch((error) => {
  logger.error({ err: error }, 'Failed to start server');
  process.exit(1);
});

