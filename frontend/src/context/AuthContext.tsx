import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../api/axios';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

interface UserMeResponse {
  user: User;
}

interface AdminMeResponse {
  admin: User;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  isVerified: boolean;
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
}

// interface Company {
//   companyName: string;
//   email: string;
// }

interface Company {
  id: string;          
  companyName: string;
  email: string;
  industry?: string;    
  size?: string;
  isVerified?: boolean;
  profileCompleted?: boolean;
}

export type Role = 'jobseeker' | 'company' | 'admin' | null;

interface AuthContextType {
  user: User | null;
  company: Company | null;
  role: Role;
  login: (role: Role) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isInitializing: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setCompany: React.Dispatch<React.SetStateAction<Company | null>>;
  setRole: React.Dispatch<React.SetStateAction<Role>>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  company: null,
  role: null,
  login: async () => {},
  logout: async () => {},
  isAuthenticated: false,
  isInitializing: true,
  setUser: () => {},
  setCompany: () => {},
  setRole: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Proactively refresh token if refreshToken exists in cookies
  const refreshTokenIfExists = async (userRole: Role): Promise<boolean> => {
    try {
      let refreshEndpoint = '/users/refresh-token';
      
      if (userRole === 'company') {
        refreshEndpoint = '/company/refresh-token';
      } else if (userRole === 'admin') {
        refreshEndpoint = '/users/admin/refresh-token';
      }
      
      console.log('[AuthContext] Attempting token refresh for role:', userRole);
      console.log('[AuthContext] Refresh endpoint:', refreshEndpoint);
      console.log('[AuthContext] Cookies available:', document.cookie);
      
      // Call refresh token endpoint - if refreshToken exists in cookies, it will return new accessToken
      const response = await api.post(refreshEndpoint, {}, { withCredentials: true });
      
      console.log('[AuthContext] Token refresh successful, status:', response.status);
      // If successful, new accessToken is set in cookies automatically
      return response.status === 200;
    } catch (error: unknown) {
      // Refresh token doesn't exist or is invalid
      const axiosError = error as { response?: { status?: number; data?: unknown }; message?: string };
      console.error('[AuthContext] Token refresh failed:', {
        status: axiosError?.response?.status,
        data: axiosError?.response?.data,
        message: axiosError?.message
      });
      return false;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      console.log('[AuthContext] Starting initializeAuth...');
      setIsInitializing(true);
      const storedRole = localStorage.getItem('role') as Role | null;
      console.log('[AuthContext] Stored role from localStorage:', storedRole);
      
      if (storedRole) {
        // Try to refresh token first if refreshToken exists in cookies
        const tokenRefreshed = await refreshTokenIfExists(storedRole);
        console.log('[AuthContext] Token refresh result:', tokenRefreshed);
        
        if (tokenRefreshed) {
          // Token refreshed successfully, set role and fetch user data
          console.log('[AuthContext] Setting role to:', storedRole);
          setRole(storedRole);
        } else {
          // No valid refresh token, clear everything
          console.log('[AuthContext] Clearing auth state due to failed refresh');
          setRole(null);
          setUser(null);
          setCompany(null);
          localStorage.removeItem('role');
        }
      } else {
        console.log('[AuthContext] No stored role found');
      }
      
      setIsInitializing(false);
      console.log('[AuthContext] initializeAuth completed');
    };
    
    initializeAuth();
  }, []);

  useEffect(() => {
    const fetchAuth = async () => {
      if (!role) return;
      
      try {
        if (role === 'admin') {
          const res = await api.get<ApiResponse<AdminMeResponse>>('/users/admin/me');
          setUser(res.data.data?.admin as User);
          setCompany(null);
        } else if (role === 'jobseeker') {
          const res = await api.get<ApiResponse<UserMeResponse>>('/users/me');
          setUser(res.data.data?.user as User);
          setCompany(null);
        } else if (role === 'company') {
          const res = await api.get<ApiResponse<Company>>('/company/me');
          setCompany(res.data.data as Company);
          setUser(null);
        }
      } catch (error: unknown) {
        const isAxiosError = error && typeof error === 'object' && 'response' in error;
        const axiosError = isAxiosError ? (error as { response?: { status?: number; data?: unknown } }) : null;
        
        // Only logout if it's a 401 (unauthorized) or 403 (forbidden) error
        if (axiosError?.response?.status === 401 || axiosError?.response?.status === 403) {
          setUser(null);
          setCompany(null);
          setRole(null);
          localStorage.removeItem('role');
        }
        // For network errors, keep the user logged in
      }
    };
    
    if (role && !isInitializing) {
      fetchAuth();
    }
  }, [role, isInitializing]);

  const login = async (loginRole: Role) => {
    setRole(loginRole);
    localStorage.setItem('role', loginRole ?? '');
    if (loginRole === 'admin') {
      const res = await api.get<ApiResponse<AdminMeResponse>>('/users/admin/me');
      setUser(res.data.data?.admin as User);
      setCompany(null);
    } else if (loginRole === 'jobseeker') {
      const res = await api.get<ApiResponse<UserMeResponse>>('/users/me');
      setUser(res.data.data?.user as User);
      setCompany(null);
    } else if (loginRole === 'company') {
      const res = await api.get<ApiResponse<Company>>('/company/me');
      setCompany(res.data.data as Company);
      setUser(null);
    }
  };

  const logout = async () => {
    try {
      if (role === 'admin') {
        await api.post('/users/admin/logout');
        setUser(null);
      } else if (role === 'jobseeker') {
        await api.post('/users/logout');
        setUser(null);
      } else if (role === 'company') {
        await api.post('/company/logout');
        setCompany(null);
      }
      localStorage.removeItem('role');
      setRole(null);
    } catch (error) {
      setUser(null);
      setCompany(null);
      localStorage.removeItem('role');
      setRole(null);
    }
  };


  const isAuthenticated = !!user || !!company;

  return (
    <AuthContext.Provider value={{ user, company, role, login, logout, isAuthenticated, isInitializing, setUser, setCompany, setRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);


