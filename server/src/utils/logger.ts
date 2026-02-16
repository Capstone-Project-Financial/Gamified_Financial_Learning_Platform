import pino from 'pino';

import { env } from '../config/env';

const isDev = env.NODE_ENV !== 'production';

export const logger = pino({
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname'
        }
      }
    : undefined,
  level: isDev ? 'debug' : 'info'
});

export default logger;

