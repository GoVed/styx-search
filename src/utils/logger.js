import pino from 'pino';
import config from '../config.js';

export const logger = pino({
  level: config.logLevel || 'info',
  timestamp: pino.stdTimeFunctions.isoTime
});

export default logger;
