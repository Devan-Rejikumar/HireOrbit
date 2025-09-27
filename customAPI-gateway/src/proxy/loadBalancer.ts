import { Request, Response, NextFunction } from 'express';
import { userServiceProxy } from './userService';
import { companyServiceProxy } from './companyService';
import { jobServiceProxy } from './jobService';
import { applicationServiceProxy } from './applicationService';
import * as http from 'http';
export const createProxy = (req: Request, res: Response, next: NextFunction): void => {
  const path = req.originalUrl;

  if (path.startsWith('/api/users')) {
    const postData = JSON.stringify(req.body);
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: req.originalUrl,
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),

        ...(req.headers.authorization && { 'Authorization': req.headers.authorization }),
        ...(req.headers['x-user-id'] && { 'x-user-id': req.headers['x-user-id'] }),
        ...(req.headers['x-user-email'] && { 'x-user-email': req.headers['x-user-email'] }),
        ...(req.headers['x-user-role'] && { 'x-user-role': req.headers['x-user-role'] }),
        ...(req.headers.cookie && { 'Cookie': req.headers.cookie })
      }
    };
    
    console.log('🔀 [LOAD BALANCER] Making HTTP request to:', `http://localhost:3000${req.originalUrl}`);
    console.log('🔀 [LOAD BALANCER] Request headers being sent:', JSON.stringify(options.headers, null, 2));
    
    const proxyReq = http.request(options, (proxyRes) => {
      console.log('✅ [LOAD BALANCER] Got response from User Service:', proxyRes.statusCode);
      
      // Set response headers
      res.statusCode = proxyRes.statusCode || 200;
      Object.keys(proxyRes.headers).forEach(key => {
        const value = proxyRes.headers[key];
        if (value !== undefined) {
          res.setHeader(key, value);
        }
      });
      
      // Pipe response data
      proxyRes.pipe(res);
    });
    
    proxyReq.on('error', (err) => {
      console.log('❌ [LOAD BALANCER] HTTP request error:', err.message);
      res.status(500).json({ error: 'User service unavailable' });
    });
    
    proxyReq.write(postData);
    proxyReq.end();
  } else if (path.startsWith('/api/company')) {
    console.log('🔀 Routing to Company Service');
    console.log('🔀 [LOAD BALANCER] About to call companyServiceProxy...');
    companyServiceProxy(req, res, next);
  } else if (path.startsWith('/api/jobs')) {
    console.log('🔀 Routing to Job Service');
    console.log('🔀 [LOAD BALANCER] About to call jobServiceProxy...');
    jobServiceProxy(req, res, next);
  } else if (path.startsWith('/api/applications')) {
    console.log('🔀 Routing to Application Service');
    console.log('🔀 [LOAD BALANCER] About to call applicationServiceProxy...');
    applicationServiceProxy(req, res, next);
  } else {
    console.log('🔀 Default routing to User Service');
    console.log('🔀 [LOAD BALANCER] About to call userServiceProxy (default)...');
    userServiceProxy(req, res, next);
  }
};