import { Request, Response, NextFunction } from "express";
import { ROUTES } from "@/config/routes";
import { Authenticate } from "./auth";
import { createProxy } from "@/proxy/loadBalancer"; 

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

    // Check if route starts with /api/interviews (all interview routes are protected)
    if (clean.startsWith('/api/interviews')) {
        console.log(' Matched interview route:', clean);
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
    console.log('routerHandler reacheddd starting of iit................')
    const path = req.originalUrl;
    console.log('===== ROUTE HANDLER =====');
    console.log('Path:', req.path);
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Original URL:', req.originalUrl);
    console.log('Using for route matching:', path);

    if(isAuthenticationRoute(path)){
        console.log('AUTHENTICATION ROUTE - Forwarding to User Service');
        console.log('[ROUTE HANDLER] About to call createProxy for auth...');
        createProxy(req,res,next);
        console.log('[ROUTE HANDLER] createProxy call completed for auth');
        return
    }

    if(isProtectedRoute(path, req.method)){
        console.log('Protected Route - Requirinmg authorization');
        console.log('Route Handler About to call Authenticatee');
        Authenticate(req,res,(err)=>{
            if(err){
                console.log('[ROUTE HANDLER] Authentication error:', err);
                return next(err);
            }
            
            if(res.headersSent){
                console.log('[ROUTE HANDLER] Response already sent, authentication failed');
                return;
            }
            if(!req.user){
                console.log('[ROUTE HANDLER] No user found after authentication');
                return;
            }
            
            console.log('Authorization successsfukl- proceeding to proxy');

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
            
            console.log('[ROUTE HANDLER] About to call createProxy after auth...');
            createProxy(req,res,next);
            console.log('[ROUTE HANDLER] createProxy call completed after auth');
        });
        return
    }

    if(isPublicRoute(path, req.method)){
        console.log('Public ROUTE - No authorisation required');
        console.log('Route handler About tot call createProxy');
        createProxy(req,res,next);
        console.log('[ROUTE HANDLER] createProxy call completed for public');
        return
    }
    console.log('DEFAULT ROUTE - Treating as protected');
    console.log('[ROUTE HANDLER] About to call Authenticate...');
    Authenticate(req, res, (err) => {
        if(err) {
            console.log('Authorization failed:', err);
            return next(err);
        }

        if(res.headersSent){
            console.log('[ROUTE HANDLER] Response already sent, authentication failed');
            return;
        }
        if(!req.user){
            console.log('[ROUTE HANDLER] No user found after authentication');
            return;
        }
        
        console.log('Authorization successful - proceeding to proxy');
        delete req.headers['x-user-id'];
        delete req.headers['x-user-email'];
        delete req.headers['x-user-role'];
        req.headers['x-user-id'] = req.user.userId;
        req.headers['x-user-email'] = req.user.email;
        req.headers['x-user-role'] = req.user.role;
        
        createProxy(req, res, next);
    });
    
    console.log('[ROUTE HANDLER] Route handler function completed');

}