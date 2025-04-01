import { api } from './api';

export interface ParkingStatistics {
  capacity: number;
  occupied: number;
  availableSpaces: number;
  occupancyRate: number;
  lastUpdated: string;
}

export const getParkingStatistics = async (): Promise<ParkingStatistics> => {
  const response = await api.get<ParkingStatistics>('/api/parking/statistics');
  return response.data;
}; 