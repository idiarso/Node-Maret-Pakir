import api from './api';

export const parkingSessionService = {
  getSession: async (code: string) => {
    const response = await api.get(`/parking-sessions/search?barcode=${code}`);
    return response.data;
  },
  
  update: async (id: number, data: any) => {
    const response = await api.patch(`/parking-sessions/${id}`, data);
    return response.data;
  },
  
  processExit: async (data: { session_id: number }) => {
    const response = await api.post('/parking-sessions/exit', data);
    return response.data;
  }
};

export default parkingSessionService; 