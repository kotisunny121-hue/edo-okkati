import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/index.js';
import { api } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  quickLogin: (role: UserRole) => Promise<User>;
  register: (data: any) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  getDashboardPath: (role?: UserRole) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function getDashboardPath(role?: UserRole): string {
  switch (role) {
    case 'provider':
      return '/dashboard/provider';
    case 'seeker':
      return '/dashboard/seeker';
    case 'organization':
      return '/dashboard/organization';
    case 'volunteer':
      return '/dashboard/volunteer';
    case 'admin':
      return '/dashboard/admin';
    case 'super_admin':
      return '/dashboard/super-admin';
    default:
      return '/';
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get<{ success: boolean; user: User }>('/auth/me');
      if (res.success && res.user) {
        setUser(res.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.post<{ success: boolean; token: string; user: User }>('/auth/login', {
      email,
      password,
    });
    if (res.token) {
      localStorage.setItem('token', res.token);
    }
    setUser(res.user);
    return res.user;
  };

  const quickLogin = async (role: UserRole): Promise<User> => {
    const res = await api.post<{ success: boolean; token: string; user: User }>('/auth/quick-login', {
      role,
    });
    if (res.token) {
      localStorage.setItem('token', res.token);
    }
    setUser(res.user);
    return res.user;
  };

  const register = async (data: any): Promise<User> => {
    const res = await api.post<{ success: boolean; token: string; user: User }>('/auth/register', data);
    if (res.token) {
      localStorage.setItem('token', res.token);
    }
    setUser(res.user);
    return res.user;
  };

  const logout = async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  const refresh = async (): Promise<void> => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        quickLogin,
        register,
        logout,
        refresh,
        getDashboardPath,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
