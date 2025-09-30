import { createProxyMiddleware } from "http-proxy-middleware";


export const applicationServiceProxy = createProxyMiddleware({
    target:'http://localhost:3004',
    changeOrigin: true,
    onProxyReq: (proxyReq, req, res) => {
        if (req.headers['x-user-id']) {
            proxyReq.setHeader('x-user-id', req.headers['x-user-id']);
        }
        if (req.headers['x-user-email']) {
            proxyReq.setHeader('x-user-email', req.headers['x-user-email']);
        }
        if (req.headers['x-user-role']) {
            proxyReq.setHeader('x-user-role', req.headers['x-user-role']);
        }
        console.log('🔀 [APPLICATION-PROXY] Forwarding headers:', {
            'x-user-id': req.headers['x-user-id'],
            'x-user-email': req.headers['x-user-email'],
            'x-user-role': req.headers['x-user-role']
        });
    },
    onError:(err,req,res)=>{
        console.log('Application Service Proxy Error',err);
        res.status(500).json({success:false, error:'Application service unavailable',message:'The application service is currently unavailable', timeStamp: new Date().toISOString()})      
    }
})