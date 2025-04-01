import React, { createContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { api } from '../utils/api';
import { LoginCredentials } from '../hooks/useAuth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const response = await api.get<User>('/api/auth/me');
      setUser(response.data);
      setError(null);
    } catch (err) {
      console.error('Auth check failed:', err);
      setUser(null);
      setError('Session expired');
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post<{ token: string; user: User }>('/api/auth/login', {
        username,
        password,
      });

      const { token, user: userData } = response.data;
      localStorage.setItem('token', token);
      setUser(userData);
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    setError(null);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const contextValue = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}; 