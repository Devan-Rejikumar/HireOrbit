import { createProxyMiddleware } from "http-proxy-middleware";


export const applicationServiceProxy = createProxyMiddleware({
    target:'http://localhost:3003',
    changeOrigin: true,
    onError:(err,req,res)=>{
        console.log('Application Service Proxy Error',err);
        res.status(500).json({success:false, error:'Application service unavailable',message:'The application service is currently unavailable', timeStamp: new Date().toISOString()})      
    }
})