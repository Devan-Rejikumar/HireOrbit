import 'reflect-metadata';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import multer from 'multer';

import {
  authenticateJobseeker,
  authenticateCompany,
  authenticateAdmin,
  authenticateAnyUser,
  routeByTokenType,
  blacklistToken,
} from './middleware/unifiedAuth';

import { AuthRequest } from './types/auth';
import { HttpStatusCode } from './enums/StatusCodes';
import { ProxyService } from './services/ProxyService';
import { HealthCheckService } from './services/HealthCheckService';
import { CircuitBreakerService } from './services/CircuitBreakerService';
import { RateLimitService } from './services/RateLimitService';
import config from './config/environment';

dotenv.config();

const app = express();

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['set-cookie'],
}));

app.use(cookieParser());

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log('🔍 Incoming request:', {
    path: req.path,
    method: req.method,
    cookies: req.cookies,
    headers: req.headers,
    hasBody: !!req.body,
    bodyType: typeof req.body,
    bodyContent: req.body,
  });
  next();
});


app.get('/health', (req: Request, res: Response) => {
  res.json({ message: 'API Gateway is running!' });
});


app.post('/dev/clear-rate-limits', (req: Request, res: Response) => {
  RateLimitService.clearAllRateLimits();
  res.status(HttpStatusCode.OK).json({ message: 'Rate limits cleared successfully' });
});
app.get('/api/test-user-service', async (req: Request, res: Response) => {
  try {
    const response = await fetch('http://localhost:3000/api/users/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': req.headers.cookie || '',
      },
    });
    
    const data = await response.json();
    res.json({ 
      status: response.status, 
      data: data,
      cookiesSent: req.headers.cookie 
    });
  } catch (error: unknown) {
    res.status(500).json({ error: 'Test failed' });
  }
});

app.use((req: Request, res: Response, next: NextFunction) => {
  next();
});

app.use('/api/users/me', async (req: Request, res: Response) => {

  if (req.cookies.adminAccessToken && !req.cookies.accessToken && !req.cookies.companyAccessToken) {
    console.log(' [DEBUG] Admin token found, forwarding to admin/me');
    try {
      const response = await fetch('http://localhost:3000/api/users/admin/me', {
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
          'Cookie': req.headers.cookie || '',
        },
      });
      
      const data = await response.json();
      res.status(response.status).json(data);
      return;
    } catch (error: unknown) {
      console.error('Error forwarding admin me:', error);
    }
  }

  try {

    const response = await fetch('http://localhost:3000/api/users/me', {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': req.headers.cookie || '',
      },
    });
    
    const data = await response.json();
    console.log('🔍 [DEBUG] User service response:', data);
    
    const setCookieHeaders = response.headers.getSetCookie();
    if (setCookieHeaders.length > 0) {
      res.setHeader('Set-Cookie', setCookieHeaders);
    }
    
    res.status(response.status).json(data);
  } catch (error: unknown) {
    console.error('Error forwarding to user service:', error);
    res.status(500).json({ error: 'Service unavailable' });
  }
});

app.post('/api/users/admin/login', async (req: Request, res: Response) => {
  try {
    const response = await fetch('http://localhost:3000/api/users/admin/login', {
      method: 'POST',
      body: JSON.stringify(req.body),
      headers: { 'Content-Type': 'application/json' },
    });
    
    const data = await response.json();
    
    console.log('[Gateway] 5. Headers from user-service:', response.headers);

    const setCookieHeaders = response.headers.getSetCookie();
    console.log('[Gateway] 6. Extracted Set-Cookie headers:', setCookieHeaders);

    if (setCookieHeaders.length > 0) {
      res.setHeader('Set-Cookie', setCookieHeaders);
      console.log('[Gateway] 7. Set-Cookie header is being forwarded to the client.');
    } else {
      console.log('[Gateway] 7. No Set-Cookie header found from user-service.');
    }
    res.status(response.status).json(data);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Gateway] Error in admin login route:', errorMessage);
    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ error: 'Service unavailable' });
  }
});

app.use('/api/users/admin', 
  (req: Request, res: Response, next: NextFunction) => {
    console.log('[Gateway] ADMIN ROUTE HIT:', req.method, req.url);
    next();
  },
  authenticateAdmin,
  async (req: AuthRequest, res: Response) => {
    // Preserve the original path for admin routes
    req.url = '/api/users/admin' + req.url;
    await ProxyService.forwardToUserService(req, res);
  },
);

app.post('/api/users/refresh-token', async (req: Request, res: Response) => {
  try {
    const response = await fetch('http://localhost:3000/api/users/refresh-token', {
      method: 'POST',
      body: JSON.stringify(req.body),
      headers: {
        'Content-Type': 'application/json',
        'Cookie': req.headers.cookie || '',
      },
    });
    
    const data = await response.json();
    const setCookieHeaders = response.headers.getSetCookie();
    if (setCookieHeaders.length > 0) {
      res.setHeader('Set-Cookie', setCookieHeaders);
    }
    
    res.status(response.status).json(data);
  } catch (error: unknown) {
    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ error: 'Service unavailable' });
  }
});

app.post('/api/company/refresh-token', async (req: Request, res: Response) => {
  try {
    console.log('🔄 [COMPANY-REFRESH] Starting company token refresh');
    console.log('🔄 [COMPANY-REFRESH] Cookies received:', req.headers.cookie);
    
    const response = await fetch('http://localhost:3001/api/company/refresh-token', {
      method: 'POST',
      body: JSON.stringify(req.body),
      headers: {
        'Content-Type': 'application/json',
        'Cookie': req.headers.cookie || '',
      },
    });
    
    const data = await response.json();
    const setCookieHeaders = response.headers.getSetCookie();
    console.log('🔄 [COMPANY-REFRESH] Response status:', response.status);
    console.log('🔄 [COMPANY-REFRESH] Set-Cookie headers:', setCookieHeaders);
    
    if (setCookieHeaders.length > 0) {
      res.setHeader('Set-Cookie', setCookieHeaders);
      console.log('🔄 [COMPANY-REFRESH] Cookies forwarded to client');
    }
    
    res.status(response.status).json(data);
  } catch (error: unknown) {
    console.error('❌ [COMPANY-REFRESH] Error:', error);
    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ error: 'Service unavailable' });
  }
});

app.use('/api/users', async (req: Request, res: Response) => {
  const publicRoutes = ['/login','/register','/generate-otp','/verify-otp','/forgot-password','/reset-password','/refresh-token','/google-auth'];

  if (publicRoutes.includes(req.url) && req.method === 'POST') {
    try {
      const response = await fetch(`http://localhost:3000/api/users${req.url}`, {
        method: 'POST',
        body: JSON.stringify(req.body),
        headers: { 'Content-Type': 'application/json' },
      });

      
      const data = await response.json();
      const setCookieHeaders = response.headers.getSetCookie();
      
      if (setCookieHeaders.length > 0) {
        res.setHeader('Set-Cookie', setCookieHeaders);
      } else {
        console.log('❌ [AUTH-FLOW] No cookies to set');
      }
      
      res.status(response.status).json(data);
      return;
    } catch (error: unknown) {
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ error: 'Service unavailable' });
      return; 
    }
  }
  
  return authenticateJobseeker(req as AuthRequest, res, async () => {
    console.log('✅ [AUTH-FLOW] Authentication passed, forwarding to ProxyService');
    await ProxyService.forwardToUserService(req, res);
  });
});

app.use('/api/profile', authenticateAnyUser, upload.any(), async (req: AuthRequest, res: Response) => {
  req.url = '/api/profile' + req.url;
  await ProxyService.forwardToUserService(req, res);
});

app.use('/api/company/admin', 
  authenticateAdmin,
  async (req: AuthRequest, res: Response) => {
    // Preserve the original path for admin routes
    req.url = '/api/company/admin' + req.url;
    await ProxyService.forwardToCompanyService(req, res);
  },
);

app.use('/api/company', async (req: Request, res: Response) => {
  const publicCompanyRoutes = ['/login','/register','/generate-otp','/verify-otp','/resend-otp','/logout','/refresh-token','/search'];
  if (publicCompanyRoutes.includes(req.url) && req.method === 'POST') {
    try {
      console.log('[Gateway] Forwarding company login to company-service');
      const response = await fetch(
        `http://localhost:3001/api/company${req.url}`,
        {
          method: 'POST',
          body: JSON.stringify(req.body),
          headers: { 'Content-Type': 'application/json' },
        },
      );
      const data = await response.json();
      const setCookieHeaders = response.headers.getSetCookie();
      if (setCookieHeaders.length > 0) {
        res.setHeader('Set-Cookie', setCookieHeaders);
      }

      res.status(response.status).json(data);
      return;
    } catch (error: unknown) {
      res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ error: 'Service unavailable' });
      return;
    }
  }
  if (publicCompanyRoutes.includes(req.url.split('?')[0]) && (req.method === 'POST' || req.method === 'GET')) {
    try {
      console.log('[Gateway] Forwarding company GET request to company-service');
      const response = await fetch(
        `http://localhost:3001/api/company${req.url}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        },
      );
      const data = await response.json();
      res.status(response.status).json(data);
      return;
    } catch (error: unknown) {
      res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ error: 'Service unavailable' });
      return;
    }
  }
  
  return authenticateCompany(req as AuthRequest, res, async () => {
    await ProxyService.forwardToCompanyService(req, res);
  }); 
});


app.use('/api/jobs', async (req: Request, res: Response) => {
  console.log('🔍 Gateway: Jobs route hit');
  console.log('�� Gateway: req.method:', req.method);
  console.log(' Gateway: req.url:', req.url);
  console.log('🔍 Gateway: req.query:', req.query);
  if (req.url.startsWith('/suggestions')) {
    try {
      const response = await fetch(`http://localhost:3002/api/jobs${req.url}`, {
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      res.status(response.status).json(data);
      return;
    } catch (error: unknown) {
      console.error('Error fetching job suggestions:', error);
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ error: 'Service unavailable' });
      return;
    }
  }
  req.url = '/api/jobs' + req.url;
  await ProxyService.forwardToJobService(req, res);
});

app.use('/api/applications', authenticateAnyUser, async (req: AuthRequest, res: Response) => {
  await ProxyService.forwardToApplicationService(req, res);
});


app.get('/api/health', async (req: Request, res: Response) => {
  const healthChecks = await HealthCheckService.checkAllServices();
  const overallHealth = healthChecks.every(service => service.status === 'healthy');
  
  res.status(overallHealth ? 200 : 503).json({
    status: overallHealth ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    services: healthChecks,
  });
});

app.get('/api/health/:serviceName', async (req: Request, res: Response) => {
  const serviceName = req.params.serviceName;
  const health = await HealthCheckService.checkServiceHealth(serviceName);
  
  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});

app.get('/api/gateway/status', async (req: Request, res: Response) => {
  const healthChecks = await HealthCheckService.checkAllServices();
  const circuitBreakers = CircuitBreakerService.getAllCircuitBreakerStates();
  const rateLimits = RateLimitService.getRateLimitInfo('global', 'global');
  
  const overallHealth = healthChecks.every(service => service.status === 'healthy');
  
  res.json({
    status: overallHealth ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    services: healthChecks,
    circuitBreakers: Object.fromEntries(circuitBreakers),
    rateLimits: rateLimits,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

app.get('/api/circuit-breakers', (req: Request, res: Response) => {
  const circuitBreakers = CircuitBreakerService.getAllCircuitBreakerStates();
  const status = Object.fromEntries(circuitBreakers);
  res.json(status);
});

app.get('/api/rate-limits/:identifier', (req: Request, res: Response) => {
  const identifier = req.params.identifier;
  const endpoint = req.query.endpoint as string || 'global';
  const info = RateLimitService.getRateLimitInfo(identifier, endpoint);
  
  if (!info) {
    res.status(404).json({ error: 'Rate limit info not found' });
    return;
  }
  
  res.json(info);
});

app.post('/api/logout', async (req: AuthRequest, res: Response) => {
  try {
    const accessToken = req.cookies.accessToken;
    const companyAccessToken = req.cookies.companyAccessToken;
    const adminAccessToken = req.cookies.adminAccessToken;
    if (accessToken) {
      blacklistToken(accessToken);
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
    } else if (companyAccessToken) {
      blacklistToken(companyAccessToken);
      res.clearCookie('companyAccessToken');
      res.clearCookie('companyRefreshToken');
    } else if (adminAccessToken) {
      blacklistToken(adminAccessToken);
      res.clearCookie('adminAccessToken');
      res.clearCookie('adminRefreshToken');
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error: unknown) {
    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ error: 'Logout failed' });
  }
});

const PORT = config.port;

process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});