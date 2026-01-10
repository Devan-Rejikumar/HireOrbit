import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/constants/routes';

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();
  const isRootRoute = location.pathname === '/';
  
  if(isAuthenticated){
    if(role === 'company'){
      return <Navigate to={ROUTES.COMPANY_DASHBOARD} replace />;
    }else if(role === 'jobseeker'){
      // Allow jobseekers to access the root route (landing page)
      if(isRootRoute){
        return <>{children}</>;
      }
      return <Navigate to="/" replace />;
    }else if(role === 'admin'){
      return <Navigate to="/admin/dashboard" replace />;
    }
  }
  return !isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
};

export default PublicRoute; 