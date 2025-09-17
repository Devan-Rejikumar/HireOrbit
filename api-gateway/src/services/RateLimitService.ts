// src/services/RateLimitService.ts
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export class RateLimitService {
  private static rateLimits: Map<string, Map<string, { count: number; resetTime: number }>> = new Map();
  private static config: RateLimitConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000, // 1000 requests per 15 minutes (increased for development)
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  };

  static isAllowed(identifier: string, endpoint: string = 'global'): { allowed: boolean; info: RateLimitInfo } {
    const now = Date.now();
    const key = `${identifier}:${endpoint}`;
    
    if (!this.rateLimits.has(endpoint)) {
      this.rateLimits.set(endpoint, new Map());
    }

    const endpointLimits = this.rateLimits.get(endpoint)!;
    const current = endpointLimits.get(key);

    if (!current || now > current.resetTime) {
      // New window or expired window
      endpointLimits.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs,
      });

      return {
        allowed: true,
        info: {
          limit: this.config.maxRequests,
          remaining: this.config.maxRequests - 1,
          resetTime: now + this.config.windowMs,
        },
      };
    }

    if (current.count >= this.config.maxRequests) {
      return {
        allowed: false,
        info: {
          limit: this.config.maxRequests,
          remaining: 0,
          resetTime: current.resetTime,
          retryAfter: Math.ceil((current.resetTime - now) / 1000),
        },
      };
    }

    current.count++;
    return {
      allowed: true,
      info: {
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests - current.count,
        resetTime: current.resetTime,
      },
    };
  }

  static recordRequest(identifier: string, endpoint: string = 'global', success: boolean = true): void {
    if ((success && this.config.skipSuccessfulRequests) || 
        (!success && this.config.skipFailedRequests)) {
      return;
    }

    this.isAllowed(identifier, endpoint);
  }

  static getRateLimitInfo(identifier: string, endpoint: string = 'global'): RateLimitInfo | null {
    const now = Date.now();
    const key = `${identifier}:${endpoint}`;
    
    const endpointLimits = this.rateLimits.get(endpoint);
    if (!endpointLimits) return null;

    const current = endpointLimits.get(key);
    if (!current || now > current.resetTime) {
      return {
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests,
        resetTime: now + this.config.windowMs,
      };
    }

    return {
      limit: this.config.maxRequests,
      remaining: Math.max(0, this.config.maxRequests - current.count),
      resetTime: current.resetTime,
    };
  }

  static clearRateLimit(identifier: string, endpoint: string = 'global'): void {
    const key = `${identifier}:${endpoint}`;
    const endpointLimits = this.rateLimits.get(endpoint);
    if (endpointLimits) {
      endpointLimits.delete(key);
    }
  }

  static clearAllRateLimits(): void {
    this.rateLimits.clear();
  }
}