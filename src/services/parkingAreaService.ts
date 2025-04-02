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

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const parkingAreaService = {
  getAll: async (): Promise<ParkingArea[]> => {
    try {
      const response = await axios.get<ParkingArea[]>(`${API_BASE_URL}/api/parking-areas`, {
        headers: getAuthHeader()
      });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching parking areas:', error);
      return [];
    }
  },

  getById: async (id: number): Promise<ParkingArea | null> => {
    try {
      const response = await axios.get<ParkingArea>(`${API_BASE_URL}/api/parking-areas/${id}`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching parking area ${id}:`, error);
      return null;
    }
  },

  create: async (parkingArea: Partial<ParkingArea>): Promise<ParkingArea> => {
    try {
      const response = await axios.post<ParkingArea>(
        `${API_BASE_URL}/api/parking-areas`,
        parkingArea,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating parking area:', error);
      throw error;
    }
  },

  update: async (id: number, parkingArea: Partial<ParkingArea>): Promise<ParkingArea> => {
    try {
      const response = await axios.put<ParkingArea>(
        `${API_BASE_URL}/api/parking-areas/${id}`,
        parkingArea,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating parking area ${id}:`, error);
      throw error;
    }
  },

  delete: async (id: number): Promise<void> => {
    try {
      await axios.delete(`${API_BASE_URL}/api/parking-areas/${id}`, {
        headers: getAuthHeader()
      });
    } catch (error) {
      console.error(`Error deleting parking area ${id}:`, error);
      throw error;
    }
  }
}; 