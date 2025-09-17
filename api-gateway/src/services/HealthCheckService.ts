// src/services/HealthCheckService.ts
import services from '../config/services';

export interface ServiceHealth {
  name: string;
  url: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  responseTime: number;
  lastChecked: Date;
  error?: string;
}

export class HealthCheckService {
  private static healthStatus: Map<string, ServiceHealth> = new Map();

  static async checkServiceHealth(serviceName: string): Promise<ServiceHealth> {
    const service = services[serviceName];
    if (!service) {
      return {
        name: serviceName,
        url: 'unknown',
        status: 'unknown',
        responseTime: 0,
        lastChecked: new Date(),
        error: 'Service not found in configuration',
      };
    }

    const startTime = Date.now();
    
    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), service.timeout);

      const response = await fetch(`${service.url}${service.healthCheckPath}`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      const isHealthy = response.ok;

      const health: ServiceHealth = {
        name: service.name,
        url: service.url,
        status: isHealthy ? 'healthy' : 'unhealthy',
        responseTime,
        lastChecked: new Date(),
        error: isHealthy ? undefined : `HTTP ${response.status}: ${response.statusText}`,
      };

      this.healthStatus.set(serviceName, health);
      return health;
    } catch (error: unknown) {
      const responseTime = Date.now() - startTime;
      let errorMessage = 'Unknown error';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = `Request timeout after ${service.timeout}ms`;
        } else {
          errorMessage = error.message;
        }
      }
      
      const health: ServiceHealth = {
        name: service.name,
        url: service.url,
        status: 'unhealthy',
        responseTime,
        lastChecked: new Date(),
        error: errorMessage,
      };

      this.healthStatus.set(serviceName, health);
      return health;
    }
  }

  static async checkAllServices(): Promise<ServiceHealth[]> {
    const serviceNames = Object.keys(services);
    const healthChecks = await Promise.allSettled(
      serviceNames.map(serviceName => this.checkServiceHealth(serviceName)),
    );

    return healthChecks
      .filter((result): result is PromiseFulfilledResult<ServiceHealth> => result.status === 'fulfilled')
      .map(result => result.value);
  }

  static getServiceHealth(serviceName: string): ServiceHealth | undefined {
    return this.healthStatus.get(serviceName);
  }

  static getAllHealthStatus(): ServiceHealth[] {
    return Array.from(this.healthStatus.values());
  }

  static isServiceHealthy(serviceName: string): boolean {
    const health = this.healthStatus.get(serviceName);
    return health?.status === 'healthy';
  }
}