import { Request, Response, NextFunction } from "express";
import { ROUTES } from "../config/routes";
import { Authenticate } from "./auth-middleware";
import { createProxy } from "../proxy/loadBalancer"; 

interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: string;
    };
}

const cleanPath = (path:string): string =>{
    return path.split('?')[0].replace(/\/+$/, '');
}

const isAuthenticationRoute = (path:string): boolean =>{
    const clean = cleanPath(path);
    const result = ROUTES.authentication.some(route =>{
        if(clean === route){
            return true;
        }
        return false;
    })
    return result;
}

const isProtectedRoute = (path: string, method: string): boolean =>{
    const clean = cleanPath(path);
    
    if (clean === '/api/jobs' && method === 'POST') {
        return true;
    }
    
    if (clean.match(/^\/api\/jobs\/[a-zA-Z0-9_-]+$/) && method === 'PUT') {
        return true;
    }
    
    if (clean.match(/^\/api\/jobs\/[a-zA-Z0-9_-]+$/) && method === 'DELETE') {
        return true;
    }
    
    const result = ROUTES.protected.some(route =>{
        if(clean === route){
            return true;
        }
        return false;
    })
    
    if (result) return true;

    if (clean.match(/^\/api\/jobs\/company\/[a-zA-Z0-9_-]+$/)) {
        console.log(' Matched company job route:', clean);
        return true;
    }

    if (clean.match(/^\/api\/applications\/[a-zA-Z0-9_-]+\/status$/)) {
        console.log(' Matched application status update route:', clean);
        return true;
    }

    if (clean.match(/^\/api\/applications\/[a-zA-Z0-9_-]+\/resume\/view$/)) {
        console.log(' Matched application resume view route:', clean);
        return true;
    }

    if (clean.match(/^\/api\/applications\/[a-zA-Z0-9_-]+\/resume\/download$/)) {
        console.log(' Matched application resume download route:', clean);
        return true;
    }

    if (clean.startsWith('/api/interviews')) {
        console.log(' Matched interview route:', clean);
        return true;
    }
    if (clean.startsWith('/api/admin/subscriptions')) {
        console.log(' Matched admin subscription route:', clean);
        return true;
    }

    if (clean.startsWith('/api/settings') && method !== 'GET') {
        console.log(' Matched settings update route:', clean);
        return true;
    }
    
    return false;
}

const isPublicRoute = (path: string, method: string): boolean =>{
    const clean = cleanPath(path);
    if (clean === '/api/jobs' && method === 'GET') {
        return true;
    }
    

    if (clean.match(/^\/api\/jobs\/[a-zA-Z0-9_-]+$/) && method === 'GET') {
        return true;
    }

    if (clean === '/api/settings' && method === 'GET') {
        return true;
    }
    
    const result = ROUTES.public.some(route =>{
        if(clean === route){
            return true;
        }
        if(route === '/api/jobs' && clean.startsWith('/api/jobs/') && clean !== '/api/jobs'){
            if (method === 'GET') {
                return true;
            }
        }
        return false
    })
    return result
}

export const routeHandler = (req: AuthRequest, res: Response, next: NextFunction): void =>{
    const path = req.originalUrl;
    if(isAuthenticationRoute(path)){
        createProxy(req,res,next);
        return
    }

    if(isProtectedRoute(path, req.method)){
        Authenticate(req,res,(err)=>{
            if(err){
                return next(err);
            }
            
            if(res.headersSent){
                return;
            }
            if(!req.user){
                return;
            }
            

            delete req.headers['x-user-id'];
            delete req.headers['x-user-email'];
            delete req.headers['x-user-role'];
            req.headers['x-user-id'] = req.user.userId;
            req.headers['x-user-email'] = req.user.email;
            req.headers['x-user-role'] = req.user.role;
            console.log('Route handler USer headers set: ',{
                'x-user-id': req.user.userId,
                'x-user-email': req.user.email,
                'x-user-role': req.user.role
            });
            
           
            createProxy(req,res,next);
            
        });
        return
    }

    if(isPublicRoute(path, req.method)){
        createProxy(req,res,next);
        return
    }
    Authenticate(req, res, (err) => {
        if(err) {
            return next(err);
        }

        if(res.headersSent){
            return;
        }
        if(!req.user){
            return;
        }
        
        delete req.headers['x-user-id'];
        delete req.headers['x-user-email'];
        delete req.headers['x-user-role'];
        req.headers['x-user-id'] = req.user.userId;
        req.headers['x-user-email'] = req.user.email;
        req.headers['x-user-role'] = req.user.role;
        
        createProxy(req, res, next);
    });

}

