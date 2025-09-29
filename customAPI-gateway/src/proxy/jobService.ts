import proxy from 'express-http-proxy';

export const jobServiceProxy = proxy('http://localhost:3002', {
  proxyReqPathResolver: (req) => {
    console.log('🔀 [JOB PROXY] JSON request to:', req.originalUrl);
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
    
    return proxyReqOpts;
  },
  
  userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
    console.log('✅ [JOB PROXY] JSON response:', proxyRes.statusCode);
    return proxyResData;
  },
  
  proxyErrorHandler: (err, res, next) => {
    res.status(500).json({
      success: false,
      error: 'Job service unavailable',
      message: 'The job service is currently unavailable',
      timeStamp: new Date().toISOString()
    });
  }
});