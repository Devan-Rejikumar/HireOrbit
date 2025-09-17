import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../api/axios';

interface User {
  name: string;
  email: string;
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
  setUser: () => {},
  setCompany: () => {},
  setRole: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [role, setRole] = useState<Role>(null);

  useEffect(() => {
    const storedRole = localStorage.getItem('role') as Role | null;
    if (storedRole) {
      setRole(storedRole);
    }
  }, []);

  useEffect(() => {
    const fetchAuth = async () => {
      try {
        if (role === 'admin') {
          const res = await api.get('/users/admin/me');
          setUser(res.data.admin as User);
          setCompany(null);
        } else if (role === 'jobseeker') {
          const res = await api.get('/users/me');
          setUser(res.data as User);
          setCompany(null);
        } else if (role === 'company') {
          const res = await api.get('/company/me');
          setCompany(res.data as Company);
          setUser(null);
        }
      } catch {
        setUser(null);
        setCompany(null);
        setRole(null);
        localStorage.removeItem('role');
      }
    };
    if (role) fetchAuth();
  }, [role]);

  const login = async (loginRole: Role) => {
    setRole(loginRole);
    localStorage.setItem('role', loginRole ?? '');
    if (loginRole === 'admin') {
      const res = await api.get('/users/admin/me');
      setUser(res.data.admin as User);
      setCompany(null);
    } else if (loginRole === 'jobseeker') {
      const res = await api.get('/users/me');
      setUser(res.data as User);
      setCompany(null);
    } else if (loginRole === 'company') {
      const res = await api.get('/company/me');
      setCompany(res.data as Company);
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
      console.error('Logout error:', error);
      setUser(null);
      setCompany(null);
      localStorage.removeItem('role');
      setRole(null);
    }
  };


  const isAuthenticated = !!user || !!company;

  return (
    <AuthContext.Provider value={{ user, company, role, login, logout, isAuthenticated, setUser, setCompany, setRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);


