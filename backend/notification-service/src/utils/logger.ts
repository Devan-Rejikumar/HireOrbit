import winston from 'winston'
import LokiTransport from 'winston-loki'
import { AppConfig } from '../config/app.config'

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: winston.format.simple(),
  }),
]

if (AppConfig.logging.lokiHost) {
  transports.push(
    new LokiTransport({
      host: AppConfig.logging.lokiHost,
      labels: {
        service: AppConfig.service.name,
        version: AppConfig.service.version,
      },
    })
  )
}

export const logger = winston.createLogger({
  level: 'info',
  transports,
})
