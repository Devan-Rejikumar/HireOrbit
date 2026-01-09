import { createLogger, format, transports } from 'winston';
import LokiTransport from 'winston-loki';
import { env } from '../config/env';

const { combine, timestamp, printf, colorize, json } = format;
const serviceName = 'api-gateway';

const consoleFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${serviceName}] ${level}: ${message}`;
});

export const logger = createLogger({
  level: env.LOG_LEVEL || 'info',
  format: combine(timestamp(), json()),
  defaultMeta: { service: serviceName },
  transports: [
    new transports.Console({
      format: combine(colorize(), timestamp(), consoleFormat),
    }),
    new LokiTransport({
      host: process.env.LOKI_URL || 'http://localhost:3100',
      labels: { service: serviceName },
      json: true,
    }),
  ],
});