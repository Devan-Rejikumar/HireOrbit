import { Request, Response } from 'express';
import { AuthRequest } from '../types/auth';
import services from '../config/services';
import { HttpStatusCode } from '../enums/StatusCodes';
import { CircuitBreakerService } from './CircuitBreakerService';
import { RateLimitService } from './RateLimitService';
import { LoggingService } from './LoggingService';

interface RequestHeaders {
  [key: string]: string;
}

interface UserContext {
  id: string;
  email: string;
  role: string;
  userType?: string;
  companyName?: string;
}

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

interface RequestWithFiles extends Request {
  multerFiles?: MulterFile[];
  files?: any;
}

export class ProxyService {
  private static async makeRequest(
    serviceName: string,
    req: RequestWithFiles,
    res: Response,
    additionalHeaders: RequestHeaders = {},
  ): Promise<void> {
    const service = services[serviceName];
    if (!service) {
      res.status(HttpStatusCode.NOT_FOUND).json({ error: 'Service not found' });
      return;
    }

    const requestId = LoggingService.logRequest(req, serviceName)
    if (!CircuitBreakerService.canExecute(serviceName)) {
      console.log(`🚨 Circuit breaker OPEN for ${serviceName} - request blocked`);
      res.status(HttpStatusCode.SERVICE_UNAVAILABLE).json({ 
        error: 'Service temporarily unavailable',
        retryAfter: 60,
      });
      return;
    }
    const clientId = (req as AuthRequest).user?.id || req.ip || 'anonymous';
    const rateLimitResult = RateLimitService.isAllowed(clientId, serviceName);
    
    if (!rateLimitResult.allowed) {
      console.log(`🚦 Rate limit exceeded for ${clientId} on ${serviceName}`);
      res.status(HttpStatusCode.TOO_MANY_REQUESTS)
        .set('X-RateLimit-Limit', rateLimitResult.info.limit.toString())
        .set('X-RateLimit-Remaining', rateLimitResult.info.remaining.toString())
        .set('X-RateLimit-Reset', rateLimitResult.info.resetTime.toString())
        .json({ 
          error: 'Rate limit exceeded',
          retryAfter: rateLimitResult.info.retryAfter,
        });
      return;
    }

    const startTime = Date.now();

    try {
      const headers: RequestHeaders = {
        ...additionalHeaders,
      };
      
      // Set Content-Type header properly
      if (req.headers['content-type']) {
        headers['Content-Type'] = req.headers['content-type'];
      } else {
        headers['Content-Type'] = 'application/json';
      }
      // Context-aware token priority based on service
      if (serviceName === 'userService') {
        // For user service: accessToken > adminAccessToken > companyAccessToken
        if (req.cookies.accessToken) {
          headers['Authorization'] = `Bearer ${req.cookies.accessToken}`;
          console.log(`[ProxyService] Forwarding user JWT token in Authorization header for ${serviceName}`);
        } else if (req.cookies.adminAccessToken) {
          headers['Authorization'] = `Bearer ${req.cookies.adminAccessToken}`;
          console.log(`[ProxyService] Forwarding admin JWT token in Authorization header for ${serviceName}`);
        } else if (req.cookies.companyAccessToken) {
          headers['Authorization'] = `Bearer ${req.cookies.companyAccessToken}`;
          console.log(`[ProxyService] Forwarding company JWT token in Authorization header for ${serviceName}`);
        } else {
          console.log(`[ProxyService] No JWT token found in cookies for ${serviceName}`);
        }
      } else if (serviceName === 'companyService') {
        // For company service: companyAccessToken > adminAccessToken > accessToken
        if (req.cookies.companyAccessToken) {
          headers['Authorization'] = `Bearer ${req.cookies.companyAccessToken}`;
          console.log(`[ProxyService] Forwarding company JWT token in Authorization header for ${serviceName}`);
        } else if (req.cookies.adminAccessToken) {
          headers['Authorization'] = `Bearer ${req.cookies.adminAccessToken}`;
          console.log(`[ProxyService] Forwarding admin JWT token in Authorization header for ${serviceName}`);
        } else if (req.cookies.accessToken) {
          headers['Authorization'] = `Bearer ${req.cookies.accessToken}`;
          console.log(`[ProxyService] Forwarding user JWT token in Authorization header for ${serviceName}`);
        } else {
          console.log(`[ProxyService] No JWT token found in cookies for ${serviceName}`);
        }
      } else {
        // For other services: adminAccessToken > companyAccessToken > accessToken
        if (req.cookies.adminAccessToken) {
          headers['Authorization'] = `Bearer ${req.cookies.adminAccessToken}`;
          console.log(`[ProxyService] Forwarding admin JWT token in Authorization header for ${serviceName}`);
        } else if (req.cookies.companyAccessToken) {
          headers['Authorization'] = `Bearer ${req.cookies.companyAccessToken}`;
          console.log(`[ProxyService] Forwarding company JWT token in Authorization header for ${serviceName}`);
        } else if (req.cookies.accessToken) {
          headers['Authorization'] = `Bearer ${req.cookies.accessToken}`;
          console.log(`[ProxyService] Forwarding user JWT token in Authorization header for ${serviceName}`);
        } else {
          console.log(`[ProxyService] No JWT token found in cookies for ${serviceName}`);
        }
      }
      if (serviceName === 'userService' && (req as AuthRequest).user?.id) {
        const user = (req as AuthRequest).user!; 
        headers['x-user-id'] = user.id;
        headers['x-user-email'] = user.email || '';
        headers['x-user-role'] = user.role;
        console.log(`[ProxyService] Added user context headers: x-user-id=${user.id}, x-user-role=${user.role}`);
      }
      if (req.headers.cookie) {
        headers['Cookie'] = req.headers.cookie;
      }
      let body: BodyInit | null = null;
      
      console.log('🔍 [ProxyService] Request body debug:', {
        hasBody: !!req.body,
        bodyType: typeof req.body,
        bodyContent: req.body,
        contentType: req.headers['content-type'],
        method: req.method
      });
      
      if (req.headers['content-type']?.includes('multipart/form-data')) {
        if (req.body && typeof req.body === 'object') {
         
          const bodyWithFiles = { ...req.body };
          
          
          if (req.files) {
            let filesArray: any[] = [];
            
            
            if (Array.isArray(req.files)) {
              filesArray = req.files;
            } else if (typeof req.files === 'object') {
              
              filesArray = Object.values(req.files).flat();
            }
            
            if (filesArray.length > 0) {
              console.log('🔍 [ProxyService] Processing files for User Service:', filesArray.length, 'files');
              filesArray.forEach((file: any) => {
                if (file.fieldname === 'profilePicture') {
   
                  const base64 = file.buffer.toString('base64');
                  const dataURI = `data:${file.mimetype};base64,${base64}`;
                  bodyWithFiles[file.fieldname] = dataURI;
                  console.log('🔍 [ProxyService] Converted file to base64 data URI, length:', dataURI.length);
                } else if (file.fieldname === 'resume') {
                 
                  const base64 = file.buffer.toString('base64');
                  const dataURI = `data:${file.mimetype};base64,${base64}`;
                  bodyWithFiles[file.fieldname] = dataURI;
                  console.log('🔍 [ProxyService] Converted resume to base64 data URI, length:', dataURI.length);
                }
              });
            }
          }
          
          body = JSON.stringify(bodyWithFiles);
          headers['Content-Type'] = 'application/json';
          console.log('🔍 [ProxyService] Converted multipart to JSON for User Service:', bodyWithFiles);
        }
      } else if (req.body) {
        console.log('🔍 [ProxyService] Forwarding JSON body:', req.body);
        body = JSON.stringify(req.body);
      } else {
        console.log('⚠️ [ProxyService] No request body found for', req.method, req.url);
      }

     
      let serviceUrl: string;
      console.log(`🔍 [DEBUG] Building URL for ${serviceName}, req.url: ${req.url}`);
      
      if (serviceName === 'userService' && req.url.startsWith('/api/users')) {
        // For admin routes, preserve the full path (already preserved by API Gateway)
        if (req.url.startsWith('/api/users/admin')) {
          serviceUrl = `${service.url}${req.url}`;
          console.log(`🔍 [DEBUG] User admin service: ${req.url} -> ${serviceUrl}`);
        } else {
          // For regular user routes, strip the prefix
          const relativePath = req.url.replace('/api/users', '') || '/';
          serviceUrl = `${service.url}${relativePath}`;
          console.log(`🔍 [DEBUG] User service: ${req.url} -> ${serviceUrl}`);
        }
      } else if (serviceName === 'jobService' && req.url.startsWith('/api/jobs')) {
        serviceUrl = `${service.url}${req.url}`;
        console.log(`🔍 [DEBUG] Job service: ${req.url} -> ${serviceUrl}`);
      } else if (serviceName === 'companyService') {
        // For admin routes, the full path is already preserved by API Gateway
        // For regular routes, we need to add the /api/company prefix
        if (req.url.startsWith('/api/company')) {
          serviceUrl = `${service.url}${req.url}`;
          console.log(`🔍 [DEBUG] Company admin service: ${req.url} -> ${serviceUrl}`);
        } else {
          serviceUrl = `${service.url}/api/company${req.url}`;
          console.log(`🔍 [DEBUG] Company service: ${req.url} -> ${serviceUrl}`);
        }
      } else {
        serviceUrl = `${service.url}${req.url}`;
        console.log(`🔍 [DEBUG] Other service: ${req.url} -> ${serviceUrl}`);
      }
      
      console.log(`🔄 [${serviceName}] ${req.method} ${req.url} -> ${serviceUrl}`);
      console.log(`🔍 [${serviceName}] Headers being sent:`, headers);
      console.log(`🔍 [${serviceName}] Content-Type being sent:`, headers['Content-Type']);
      console.log(`🔍 [${serviceName}] Body being sent:`, body);
      
      const response = await fetch(serviceUrl, {
        method: req.method,
        body: body,
        headers: headers,
      });

      const data = await response.json();
      const setCookieHeaders = response.headers.getSetCookie();
      if (setCookieHeaders.length > 0) {
        res.setHeader('Set-Cookie', setCookieHeaders);
      }

     
      CircuitBreakerService.recordSuccess(serviceName);
      RateLimitService.recordRequest(clientId, serviceName, response.ok);

      res.set('X-RateLimit-Limit', rateLimitResult.info.limit.toString());
      res.set('X-RateLimit-Remaining', rateLimitResult.info.remaining.toString());
      res.set('X-RateLimit-Reset', rateLimitResult.info.resetTime.toString());

      const responseTime = Date.now() - startTime;
      LoggingService.logResponse(requestId, req.method, req.url, response.status, responseTime, serviceName);

      res.status(response.status).json(data);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      LoggingService.logError(requestId, error instanceof Error ? error : new Error(errorMessage), serviceName);
      
     
      CircuitBreakerService.recordFailure(serviceName);
      RateLimitService.recordRequest(clientId, serviceName, false);
      
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ error: 'Service unavailable' });
    }
  }

  static async forwardToUserService(req: RequestWithFiles, res: Response): Promise<void> {
    await this.makeRequest('userService', req, res);
  }

  static async forwardToCompanyService(req: RequestWithFiles, res: Response): Promise<void> {
    await this.makeRequest('companyService', req, res);
  }

  static async forwardToJobService(req: RequestWithFiles, res: Response): Promise<void> {
    await this.makeRequest('jobService', req, res);
  }

  static async forwardToApplicationService(req: RequestWithFiles, res: Response): Promise<void> {
    await this.makeRequest('applicationService', req, res);
  }
}