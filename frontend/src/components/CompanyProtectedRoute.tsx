import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const CompanyProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, role, isInitializing } = useAuth();
  const location = useLocation();

  // Show loading while AuthContext is initializing
  if (isInitializing) {
    // Check localStorage to see if user might be authenticated as company
    const storedRole = localStorage.getItem('role');
    if (storedRole === 'company') {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }
  }
  
  if (!isAuthenticated || role !== 'company') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  
  return <>{children}</>;
};

export default CompanyProtectedRoute;