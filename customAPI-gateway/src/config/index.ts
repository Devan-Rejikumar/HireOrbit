import { env, PORT, NODE_ENV, JWT_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN } from './env';
import { services, getServiceUrl, getServiceHealthCheck, getServiceTimeout, getServiceRetries,SERVICE_NAMES } from './services';

export { env, PORT, NODE_ENV, JWT_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN };

export { services, getServiceUrl, getServiceHealthCheck, getServiceTimeout, getServiceRetries,SERVICE_NAMES};

export { env as environment };
export { services as serviceConfig };