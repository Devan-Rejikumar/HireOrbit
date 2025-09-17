
import services from '../config/services';
import { HealthCheckService } from './HealthCheckService';

export interface ServiceInstance {
  name: string;
  url: string;
  healthy: boolean;
  lastChecked: Date;
  responseTime: number;
}

export class ServiceDiscoveryService {
  private static serviceInstances: Map<string, ServiceInstance[]> = new Map();
  private static currentInstances: Map<string, ServiceInstance> = new Map();

  static async discoverServices(): Promise<void> {
    console.log('�� Discovering services...');
    
    for (const [serviceName, serviceConfig] of Object.entries(services)) {
      try {
        // Check if service is healthy
        const health = await HealthCheckService.checkServiceHealth(serviceName);
        
        const instance: ServiceInstance = {
          name: serviceConfig.name,
          url: serviceConfig.url,
          healthy: health.status === 'healthy',
          lastChecked: new Date(),
          responseTime: health.responseTime,
        };

        // Store the instance
        this.currentInstances.set(serviceName, instance);
        
        console.log(`✅ Discovered ${serviceName}: ${serviceConfig.url} (${health.status})`);
      } catch (error: unknown) {
        console.error(`❌ Failed to discover ${serviceName}:`, error);
      }
    }
  }

  static getServiceUrl(serviceName: string): string | null {
    const instance = this.currentInstances.get(serviceName);
    if (instance && instance.healthy) {
      return instance.url;
    }
    
    // Fallback to config if discovery failed
    const serviceConfig = services[serviceName];
    return serviceConfig?.url || null;
  }

  static getServiceInstances(serviceName: string): ServiceInstance[] {
    return this.serviceInstances.get(serviceName) || [];
  }

  static getAllServiceInstances(): Map<string, ServiceInstance[]> {
    return new Map(this.serviceInstances);
  }

  static async refreshServiceDiscovery(): Promise<void> {
    await this.discoverServices();
  }
}