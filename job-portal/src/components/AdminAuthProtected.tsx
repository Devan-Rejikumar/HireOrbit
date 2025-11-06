import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Checks if admin is logged in by checking for adminAccessToken cookie
 * Redirects to dashboard if admin is already logged in
 */
const AdminAuthProtected = ({ children }: { children: React.ReactNode }) => {
  // Check for adminAccessToken cookie
  const cookies = document.cookie.split(';');
  const hasAdminToken = cookies.some(cookie => 
    cookie.trim().startsWith('adminAccessToken=')
  );
  
  // If admin token exists, redirect to dashboard
  if (hasAdminToken) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  
  // Show login page if no token
  return <>{children}</>;
};

export default AdminAuthProtected;

