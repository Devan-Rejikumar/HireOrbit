import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

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

  useEffect(() => {
   
    if (redirectIfAuthenticated && isAuthenticated && role) {
      switch (role) {
      case 'jobseeker':
        navigate('/', { replace: true });
        break;
      case 'company':
        navigate('/company/dashboard', { replace: true });
        break;
      case 'admin':
        navigate('/admin/dashboard', { replace: true });
        break;
      default:
        navigate('/', { replace: true });
      }
      return;
    }

    
    if (requireAuth && !isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }

   
    if (requireAuth && isAuthenticated && allowedRoles.length > 0 && role && !allowedRoles.includes(role)) {
   
      switch (role) {
      case 'jobseeker':
        navigate('/', { replace: true });
        break;
      case 'company':
        navigate('/company/dashboard', { replace: true });
        break;
      case 'admin':
        navigate('/admin/dashboard', { replace: true });
        break;
      }
    }
  }, [isAuthenticated, role, navigate, redirectIfAuthenticated, requireAuth, allowedRoles]);

  return <>{children}</>;
};

export default ProtectedRoute;
