import { api } from '../config/api';

export interface Vehicle {
  id: number;
  plateNumber: string;
  type: string;
  owner: string;
  contact: string;
  registrationDate: string;
  status: 'active' | 'blocked';
}

export const vehicleService = {
  getVehicles: async (): Promise<Vehicle[]> => {
    const response = await api.get('/vehicles');
    return response.data;
  },

  getVehicle: async (id: number): Promise<Vehicle> => {
    const response = await api.get(`/vehicles/${id}`);
    return response.data;
  },

  createVehicle: async (data: Omit<Vehicle, 'id'>): Promise<Vehicle> => {
    const response = await api.post('/vehicles', data);
    return response.data;
  },

  updateVehicle: async (data: Partial<Vehicle> & { id: number }): Promise<Vehicle> => {
    const response = await api.put(`/vehicles/${data.id}`, data);
    return response.data;
  },

  deleteVehicle: async (id: number): Promise<void> => {
    await api.delete(`/vehicles/${id}`);
  },
}; 