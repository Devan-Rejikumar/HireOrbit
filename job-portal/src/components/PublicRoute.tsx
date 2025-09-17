import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, role } = useAuth();
  if(isAuthenticated){
    if(role === 'company'){
      return <Navigate to="/company/dashboard" replace />;
    }else if(role === 'jobseeker'){
      return <Navigate to="/" replace />;
    }else if(role === 'admin'){
      return <Navigate to="/admin/dashboard" replace />;
    }
  }
  return !isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
};

export default PublicRoute; 