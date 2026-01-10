import winston from 'winston';
import LokiTransport from 'winston-loki';
import { AppConfig } from '../config/env';

const { combine, timestamp, printf, colorize, json } = winston.format;

const serviceName = AppConfig.service.name;

/**
 * Console log format
 */
const consoleFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${serviceName}] ${level}: ${message}`;
});

/**
 * Transport list (stdout always enabled)
 */
const transportList: winston.transport[] = [
  new winston.transports.Console({
    format: combine(
      colorize(),
      timestamp(),
      consoleFormat
    ),
  }),
];

/**
 * Optional Loki transport
 */
if (AppConfig.logging.lokiHost) {
  transportList.push(
    new LokiTransport({
      host: AppConfig.logging.lokiHost,
      labels: {
        service: serviceName,
        version: AppConfig.service.version,
      },
      json: true,
    })
  );
}

/**
 * Logger instance
 */
export const logger = winston.createLogger({
  level: 'info',
  defaultMeta: {
    service: serviceName,
  },
  format: combine(timestamp(), json()),
  transports: transportList,
});
