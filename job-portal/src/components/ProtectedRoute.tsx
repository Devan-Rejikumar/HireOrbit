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
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Prevent multiple redirects
    if (hasRedirected.current) return;

    // Helper function to check if user has valid token in cookies
    const checkCookieAuth = () => {
      const cookies = document.cookie.split(';');
      const hasAdminToken = cookies.some(cookie => cookie.trim().startsWith('adminAccessToken='));
      const hasCompanyToken = cookies.some(cookie => cookie.trim().startsWith('companyAccessToken='));
      const hasUserToken = cookies.some(cookie => cookie.trim().startsWith('accessToken='));
      
      if (hasAdminToken) return { authenticated: true, role: 'admin' as const };
      if (hasCompanyToken) return { authenticated: true, role: 'company' as const };
      if (hasUserToken) return { authenticated: true, role: 'jobseeker' as const };
      return { authenticated: false, role: null };
    };

    // For login pages, check cookies directly for immediate redirect (before AuthContext loads)
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
      
      // Fallback to AuthContext check (in case cookies aren't available but user is authenticated)
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

    // For protected routes, check cookies first (before AuthContext loads on page refresh)
    if (requireAuth) {
      const cookieAuth = checkCookieAuth();
      
      // If cookies show user is authenticated, allow access (AuthContext will load in background)
      if (cookieAuth.authenticated) {
        // Check role restrictions if specified
        if (allowedRoles.length > 0 && cookieAuth.role && !allowedRoles.includes(cookieAuth.role)) {
          hasRedirected.current = true;
          switch (cookieAuth.role) {
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
        // User is authenticated via cookies and has correct role, allow access
        // Don't redirect - let AuthContext load in background
        return;
      }
      
      // No cookie auth found, check AuthContext
      // If AuthContext also shows not authenticated, redirect to login
      if (!isAuthenticated) {
        hasRedirected.current = true;
        navigate(ROUTES.LOGIN, { replace: true });
        return;
      }
      
      // AuthContext shows authenticated, check role restrictions
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
  }, [isAuthenticated, role, redirectIfAuthenticated, requireAuth, allowedRoles]); // Removed navigate from deps

  return <>{children}</>;
};

export default ProtectedRoute;
