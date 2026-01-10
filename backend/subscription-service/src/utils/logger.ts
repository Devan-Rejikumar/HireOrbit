import { createLogger, format, transports } from 'winston';
import LokiTransport from 'winston-loki';
import { AppConfig } from '../config/app.config';

const { combine, timestamp, printf, colorize, json } = format;

const serviceName = AppConfig.SERVICE_NAME;

const consoleFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${serviceName}] ${level}: ${message}`;
});

const loggerTransports: any[] = [];

// Console logger (always enabled)
loggerTransports.push(
  new transports.Console({
    format: combine(colorize(), timestamp(), consoleFormat),
  })
);

// Loki logger (ONLY if configured)
if (AppConfig.LOKI_HOST) {
  const lokiHost: string = AppConfig.LOKI_HOST;

  loggerTransports.push(
    new LokiTransport({
      host: lokiHost,
      labels: { service: serviceName },
      json: true,
    })
  );
}

export const logger = createLogger({
  level: 'info',
  format: combine(timestamp(), json()),
  defaultMeta: { service: serviceName },
  transports: loggerTransports,
});
