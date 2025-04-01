import { api } from '../config/api';

export const hardwareService = {
  getStatus: async () => {
    const response = await api.get('/hardware-status');
    return response.data;
  },

  getDeviceStatus: async (deviceId: number) => {
    const response = await api.get(`/hardware-status/${deviceId}`);
    return response.data;
  },

  updateStatus: async (deviceId: number, data: any) => {
    const response = await api.post(`/hardware-status/${deviceId}`, data);
    return response.data;
  },
}; 