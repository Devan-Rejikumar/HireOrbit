import { createProxyMiddleware } from "http-proxy-middleware";

export const jobServiceProxy = createProxyMiddleware({
    target:'http://localhost:3002',
    changeOrigin: true,
    onError:(err,req,res)=>{
        console.log('Job Service Proxy Error',err);
        res.status(500).json({success:false, error:'Job service unavailable',message:'The job service is currently unavailable', timeStamp: new Date().toISOString()})
    }
})