import { api } from './api';

export interface RevenueStatistics {
  todayRevenue: number;
  todayGrowth: number;
  monthRevenue: number;
  monthGrowth: number;
  outstandingPayments: number;
  pendingPayments: number;
  lastUpdated: string;
}

export const getRevenueStatistics = async (): Promise<RevenueStatistics> => {
  const response = await api.get<RevenueStatistics>('/api/revenue/statistics');
  return response.data;
}; 