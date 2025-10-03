import pino from 'pino';
import { env } from '../config/env.js';

export const logger = pino({
  transport: env.nodeEnv === 'development' ? {
    target: 'pino-pretty',
    options: { colorize: true }
  } : undefined
});
