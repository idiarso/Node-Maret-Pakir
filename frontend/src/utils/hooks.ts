import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as storage from './storage';
import { ROUTES } from './constants';

// Hook for handling async operations
export const useAsync = <T>(asyncFn: () => Promise<T>, immediate = true) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFn();
      setData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
      return null;
    } finally {
      setLoading(false);
    }
  }, [asyncFn]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { data, loading, error, execute };
};

// Hook for handling form state
export const useForm = <T extends Record<string, any>>(initialValues: T) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  const handleChange = (name: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
  };

  return { values, errors, setErrors, handleChange, reset };
};

// Hook for handling authentication state
export const useAuth = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthenticated = storage.isAuthenticated();

  useEffect(() => {
    if (!isAuthenticated && location.pathname !== ROUTES.LOGIN) {
      navigate(ROUTES.LOGIN);
    }
  }, [isAuthenticated, location.pathname, navigate]);

  return { isAuthenticated };
};

export default {
  useAsync,
  useForm,
  useAuth,
}; 