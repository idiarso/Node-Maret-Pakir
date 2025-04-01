type StorageKey = 'token' | 'user' | 'theme' | 'settings';

interface StorageItem<T> {
  value: T;
  expiry?: number;
}

const isExpired = (expiry?: number): boolean => {
  if (!expiry) return false;
  return new Date().getTime() > expiry;
};

export const setItem = <T>(key: StorageKey, value: T, expiryHours?: number): void => {
  const item: StorageItem<T> = {
    value,
    expiry: expiryHours ? new Date().getTime() + expiryHours * 60 * 60 * 1000 : undefined,
  };
  localStorage.setItem(key, JSON.stringify(item));
};

export const getItem = <T>(key: StorageKey): T | null => {
  const itemStr = localStorage.getItem(key);
  if (!itemStr) return null;

  try {
    const item: StorageItem<T> = JSON.parse(itemStr);
    if (isExpired(item.expiry)) {
      localStorage.removeItem(key);
      return null;
    }
    return item.value;
  } catch {
    return null;
  }
};

export const removeItem = (key: StorageKey): void => {
  localStorage.removeItem(key);
};

export const clear = (): void => {
  localStorage.clear();
};

export const isAuthenticated = (): boolean => {
  const token = getItem<string>('token');
  return !!token;
};

export const getToken = (): string | null => {
  return getItem<string>('token');
};

export const setToken = (token: string): void => {
  setItem('token', token, 24); // Token expires in 24 hours
};

export const removeToken = (): void => {
  removeItem('token');
};

export const getUser = <T>(): T | null => {
  return getItem<T>('user');
};

export const setUser = <T>(user: T): void => {
  setItem('user', user);
};

export const removeUser = (): void => {
  removeItem('user');
};

export const getTheme = (): 'light' | 'dark' => {
  return getItem<'light' | 'dark'>('theme') || 'light';
};

export const setTheme = (theme: 'light' | 'dark'): void => {
  setItem('theme', theme);
};

export const getSettings = <T>(): T | null => {
  return getItem<T>('settings');
};

export const setSettings = <T>(settings: T): void => {
  setItem('settings', settings);
};

export default {
  setItem,
  getItem,
  removeItem,
  clear,
  isAuthenticated,
  getToken,
  setToken,
  removeToken,
  getUser,
  setUser,
  removeUser,
  getTheme,
  setTheme,
  getSettings,
  setSettings,
}; 