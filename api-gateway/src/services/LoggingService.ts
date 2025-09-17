// src/services/LoggingService.ts
import { Request } from 'express';
import { AuthRequest } from '../types/auth';

export class LoggingService {
  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static logRequest(req: Request, serviceName?: string): string {
    const requestId = this.generateRequestId();
    
    console.log(`�� [${requestId}] ${req.method} ${req.url}`, {
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: (req as AuthRequest).user?.id,
      userRole: (req as AuthRequest).user?.role,
      serviceName,
      timestamp: new Date().toISOString(),
    });

    return requestId;
  }

  static logResponse(requestId: string, method: string, url: string, statusCode: number, responseTime: number, serviceName?: string): void {
    console.log(`✅ [${requestId}] ${method} ${url} - ${statusCode} (${responseTime}ms)`, {
      serviceName,
      timestamp: new Date().toISOString(),
    });
  }

  static logError(requestId: string, error: Error, serviceName?: string): void {
    console.error(`❌ [${requestId}] Error in ${serviceName || 'unknown service'}:`, {
      error: error.message,
      serviceName,
      timestamp: new Date().toISOString(),
    });
  }
}