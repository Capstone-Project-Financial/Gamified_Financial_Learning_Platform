import { startServer } from './server';
import logger from './utils/logger';

startServer().catch((error) => {
  logger.error({ err: error }, 'Failed to start server');
  process.exit(1);
});

