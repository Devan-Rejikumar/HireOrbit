import proxy from 'express-http-proxy';
import { env } from '../config/env';

const CHAT_SERVICE_URL = process.env.CHAT_SERVICE_URL || 'http://localhost:4007';

export const chatServiceProxy = proxy(CHAT_SERVICE_URL, {
  proxyReqPathResolver: (req) => {
    console.log('🔀 [CHAT-PROXY] Request to:', req.originalUrl);
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
    
    console.log('🔀 [CHAT-PROXY] Forwarding headers:', {
      'x-user-id': srcReq.headers['x-user-id'],
      'x-user-email': srcReq.headers['x-user-email'],
      'x-user-role': srcReq.headers['x-user-role']
    });
    
    return proxyReqOpts;
  },
  
  userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
    console.log('🔀 [CHAT-PROXY] Response:', proxyRes.statusCode);
    return proxyResData;
  },
  
  proxyErrorHandler: (err, res, next) => {
    console.error('🔀 [CHAT-PROXY] Error:', err);
    res.status(500).json({
      success: false,
      error: 'Chat service unavailable',
      message: 'Failed to process chat request',
      timeStamp: new Date().toISOString()
    });
  }
});

