import proxy from 'express-http-proxy';
import { env } from '../config/env';

export const notificationServiceProxy = proxy(env.NOTIFICATION_SERVICE_URL, {
  proxyReqPathResolver: (req) => {
    // The notification service expects /api/notifications prefix
    // The gateway already has it, so we forward as-is
    const path = req.originalUrl;
    console.log('NOTIFICATION-PROXY Request to:', path);
    console.log('NOTIFICATION-PROXY Forwarding to service:', `${env.NOTIFICATION_SERVICE_URL}${path}`);
    return path;
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
    
    console.log('NOTIFICATION-PROXY Forwarding headers:', {
      'x-user-id': srcReq.headers['x-user-id'],
      'x-user-email': srcReq.headers['x-user-email'],
      'x-user-role': srcReq.headers['x-user-role']
    });
    
    return proxyReqOpts;
  },
  
  userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
    console.log('NOTIFICATION-PROXY Response:', proxyRes.statusCode);
    return proxyResData;
  },
  
  proxyErrorHandler: (err, res, next) => {
    console.error('NOTIFICATION-PROXY Error:', err);
    res.status(500).json({
      success: false,
      error: 'Notification service unavailable',
      message: 'Failed to process notification request',
      timeStamp: new Date().toISOString()
    });
  }
});