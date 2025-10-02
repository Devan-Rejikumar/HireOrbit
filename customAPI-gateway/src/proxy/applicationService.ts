import proxy from 'express-http-proxy';
export const applicationServiceProxy = proxy('http://localhost:3004', {
  proxyReqPathResolver: (req) => {
    console.log('🔀 [APPLICATION-PROXY] JSON request to:', req.originalUrl);
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
    
    console.log('🔀 [APPLICATION-PROXY] Forwarding headers:', {
      'x-user-id': srcReq.headers['x-user-id'],
      'x-user-email': srcReq.headers['x-user-email'],
      'x-user-role': srcReq.headers['x-user-role']
    });
    
    return proxyReqOpts;
  },
  
  userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
    console.log('APPLICATION-PROXY JSON response:', proxyRes.statusCode);
    return proxyResData;
  }
});

export const applicationServiceMultipartProxy = proxy('http://localhost:3004', {
  proxyReqPathResolver: (req) => {
    console.log('APPLICATION-MULTIPART-PROXY File upload request to:', req.originalUrl);
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
    
    console.log('APPLICATION-MULTIPART-PROXY Forwarding headers:', {
      'x-user-id': srcReq.headers['x-user-id'],
      'x-user-role': srcReq.headers['x-user-role']
    });
    
    return proxyReqOpts;
  },
  
  userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
    console.log('APPLICATION-MULTIPART-PROXY Upload response:', proxyRes.statusCode);
    return proxyResData;
  },
  
  proxyErrorHandler: (err, res, next) => {
    console.error('APPLICATION-MULTIPART-PROXY Proxy error:', err);
    res.status(500).json({
      success: false,
      error: 'Application service unavailable',
      message: 'File upload failed',
      timeStamp: new Date().toISOString()
    });
  }
});