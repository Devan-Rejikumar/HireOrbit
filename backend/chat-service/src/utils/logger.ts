import winston from 'winston';
import LokiTransport from 'winston-loki';
import { AppConfig } from '../config/app.config';

const transportsList: winston.transport[] = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf(({ level, message, timestamp }) => {
        return `${timestamp} [${AppConfig.service.name}] ${level}: ${message}`;
      })
    ),
  }),
];

const lokiHost = AppConfig.logging.lokiHost;

if (lokiHost) {
  transportsList.push(
    new LokiTransport({
      host: lokiHost,
      labels: {
        service: AppConfig.service.name,
        version: AppConfig.service.version,
      },
    })
  );
}

export const logger = winston.createLogger({
  level: 'info',
  transports: transportsList,
});
