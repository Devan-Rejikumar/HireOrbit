import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Checks if admin is logged in by checking for accessToken cookie and verifying role
 * Redirects to dashboard if admin is already logged in
 */
const AdminAuthProtected = ({ children }: { children: React.ReactNode }) => {
  // Check for unified accessToken cookie
  const cookies = document.cookie.split(';');
  const accessTokenCookie = cookies.find(cookie => 
    cookie.trim().startsWith('accessToken='),
  );
  
  if (accessTokenCookie) {
    // Verify the token is for an admin by checking the role in the payload
    try {
      const token = accessTokenCookie.split('=')[1];
      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = payload.role || localStorage.getItem('role');
      
      // If admin token exists, redirect to dashboard
      if (role === 'admin') {
        return <Navigate to="/admin/dashboard" replace />;
      }
    } catch (error) {
      // If token parsing fails, check localStorage as fallback
      const role = localStorage.getItem('role');
      if (role === 'admin') {
        return <Navigate to="/admin/dashboard" replace />;
      }
    }
  }
  
  // Show login page if no token or not admin
  return <>{children}</>;
};

export default AdminAuthProtected;

