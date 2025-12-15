import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/constants/routes';

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();
  const isRootRoute = location.pathname === '/';
  // Public content pages that authenticated users should be able to access
  const publicContentPages = [ROUTES.ABOUT, ROUTES.HELP, ROUTES.JOBS, ROUTES.COMPANIES];
  const isPublicContentPage = publicContentPages.includes(location.pathname);
  
  if(isAuthenticated){
    if(role === 'company'){
      return <Navigate to="/company/dashboard" replace />;
    }else if(role === 'jobseeker'){
      // Allow jobseekers to access the root route and public content pages
      if(isRootRoute || isPublicContentPage){
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