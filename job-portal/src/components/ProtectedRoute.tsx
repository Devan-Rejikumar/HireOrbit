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

    // TEMPORARILY DISABLED for Google auth debugging - prevents automatic redirects
    // For login pages, check cookies directly for immediate redirect (before AuthContext loads)
    if (redirectIfAuthenticated) {
      console.log('[ProtectedRoute] redirectIfAuthenticated is true, but redirects are DISABLED for debugging');
      console.log('[ProtectedRoute] Current cookies:', document.cookie);
      console.log('[ProtectedRoute] isAuthenticated:', isAuthenticated, 'role:', role);
      // DISABLED: Allow errors to be visible during Google auth debugging
      // const cookies = document.cookie.split(';');
      // 
      // // Check for admin token
      // const hasAdminToken = cookies.some(cookie => cookie.trim().startsWith('adminAccessToken='));
      // if (hasAdminToken) {
      //   hasRedirected.current = true;
      //   navigate('/admin/dashboard', { replace: true });
      //   return;
      // }
      // 
      // // Check for company token
      // const hasCompanyToken = cookies.some(cookie => cookie.trim().startsWith('companyAccessToken='));
      // if (hasCompanyToken) {
      //   hasRedirected.current = true;
      //   navigate('/company/dashboard', { replace: true });
      //   return;
      // }
      // 
      // // Check for regular user token
      // const hasUserToken = cookies.some(cookie => cookie.trim().startsWith('accessToken='));
      // if (hasUserToken) {
      //   hasRedirected.current = true;
      //   navigate('/', { replace: true });
      //   return;
      // }
      
      // DISABLED: Fallback to AuthContext check
      // if (isAuthenticated && role) {
      //   hasRedirected.current = true;
      //   switch (role) {
      //   case 'jobseeker':
      //     navigate('/', { replace: true });
      //     break;
      //   case 'company':
      //     navigate('/company/dashboard', { replace: true });
      //     break;
      //   case 'admin':
      //     navigate('/admin/dashboard', { replace: true });
      //     break;
      //   default:
      //     navigate('/', { replace: true });
      //   }
      //   return;
      // }
    }

    
    if (requireAuth && !isAuthenticated) {
      hasRedirected.current = true;
      navigate(ROUTES.LOGIN, { replace: true });
      return;
    }

   
    if (requireAuth && isAuthenticated && allowedRoles.length > 0 && role && !allowedRoles.includes(role)) {
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
    }
  }, [isAuthenticated, role, redirectIfAuthenticated, requireAuth, allowedRoles]); // Removed navigate from deps

  return <>{children}</>;
};

export default ProtectedRoute;
