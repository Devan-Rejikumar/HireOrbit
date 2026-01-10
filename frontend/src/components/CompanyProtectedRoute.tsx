import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const CompanyProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  useEffect(() => {
    // Reset when location changes (client-side navigation)
    setIsAuthChecked(false);

    const storedRole = localStorage.getItem('role');
    
    if (!storedRole) {
      setIsAuthChecked(true);
      return;
    }
    
    // If already authenticated, allow immediately
    if (isAuthenticated && role === 'company') {
      setIsAuthChecked(true);
      return;
    }
    
    // Wait for auth to load with timeout
    const timer = setTimeout(() => {
      setIsAuthChecked(true);
    }, 800);
    
    return () => clearTimeout(timer);
  }, [isAuthenticated, role, location.pathname]); // ADD location.pathname

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
  
  if (!isAuthenticated || role !== 'company') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  
  return <>{children}</>;
};

export default CompanyProtectedRoute;