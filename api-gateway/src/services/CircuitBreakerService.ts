// src/services/CircuitBreakerService.ts
export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
}

export interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  lastFailureTime: number;
  nextAttemptTime: number;
}

export class CircuitBreakerService {
  private static circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private static config: CircuitBreakerConfig = {
    failureThreshold: 5,
    recoveryTimeout: 60000, // 1 minute
    monitoringPeriod: 10000, // 10 seconds
  };

  static canExecute(serviceName: string): boolean {
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    
    if (!circuitBreaker) {
      // Initialize circuit breaker for new service
      this.circuitBreakers.set(serviceName, {
        state: 'CLOSED',
        failureCount: 0,
        lastFailureTime: 0,
        nextAttemptTime: 0,
      });
      return true;
    }

    const now = Date.now();

    switch (circuitBreaker.state) {
    case 'CLOSED':
      return true;
      
    case 'OPEN':
      if (now >= circuitBreaker.nextAttemptTime) {
        circuitBreaker.state = 'HALF_OPEN';
        return true;
      }
      return false;
      
    case 'HALF_OPEN':
      return true;
      
    default:
      return true;
    }
  }

  static recordSuccess(serviceName: string): void {
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    if (circuitBreaker) {
      circuitBreaker.state = 'CLOSED';
      circuitBreaker.failureCount = 0;
      circuitBreaker.lastFailureTime = 0;
      circuitBreaker.nextAttemptTime = 0;
    }
  }

  static recordFailure(serviceName: string): void {
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    if (!circuitBreaker) {
      this.circuitBreakers.set(serviceName, {
        state: 'CLOSED',
        failureCount: 1,
        lastFailureTime: Date.now(),
        nextAttemptTime: 0,
      });
      return;
    }

    circuitBreaker.failureCount++;
    circuitBreaker.lastFailureTime = Date.now();

    if (circuitBreaker.failureCount >= this.config.failureThreshold) {
      circuitBreaker.state = 'OPEN';
      circuitBreaker.nextAttemptTime = Date.now() + this.config.recoveryTimeout;
      console.log(`🚨 Circuit breaker OPEN for ${serviceName} - too many failures`);
    }
  }

  static getCircuitBreakerState(serviceName: string): CircuitBreakerState | undefined {
    return this.circuitBreakers.get(serviceName);
  }

  static getAllCircuitBreakerStates(): Map<string, CircuitBreakerState> {
    return new Map(this.circuitBreakers);
  }
}