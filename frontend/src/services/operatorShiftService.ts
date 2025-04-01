import { api } from '../config/api';

export interface OperatorShift {
  id: number;
  operatorId: number;
  operatorName: string;
  startTime: string;
  endTime: string | null;
  status: 'active' | 'completed';
  cashAmount: number;
  transactionCount: number;
}

export const operatorShiftService = {
  getShifts: async (): Promise<OperatorShift[]> => {
    const response = await api.get('/operator-shifts');
    return response.data;
  },

  getCurrentShift: async (): Promise<OperatorShift | null> => {
    const response = await api.get('/operator-shifts/current');
    return response.data;
  },

  startShift: async (data: { operatorId: number }): Promise<OperatorShift> => {
    const response = await api.post('/operator-shifts/start', data);
    return response.data;
  },

  endShift: async (id: number): Promise<OperatorShift> => {
    const response = await api.post(`/operator-shifts/${id}/end`);
    return response.data;
  },

  updateShift: async (data: Partial<OperatorShift> & { id: number }): Promise<OperatorShift> => {
    const response = await api.put(`/operator-shifts/${data.id}`, data);
    return response.data;
  },
}; 