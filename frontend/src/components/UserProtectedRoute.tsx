import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const UserProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, role, isInitializing } = useAuth();

  // Show loading while AuthContext is initializing
  if (isInitializing) {
    // Check localStorage to see if user might be authenticated
    const storedRole = localStorage.getItem('role');
    if (storedRole === 'jobseeker') {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }
  }

  if (!isAuthenticated || role !== 'jobseeker') {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export default UserProtectedRoute;