import { createLogger, format, transports } from 'winston';
import LokiTransport from 'winston-loki';
import { AppConfig } from '../config/app.config';

const { combine, timestamp, printf, colorize, json } = format;
const serviceName = 'company-service';

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
      host: AppConfig.LOKI_HOST,
      labels: { service: serviceName },
      json: true,
    }),
  ],
});