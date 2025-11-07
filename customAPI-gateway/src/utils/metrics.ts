import { Registry, Counter, Histogram, Gauge } from 'prom-client';
const register = new Registry();

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status', 'service'],
  registers: [register]
});

const httpRequestCount = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status', 'service'],
  registers: [register]
});

const gatewayRequests = new Counter({
  name: 'gateway_requests_total',
  help: 'Total requests through gateway',
  labelNames: ['target_service', 'status_code', 'route'],
  registers: [register]
});

const authFailures = new Counter({
  name: 'gateway_auth_failures_total',
  help: 'Total authentication failures',
  labelNames: ['reason'],
  registers: [register]
});

const rateLimitHits = new Counter({
  name: 'gateway_rate_limit_hits_total',
  help: 'Total rate limit hits',
  labelNames: ['route'],
  registers: [register]
});

const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
  registers: [register]
});

export { register, httpRequestDuration, httpRequestCount, gatewayRequests, authFailures, rateLimitHits, activeConnections };

