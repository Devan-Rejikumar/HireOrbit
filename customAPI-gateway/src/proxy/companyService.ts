import { createProxyMiddleware } from "http-proxy-middleware";

export const companyServiceProxy = createProxyMiddleware({
    target:'http://localhost:3001',
    changeOrigin:true,
    onError:(err,req,res)=>{
        console.log('Company Service Proxy Error', err);
        res.status(500).json({success:false, error:'Company service unavailable',message:'The company service is currently unavailable', timeStamp: new Date().toISOString()})
    }
})