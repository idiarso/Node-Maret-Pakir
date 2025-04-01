import { api } from './api';

export interface VehicleDistribution {
  type: string;
  count: number;
  color: string;
}

export const getVehicleDistribution = async (): Promise<VehicleDistribution[]> => {
  const response = await api.get<VehicleDistribution[]>('/api/vehicles/distribution');
  return response.data;
}; 