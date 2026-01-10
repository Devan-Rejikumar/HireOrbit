/* 
  Production-safe AppConfig
  - No dotenv
  - No defaults
  - Fail fast
*/

export const AppConfig = {
  service: {
    name: required('SERVICE_NAME'),
    version: required('SERVICE_VERSION'),
    nodeEnv: required('NODE_ENV'),
    port: number('PORT'),
  },

  kafka: {
    clientId: required('KAFKA_CLIENT_ID'),
    brokers: list('KAFKA_BROKERS'),
    groupId: required('KAFKA_GROUP_ID'),
  },

  mongo: {
    uri: required('MONGODB_URI'),
  },

  services: {
    jobServiceUrl: required('JOB_SERVICE_URL'),
    apiGatewayUrl: required('API_GATEWAY_URL'),
  },

  frontend: {
    url: required('FRONTEND_URL'),
  },

  logging: {
    lokiHost: optional('LOKI_HOST'),
  },
} as const

function required(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

function optional(key: string): string | undefined {
  return process.env[key]
}

function number(key: string): number {
  const value = required(key)
  const parsed = Number(value)
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a number`)
  }
  return parsed
}

function list(key: string): string[] {
  return required(key)
    .split(',')
    .map(v => v.trim())
    .filter(Boolean)
}
