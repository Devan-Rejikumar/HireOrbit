import proxy from 'express-http-proxy';
import { Request, Response, NextFunction } from 'express';
import { HttpStatusCode } from '../enums/HttpStatusCode';
import { CommonMessages } from '../constants/CommonMessages';
import { logger } from '../utils/logger';

export interface ProxyConfig {
  serviceUrl: string;
  serviceName: string;
  enableLogging?: boolean;
}

const USER_HEADERS = ['x-user-id', 'x-user-email', 'x-user-role'] as const;

const stripClientUserHeaders = (headers: Record<string, unknown>): void => {
  USER_HEADERS.forEach(header => {
    delete headers[header];
  });
};

const forwardServerUserHeaders = (sourceHeaders: Record<string, unknown>, targetHeaders: Record<string, unknown>): void => {
  USER_HEADERS.forEach(header => {
    if (sourceHeaders[header]) {
      targetHeaders[header] = sourceHeaders[header];
    }
  });
};

const forwardStandardHeaders = (sourceHeaders: Record<string, unknown>, targetHeaders: Record<string, unknown>): void => {
  if (sourceHeaders.authorization) {
    targetHeaders['Authorization'] = sourceHeaders.authorization;
  }
  if (sourceHeaders.cookie) {
    targetHeaders['Cookie'] = sourceHeaders.cookie;
  }
};

const createProxyErrorHandler = (serviceName: string) => {
  return (err: Error, res: Response, next: NextFunction): void => {
    logger.error(`[${serviceName.toUpperCase()}-PROXY] Error:`, err);
    res.status(HttpStatusCode.SERVICE_UNAVAILABLE).json({
      success: false,
      error: CommonMessages.SERVICE_ERROR(serviceName),
      message: CommonMessages.SERVICE_UNAVAILABLE(serviceName),
      timeStamp: new Date().toISOString()
    });
  };
};

export class ServiceProxyFactory {
  static createProxy(config: ProxyConfig) {
    const { serviceUrl, serviceName, enableLogging = true } = config;

    return proxy(serviceUrl, {
      proxyReqPathResolver: (req) => {
        if (enableLogging) {
          logger.info(`[${serviceName.toUpperCase()}-PROXY] JSON request to:`, { url: req.originalUrl });
        }
        return req.originalUrl;
      },

      proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        stripClientUserHeaders(proxyReqOpts.headers);
        
        forwardServerUserHeaders(srcReq.headers, proxyReqOpts.headers);
        forwardStandardHeaders(srcReq.headers, proxyReqOpts.headers);

        if (enableLogging) {
          logger.debug(`[${serviceName.toUpperCase()}-PROXY] Forwarding headers:`, {
            'x-user-id': srcReq.headers['x-user-id'],
            'x-user-email': srcReq.headers['x-user-email'],
            'x-user-role': srcReq.headers['x-user-role']
          });
        }

        return proxyReqOpts;
      },

      userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        if (enableLogging) {
          logger.info(`[${serviceName.toUpperCase()}-PROXY] JSON response:`, { statusCode: proxyRes.statusCode });
        }
        return proxyResData;
      },

      proxyErrorHandler: createProxyErrorHandler(serviceName)
    });
  }

  static createMultipartProxy(config: ProxyConfig) {
    const { serviceUrl, serviceName, enableLogging = true } = config;

    return proxy(serviceUrl, {
      proxyReqPathResolver: (req) => {
        if (enableLogging) {
          logger.info(`[${serviceName.toUpperCase()}-MULTIPART-PROXY] File upload request to:`, { url: req.originalUrl });
        }
        return req.originalUrl;
      },
      
      parseReqBody: false,

      proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        stripClientUserHeaders(proxyReqOpts.headers);
        
        forwardServerUserHeaders(srcReq.headers, proxyReqOpts.headers);
        forwardStandardHeaders(srcReq.headers, proxyReqOpts.headers);

        if (enableLogging) {
          logger.debug(`[${serviceName.toUpperCase()}-MULTIPART-PROXY] Forwarding headers:`, {
            'x-user-id': srcReq.headers['x-user-id'],
            'x-user-role': srcReq.headers['x-user-role']
          });
        }

        return proxyReqOpts;
      },

      userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        if (enableLogging) {
          logger.info(`[${serviceName.toUpperCase()}-MULTIPART-PROXY] Upload response:`, { statusCode: proxyRes.statusCode });
        }
        return proxyResData;
      },

      proxyErrorHandler: (err: Error, res: Response, next: NextFunction) => {
        logger.error(`[${serviceName.toUpperCase()}-MULTIPART-PROXY] Proxy error:`, err);
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