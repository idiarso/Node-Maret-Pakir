import { api } from '../config/api';

export interface SystemLog {
  id: number;
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  category: string;
  message: string;
  userId: number;
  userName?: string;
}

interface GetLogsParams {
  date?: Date;
  level?: string;
  category?: string;
}

export const systemLogService = {
  getLogs: async (params: GetLogsParams = {}): Promise<SystemLog[]> => {
    const response = await api.get('/system-logs', { params });
    return response.data;
  },

  createLog: async (data: Omit<SystemLog, 'id' | 'timestamp'>): Promise<SystemLog> => {
    const response = await api.post('/system-logs', data);
    return response.data;
  },

  clearLogs: async (): Promise<void> => {
    await api.delete('/system-logs');
  },
}; 