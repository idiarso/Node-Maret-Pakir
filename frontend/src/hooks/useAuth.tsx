import { useContext } from 'react';
import { User } from '../types';
import { api } from '../utils/api';
import { AuthContext } from '../contexts/AuthContext';

// Definisi tipe untuk kredensial login
export interface LoginCredentials {
  username: string;
  password: string;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// Helper function untuk mengatur token di app
export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
  }
}; 