import { api } from './api';

export interface ParkingActivity {
  id: string;
  type: 'entry' | 'exit' | 'payment';
  vehiclePlate: string;
  location: string;
  timestamp: string;
  amount?: number;
}

export const getRecentActivity = async (): Promise<ParkingActivity[]> => {
  const response = await api.get<ParkingActivity[]>('/api/parking/activity/recent');
  return response.data;
}; 