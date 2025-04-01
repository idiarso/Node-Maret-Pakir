const isDevelopment = process.env.NODE_ENV === 'development';

export const debug = (message: string, data?: unknown): void => {
  if (isDevelopment) {
    console.debug(`[DEBUG] ${message}`, data);
  }
};

export const info = (message: string, data?: unknown): void => {
  console.info(`[INFO] ${message}`, data);
};

export const warn = (message: string, data?: unknown): void => {
  console.warn(`[WARN] ${message}`, data);
};

export const error = (message: string, error?: Error | unknown): void => {
  const errorData = error instanceof Error ? {
    name: error.name,
    message: error.message,
    stack: error.stack,
  } : error;
  console.error(`[ERROR] ${message}`, errorData);
};

export default {
  debug,
  info,
  warn,
  error,
}; 