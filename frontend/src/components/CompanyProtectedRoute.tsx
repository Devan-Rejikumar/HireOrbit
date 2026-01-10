import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const CompanyProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  useEffect(() => {
    // Reset auth check state when location changes (client-side navigation)
    setIsAuthChecked(false);

    // Check if we have a stored role (indicates user should be authenticated)
    const storedRole = localStorage.getItem('role');
    
    // If no stored role, user is definitely not logged in
    if (!storedRole) {
      setIsAuthChecked(true);
      return;
    }
    
    // If we have stored role AND isAuthenticated is already true, we're ready
    if (isAuthenticated && role === 'company') {
      setIsAuthChecked(true);
      return;
    }
    
    // If stored role exists but isAuthenticated is false, wait for AuthContext to load
    // Give it a reasonable timeout to load user/company data
    const timer = setTimeout(() => {
      setIsAuthChecked(true);
    }, 500); // Increased timeout to allow AuthContext to load
    
    return () => clearTimeout(timer);
  }, [isAuthenticated, role, location.pathname]); // ADD location.pathname to detect navigation

  // Show loading while checking auth
  if (!isAuthChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  // After auth check, redirect if not authenticated as company
  if (!isAuthenticated || role !== 'company') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  
  return <>{children}</>;
};

export default CompanyProtectedRoute;