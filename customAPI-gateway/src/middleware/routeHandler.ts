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


const isPublicRoute = ( path: string ): boolean => {
    console.log('🔍 isPublicRoute - Checking path:', path);
    console.log('🔍 isPublicRoute - Available public routes:', ROUTES.public);
    
    // Clean the path: remove query parameters and trailing slashes
    const cleanPath = path.split('?')[0].replace(/\/+$/, '');
    console.log('🔍 isPublicRoute - Cleaned path:', cleanPath);
    
    const result = ROUTES.public.some(route => {
        console.log('  📍 Checking against route:', route);
        // Check exact match first
        if (cleanPath === route) {
            console.log('  ✅ Exact match found!');
            return true;
        }
        // Check if path starts with the route (for wildcard routes)
        if (route.includes("*")) {
            const baseRoute = route.replace("/*", "");
            const startsWith = cleanPath.startsWith(baseRoute);
            console.log('  🔄 Wildcard route:', baseRoute, 'starts with:', startsWith);
            return startsWith;
        }
        console.log('  ❌ No match');
        return false;
    });
    
    console.log('🔍 isPublicRoute - Final result:', result);
    return result;
};

export const routeHandler = (req: AuthRequest, res: Response, next: NextFunction): void =>{
    console.log('🔍 [ROUTE HANDLER] Starting route handler...');
    
    // Use originalUrl instead of path for route matching
    const path = req.originalUrl;
    console.log('🔍 ===== ROUTE HANDLER =====');
    console.log('🔍 Path:', req.path);
    console.log('🔍 Method:', req.method);
    console.log('🔍 URL:', req.url);
    console.log('🔍 Original URL:', req.originalUrl);
    console.log('🔍 Using for route matching:', path);
    
    console.log('🔍 [ROUTE HANDLER] About to check if route is public...');
    const isPublic = isPublicRoute(path);
    console.log('🔍 Is Public Route:', isPublic);
    
    if(isPublic){
        console.log('✅ PUBLIC ROUTE - Proceeding without authentication');
        console.log('🔍 [ROUTE HANDLER] About to call createProxy...');
        createProxy(req,res,next);
        console.log('🔍 [ROUTE HANDLER] createProxy call completed');
    }else{
        console.log('🔒 PROTECTED ROUTE - Requiring authentication');
        // For protected routes, authenticate first
        console.log('🔍 [ROUTE HANDLER] About to call Authenticate...');
        Authenticate(req, res, (err) => {
            if(err) {
                console.log('❌ Authentication failed:', err);
                return next(err);
            }
            console.log('✅ Authentication successful - proceeding to proxy');
            
            // Set user headers for the User Service
            if (req.user) {
                req.headers['x-user-id'] = req.user.userId;
                req.headers['x-user-email'] = req.user.email;
                req.headers['x-user-role'] = req.user.role;
                console.log('🔍 [ROUTE HANDLER] User headers set:', {
                    'x-user-id': req.user.userId,
                    'x-user-email': req.user.email,
                    'x-user-role': req.user.role
                });
            }
            
            console.log('🔍 [ROUTE HANDLER] About to call createProxy after auth...');
            createProxy(req,res,next);
            console.log('🔍 [ROUTE HANDLER] createProxy call completed after auth');
        });
    }
    console.log('🔍 [ROUTE HANDLER] Route handler function completed');
}