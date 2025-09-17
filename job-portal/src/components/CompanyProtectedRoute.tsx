import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const CompanyProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, role } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated || role !== 'company') {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export default CompanyProtectedRoute;