import { pino } from 'pino';
import { env } from '../env.js';

export const logger = pino({
  level: env.API_LOG_LEVEL,
  base: { service: 'tervox-api', env: env.NODE_ENV },
  timestamp: pino.stdTimeFunctions.isoTime,
});
