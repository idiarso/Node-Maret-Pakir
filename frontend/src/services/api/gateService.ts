import api from './api';
import { Gate, GateFormData } from '../../types/gate';

const gateService = {
  getAll: async () => {
    const response = await api.get('/gates');
    return response.data;
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/gates/${id}`);
    return response.data;
  },
  
  create: async (data: GateFormData) => {
    const response = await api.post('/gates', data);
    return response.data;
  },
  
  update: async (id: number, data: GateFormData) => {
    const response = await api.put(`/gates/${id}`, data);
    return response.data;
  },
  
  delete: async (id: number) => {
    const response = await api.delete(`/gates/${id}`);
    return response.data;
  },
  
  changeStatus: async (id: number, status: string) => {
    const response = await api.put(`/gates/${id}/status`, { status });
    return response.data;
  },
  
  // Add method to send commands to Arduino
  sendCommand: async (id: number, command: string) => {
    const response = await api.post(`/gates/${id}/command`, { command });
    return response.data;
  }
};

export default gateService; 