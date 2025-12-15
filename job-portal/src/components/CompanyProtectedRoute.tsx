import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const CompanyProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasCompanyToken, setHasCompanyToken] = useState<boolean | null>(null);

  useEffect(() => {
    // Check cookies directly for immediate authentication check
    const cookies = document.cookie.split(';');
    const hasToken = cookies.some(cookie => cookie.trim().startsWith('companyAccessToken='));
    setHasCompanyToken(hasToken);
    
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
  
  // Check auth: either from cookies (immediate) or from AuthContext (after load)
  const isAuthorized = hasCompanyToken || (isAuthenticated && role === 'company');
  
  if (!isAuthorized) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

export default CompanyProtectedRoute;