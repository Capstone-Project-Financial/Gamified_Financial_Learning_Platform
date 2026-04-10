import { startServer } from './server';
import logger from './utils/logger';
import { env } from './config/env';

// Diagnostic: log Brevo email config presence at startup
logger.info({
  emailConfigured: !!env.BREVO_API_KEY,
  BREVO_API_KEY: env.BREVO_API_KEY ? 'SET' : 'NOT SET',
}, 'Email configuration at startup (Brevo)');

startServer().catch((error) => {
  logger.error({ err: error }, 'Failed to start server');
  process.exit(1);
});

