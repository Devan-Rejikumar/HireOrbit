
import { Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { AuthRequest } from '../types/auth';
import { HttpStatusCode } from '../enums/StatusCodes';

interface TokenPayload extends JwtPayload {
    userId?: string;
    companyId?: string;
    email: string;
    role: string;
    userType?: string;
    companyName?: string;
    tokenId?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh_secret';

const blacklistedTokens = new Set<string>();

const authenticateWithToken = (tokenCookie: string, expectedRole: string, req: AuthRequest, res: Response, next: NextFunction):void =>{
  console.log(`🔍 [AUTH-MIDDLEWARE] authenticateWithToken called for ${tokenCookie}`);
  console.log(`🔍 [AUTH-MIDDLEWARE] Expected role: ${expectedRole}`);
  
  const token = req.cookies[tokenCookie];
  console.log(`�� [AUTH-MIDDLEWARE] Token from cookie:`, token ? 'EXISTS' : 'MISSING');
  
  if(!token){
    console.log('❌ [AUTH-MIDDLEWARE] No token provided');
    res.status(HttpStatusCode.UNAUTHORIZED).json({ error:'No token provided' });
    return;
  }
  
  if(blacklistedTokens.has(token)){
    console.log('❌ [AUTH-MIDDLEWARE] Token is blacklisted');
    res.status(HttpStatusCode.UNAUTHORIZED).json({ error:'Token has been revoked' });
    return;
  }
  
  try {
    console.log('�� [AUTH-MIDDLEWARE] Attempting to verify token with JWT_SECRET');
    let decoded: TokenPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
      console.log('✅ [AUTH-MIDDLEWARE] Token verified with JWT_SECRET');
    } catch (accessError) {
      console.log('🔍 [AUTH-MIDDLEWARE] JWT_SECRET failed, trying REFRESH_TOKEN_SECRET');
      decoded = jwt.verify(token, REFRESH_TOKEN_SECRET) as TokenPayload;
      console.log('✅ [AUTH-MIDDLEWARE] Token verified with REFRESH_TOKEN_SECRET');
    }
    
    console.log('�� [AUTH-MIDDLEWARE] Decoded token:', decoded);
    console.log(`🔍 [AUTH-MIDDLEWARE] Token role: ${decoded.role}, Expected: ${expectedRole}`);
        
    if(decoded.role!==expectedRole){
      console.log(`❌ [AUTH-MIDDLEWARE] Role mismatch. Got: ${decoded.role}, Expected: ${expectedRole}`);
      res.status(HttpStatusCode.FORBIDDEN).json({ error:'Invalid role for this endpoint' });
      return;
    }
    
    console.log('✅ [AUTH-MIDDLEWARE] Authentication successful, setting user context');
    req.user = {
      id: decoded.userId || decoded.companyId || '',
      email: decoded.email,
      role: decoded.role,
      userType: decoded.userType || 'individual',
      companyName: decoded.companyName,
    };
    console.log('🔍 [AUTH-MIDDLEWARE] User context set:', req.user);
    next();
  } catch (error) {
    console.error('❌ [AUTH-MIDDLEWARE] Token verification failed:', error);
    res.status(HttpStatusCode.FORBIDDEN).json({ error: 'Invalid or expired token' });
    return;
  }
};

export const authenticateJobseeker = (req: AuthRequest, res: Response, next: NextFunction): void => {
  console.log('🔍 [AUTH-MIDDLEWARE] authenticateJobseeker called');
  console.log('🔍 [AUTH-MIDDLEWARE] Cookies in middleware:', req.cookies);
  console.log('�� [AUTH-MIDDLEWARE] accessToken exists:', !!req.cookies.accessToken);
  
  authenticateWithToken('accessToken','jobseeker',req,res,next);
};

export const authenticateCompany = (req: AuthRequest, res: Response, next: NextFunction): void =>{
  authenticateWithToken('companyAccessToken','company',req,res,next);
};

export const authenticateAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  authenticateWithToken('adminAccessToken', 'admin', req, res, next);
};

export const authenticateAnyUser = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const tokens = [
    { cookie: 'accessToken', role: 'jobseeker' },
    { cookie: 'companyAccessToken', role: 'company' },
    { cookie: 'adminAccessToken', role: 'admin' },
  ];

  for (const { cookie, role } of tokens) {
    const token = req.cookies[cookie];
    if (token && !blacklistedTokens.has(token)) {
      try {
        let decoded: TokenPayload;
        try {
          decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
        } catch (accessError) {
          decoded = jwt.verify(token, REFRESH_TOKEN_SECRET) as TokenPayload;
        }
        
        if (decoded.role === role) {
          req.user = {
            id: decoded.userId || decoded.companyId || '',
            email: decoded.email,
            role: decoded.role,
            userType: decoded.userType || 'individual',
            companyName: decoded.companyName,
          };
          next();
          return;
        }
      } catch (error) {
        continue; 
      }
    }
  }
  
  res.status(HttpStatusCode.UNAUTHORIZED).json({ error: 'No valid token provided' });
};

export const routeByTokenType = (req: AuthRequest, res: Response, next: NextFunction): void => {
  // Check for admin token first (highest priority)
  if (req.cookies.adminAccessToken) {
    const token = req.cookies.adminAccessToken;
    if (!blacklistedTokens.has(token)) {
      try {
        let decoded: TokenPayload;
        try {
          decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
        } catch (accessError) {
          decoded = jwt.verify(token, REFRESH_TOKEN_SECRET) as TokenPayload;
        }
        
        if (decoded.role === 'admin') {
          req.user = {
            id: decoded.userId || decoded.companyId || '',
            email: decoded.email,
            role: decoded.role,
            userType: decoded.userType || 'admin',
            companyName: decoded.companyName,
          };
          console.log(`🔍 [ROUTE-MIDDLEWARE] Routing as admin:`, req.user);
          next();
          return;
        }
      } catch (error) {
        // Token invalid, continue to next check
      }
    }
  }

  // Check for company token
  if (req.cookies.companyAccessToken) {
    const token = req.cookies.companyAccessToken;
    if (!blacklistedTokens.has(token)) {
      try {
        let decoded: TokenPayload;
        try {
          decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
        } catch (accessError) {
          decoded = jwt.verify(token, REFRESH_TOKEN_SECRET) as TokenPayload;
        }
        
        if (decoded.role === 'company') {
          req.user = {
            id: decoded.userId || decoded.companyId || '',
            email: decoded.email,
            role: decoded.role,
            userType: decoded.userType || 'company',
            companyName: decoded.companyName,
          };
          console.log(`🔍 [ROUTE-MIDDLEWARE] Routing as company:`, req.user);
          next();
          return;
        }
      } catch (error) {
        // Token invalid, continue to next check
      }
    }
  }

  // Check for user token
  if (req.cookies.accessToken) {
    const token = req.cookies.accessToken;
    if (!blacklistedTokens.has(token)) {
      try {
        let decoded: TokenPayload;
        try {
          decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
        } catch (accessError) {
          decoded = jwt.verify(token, REFRESH_TOKEN_SECRET) as TokenPayload;
        }
        
        if (decoded.role === 'jobseeker') {
          req.user = {
            id: decoded.userId || decoded.companyId || '',
            email: decoded.email,
            role: decoded.role,
            userType: decoded.userType || 'individual',
            companyName: decoded.companyName,
          };
          console.log(`🔍 [ROUTE-MIDDLEWARE] Routing as jobseeker:`, req.user);
          next();
          return;
        }
      } catch (error) {
        // Token invalid, continue
      }
    }
  }

  res.status(HttpStatusCode.UNAUTHORIZED).json({ error: 'No valid token found' });
};

export const blacklistToken = (token: string): void => {
  blacklistedTokens.add(token);
};