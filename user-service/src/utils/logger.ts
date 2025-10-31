import { createLogger, format, transports } from 'winston';
import LokiTransport from 'winston-loki';

const { combine, timestamp, printf, colorize, json } = format;
const serviceName = 'user-service';

const consoleFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${serviceName}] ${level}: ${message}`;
});

export const logger = createLogger({
  level: 'info',
  format: combine(timestamp(), json()),
  defaultMeta: { service: serviceName },
  transports: [
    new transports.Console({
      format: combine(colorize(), timestamp(), consoleFormat),
    }),
    new LokiTransport({
      host: 'http://loki:3100',
      labels: { service: serviceName },
      json: true,
    }),
  ],
});