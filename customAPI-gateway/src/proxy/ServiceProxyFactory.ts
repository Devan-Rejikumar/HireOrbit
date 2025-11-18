import proxy from 'express-http-proxy';
import { Request, Response, NextFunction } from 'express';
import { HttpStatusCode } from '@/enums/HttpStatusCode';
import { CommonMessages } from '@/constants/CommonMessages';

/**
 * Configuration interface for creating service proxies
 */
export interface ProxyConfig {
  serviceUrl: string;
  serviceName: string;
  enableLogging?: boolean;
}

/**
 * Factory class for creating standardized service proxies
 * Eliminates code duplication across all service proxy files
 */
export class ServiceProxyFactory {
  /**
   * Creates a standard JSON proxy for a service
   * @param config - Proxy configuration including service URL and name
   * @returns Configured proxy middleware
   */
  static createProxy(config: ProxyConfig) {
    const { serviceUrl, serviceName, enableLogging = true } = config;

    return proxy(serviceUrl, {
      proxyReqPathResolver: (req) => {
        if (enableLogging) {
          console.log(`[${serviceName.toUpperCase()}-PROXY] JSON request to:`, req.originalUrl);
        }
        return req.originalUrl;
      },

      proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        if (srcReq.headers['x-user-id']) {
          proxyReqOpts.headers['x-user-id'] = srcReq.headers['x-user-id'];
        }
        if (srcReq.headers['x-user-email']) {
          proxyReqOpts.headers['x-user-email'] = srcReq.headers['x-user-email'];
        }
        if (srcReq.headers['x-user-role']) {
          proxyReqOpts.headers['x-user-role'] = srcReq.headers['x-user-role'];
        }
        if (srcReq.headers.authorization) {
          proxyReqOpts.headers['Authorization'] = srcReq.headers.authorization;
        }
        if (srcReq.headers.cookie) {
          proxyReqOpts.headers['Cookie'] = srcReq.headers.cookie;
        }

        if (enableLogging) {
          console.log(`[${serviceName.toUpperCase()}-PROXY] Forwarding headers:`, {
            'x-user-id': srcReq.headers['x-user-id'],
            'x-user-email': srcReq.headers['x-user-email'],
            'x-user-role': srcReq.headers['x-user-role']
          });
        }

        return proxyReqOpts;
      },

      userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        if (enableLogging) {
          console.log(`[${serviceName.toUpperCase()}-PROXY] JSON response:`, proxyRes.statusCode);
        }
        return proxyResData;
      },

      proxyErrorHandler: (err: Error, res: Response, next: NextFunction) => {
        console.error(`[${serviceName.toUpperCase()}-PROXY] Error:`, err);
        res.status(HttpStatusCode.SERVICE_UNAVAILABLE).json({
          success: false,
          error: CommonMessages.SERVICE_ERROR(serviceName),
          message: CommonMessages.SERVICE_UNAVAILABLE(serviceName),
          timeStamp: new Date().toISOString()
        });
      }
    });
  }

  /**
   * Creates a multipart/form-data proxy for file uploads
   * @param config - Proxy configuration including service URL and name
   * @returns Configured multipart proxy middleware
   */
  static createMultipartProxy(config: ProxyConfig) {
    const { serviceUrl, serviceName, enableLogging = true } = config;

    return proxy(serviceUrl, {
      proxyReqPathResolver: (req) => {
        if (enableLogging) {
          console.log(`[${serviceName.toUpperCase()}-MULTIPART-PROXY] File upload request to:`, req.originalUrl);
        }
        return req.originalUrl;
      },
      parseReqBody: false,

      proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        if (srcReq.headers['x-user-id']) {
          proxyReqOpts.headers['x-user-id'] = srcReq.headers['x-user-id'];
        }
        if (srcReq.headers['x-user-email']) {
          proxyReqOpts.headers['x-user-email'] = srcReq.headers['x-user-email'];
        }
        if (srcReq.headers['x-user-role']) {
          proxyReqOpts.headers['x-user-role'] = srcReq.headers['x-user-role'];
        }
        if (srcReq.headers.authorization) {
          proxyReqOpts.headers['Authorization'] = srcReq.headers.authorization;
        }

        if (srcReq.headers.cookie) {
          proxyReqOpts.headers['Cookie'] = srcReq.headers.cookie;
        }

        if (enableLogging) {
          console.log(`[${serviceName.toUpperCase()}-MULTIPART-PROXY] Forwarding headers:`, {
            'x-user-id': srcReq.headers['x-user-id'],
            'x-user-role': srcReq.headers['x-user-role']
          });
        }

        return proxyReqOpts;
      },

      userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        if (enableLogging) {
          console.log(`[${serviceName.toUpperCase()}-MULTIPART-PROXY] Upload response:`, proxyRes.statusCode);
        }
        return proxyResData;
      },

      proxyErrorHandler: (err: Error, res: Response, next: NextFunction) => {
        console.error(`[${serviceName.toUpperCase()}-MULTIPART-PROXY] Proxy error:`, err);
        res.status(HttpStatusCode.SERVICE_UNAVAILABLE).json({
          success: false,
          error: CommonMessages.SERVICE_ERROR(serviceName),
          message: CommonMessages.FILE_UPLOAD_FAILED,
          timeStamp: new Date().toISOString()
        });
      }
    });
  }
}