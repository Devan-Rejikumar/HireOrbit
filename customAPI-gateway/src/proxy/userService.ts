import { createProxyMiddleware } from 'http-proxy-middleware';

const userServiceProxy = createProxyMiddleware({
    target: 'http://localhost:3000',
    changeOrigin: true,
    onError:(err,req,res)=>{
        console.log('❌ [USER PROXY] Proxy Error:', err.message);
        res.status(500).json({success:false, error:'User service unavailable',message:'The user service is currently unavailable', timeStamp: new Date().toISOString()})
    }
});

console.log('🔧 [USER PROXY] Proxy middleware created');
console.log('🔧 [USER PROXY] Proxy type:', typeof userServiceProxy);

export { userServiceProxy };