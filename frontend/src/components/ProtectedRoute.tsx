import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '../constants/routes';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectIfAuthenticated?: boolean; // For login/register pages
  requireAuth?: boolean; // For dashboard pages
  allowedRoles?: ('jobseeker' | 'company' | 'admin')[];
}

const ProtectedRoute = ({ 
  children, 
  redirectIfAuthenticated = false, 
  requireAuth = false,
  allowedRoles = [],
}: ProtectedRouteProps) => {
  const { isAuthenticated, role, isInitializing } = useAuth();
  const navigate = useNavigate();
  const hasRedirected = useRef(false);

  // Helper function to check localStorage role (works even when cookies are HttpOnly)
  const getStoredRole = (): 'jobseeker' | 'company' | 'admin' | null => {
    const storedRole = localStorage.getItem('role');
    if (storedRole && ['jobseeker', 'company', 'admin'].includes(storedRole)) {
      return storedRole as 'jobseeker' | 'company' | 'admin';
    }
    return null;
  };

  // Helper function to check if user has valid token in cookies (for non-HttpOnly cookies)
  const checkCookieAuth = () => {
    const cookies = document.cookie.split(';');
    const accessTokenCookie = cookies.find(cookie => cookie.trim().startsWith('accessToken='));
    
    if (!accessTokenCookie) {
      // Cookie might be HttpOnly, check localStorage as indicator
      const storedRole = getStoredRole();
      if (storedRole) {
        // localStorage has role, user might be authenticated (wait for AuthContext)
        return { authenticated: true, role: storedRole, isFromStorage: true };
      }
      return { authenticated: false, role: null, isFromStorage: false };
    }
    
    // Extract role from token payload
    try {
      const token = accessTokenCookie.split('=')[1];
      const payload = JSON.parse(atob(token.split('.')[1]));
      const tokenRole = payload.role || localStorage.getItem('role') || 'jobseeker';
      
      // Validate role is one of the expected values
      if (['jobseeker', 'company', 'admin'].includes(tokenRole)) {
        return { authenticated: true, role: tokenRole as 'jobseeker' | 'company' | 'admin', isFromStorage: false };
      }
    } catch {
      // If token parsing fails, check localStorage as fallback
      const storedRole = getStoredRole();
      if (storedRole) {
        return { authenticated: true, role: storedRole, isFromStorage: true };
      }
    }
    
    return { authenticated: false, role: null, isFromStorage: false };
  };

  useEffect(() => {
    // Prevent multiple redirects
    if (hasRedirected.current) return;

    // For login pages (redirectIfAuthenticated), we can redirect immediately if we detect auth
    if (redirectIfAuthenticated) {
      const cookieAuth = checkCookieAuth();
      if (cookieAuth.authenticated && cookieAuth.role) {
        hasRedirected.current = true;
        switch (cookieAuth.role) {
        case 'admin':
          navigate(ROUTES.ADMIN_DASHBOARD, { replace: true });
          break;
        case 'company':
          navigate(ROUTES.COMPANY_DASHBOARD, { replace: true });
          break;
        case 'jobseeker':
          navigate(ROUTES.HOME, { replace: true });
          break;
        }
        return;
      }
      
      // Fallback to AuthContext check
      if (isAuthenticated && role) {
        hasRedirected.current = true;
        switch (role) {
        case 'jobseeker':
          navigate(ROUTES.HOME, { replace: true });
          break;
        case 'company':
          navigate(ROUTES.COMPANY_DASHBOARD, { replace: true });
          break;
        case 'admin':
          navigate(ROUTES.ADMIN_DASHBOARD, { replace: true });
          break;
        default:
          navigate(ROUTES.HOME, { replace: true });
        }
        return;
      }
    }

    // For protected routes, WAIT for AuthContext to finish initializing
    if (requireAuth) {
      // If AuthContext is still initializing, don't make any redirect decisions yet
      if (isInitializing) {
        // Check if localStorage has role - if so, user might be authenticated, just wait
        const storedRole = getStoredRole();
        if (storedRole) {
          // localStorage indicates user was logged in, wait for AuthContext to confirm
          return;
        }
        // No localStorage role, but still wait for AuthContext to be sure
        return;
      }
      
      // AuthContext finished initializing - now we can make decisions
      
      // Check if user is authenticated
      if (!isAuthenticated) {
        // Double-check localStorage as a safeguard
        const storedRole = getStoredRole();
        if (!storedRole) {
          // Definitely not authenticated, redirect to login
          hasRedirected.current = true;
          navigate(ROUTES.LOGIN, { replace: true });
          return;
        }
        // localStorage has role but AuthContext says not authenticated
        // This means token refresh failed, redirect to login
        hasRedirected.current = true;
        localStorage.removeItem('role'); // Clean up stale role
        navigate(ROUTES.LOGIN, { replace: true });
        return;
      }
      
      // User is authenticated, check role restrictions
      if (allowedRoles.length > 0 && role && !allowedRoles.includes(role)) {
        hasRedirected.current = true;
        switch (role) {
        case 'jobseeker':
          navigate(ROUTES.HOME, { replace: true });
          break;
        case 'company':
          navigate(ROUTES.COMPANY_DASHBOARD, { replace: true });
          break;
        case 'admin':
          navigate(ROUTES.ADMIN_DASHBOARD, { replace: true });
          break;
        }
        return;
      }
    }
  }, [isAuthenticated, role, isInitializing, redirectIfAuthenticated, requireAuth, allowedRoles, navigate]);

  // Show loading while AuthContext is initializing for protected routes
  if (requireAuth && isInitializing) {
    const storedRole = getStoredRole();
    // If localStorage has a role, show loading (user might be authenticated)
    if (storedRole) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
