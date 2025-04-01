import axios from 'axios';
import { API_BASE_URL } from '../config';

export interface ParkingArea {
  id: number;
  name: string;
  location: string;
  capacity: number;
  occupied: number;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export const parkingAreaService = {
  getAll: async (): Promise<ParkingArea[]> => {
    const response = await axios.get<ParkingArea[]>(`${API_BASE_URL}/api/parking-areas`);
    return response.data;
  },

  getById: async (id: number): Promise<ParkingArea> => {
    const response = await axios.get<ParkingArea>(`${API_BASE_URL}/api/parking-areas/${id}`);
    return response.data;
  },

  create: async (parkingArea: Partial<ParkingArea>): Promise<ParkingArea> => {
    const response = await axios.post<ParkingArea>(`${API_BASE_URL}/api/parking-areas`, parkingArea);
    return response.data;
  },

  update: async (id: number, parkingArea: Partial<ParkingArea>): Promise<ParkingArea> => {
    const response = await axios.put<ParkingArea>(`${API_BASE_URL}/api/parking-areas/${id}`, parkingArea);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/api/parking-areas/${id}`);
  }
}; 