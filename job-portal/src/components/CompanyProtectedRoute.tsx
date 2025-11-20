import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const CompanyProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, role } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set loading to false after initial mount
    const timer = setTimeout(() => {
      setLoading(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []); // Empty deps - only run once on mount

  // Show loading on initial mount
  if (loading) {
    return <div>Loading...</div>;
  }
  
  // Check auth and redirect if needed
  if (!isAuthenticated || role !== 'company') {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

export default CompanyProtectedRoute;