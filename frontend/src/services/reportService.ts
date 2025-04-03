import type { AxiosResponse } from 'axios';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export interface ChartData {
  name: string;
  value: number;
}

export interface ReportParams {
  startDate: string;
  endDate: string;
  reportType: string;
}

interface RevenueItem {
  date: string;
  amount: number;
}

interface OccupancyItem {
  time: string;
  percentage: number;
}

interface VehicleTypeItem {
  type: string;
  count: number;
}

interface PeakHourItem {
  hour: string;
  count: number;
}

const reportService = {
  async getRevenueReport(params: ReportParams): Promise<ChartData[]> {
    const response: AxiosResponse<RevenueItem[]> = await axios.get(`${API_BASE_URL}/reports/revenue`, { params });
    return response.data.map((item: RevenueItem) => ({
      name: item.date,
      value: item.amount
    }));
  },

  async getOccupancyReport(params: ReportParams): Promise<ChartData[]> {
    const response: AxiosResponse<OccupancyItem[]> = await axios.get(`${API_BASE_URL}/reports/occupancy`, { params });
    return response.data.map((item: OccupancyItem) => ({
      name: item.time,
      value: item.percentage
    }));
  },

  async getVehicleTypeReport(params: ReportParams): Promise<ChartData[]> {
    const response: AxiosResponse<VehicleTypeItem[]> = await axios.get(`${API_BASE_URL}/reports/vehicle-types`, { params });
    return response.data.map((item: VehicleTypeItem) => ({
      name: item.type,
      value: item.count
    }));
  },

  async getPeakHoursReport(params: ReportParams): Promise<ChartData[]> {
    const response: AxiosResponse<PeakHourItem[]> = await axios.get(`${API_BASE_URL}/reports/peak-hours`, { params });
    return response.data.map((item: PeakHourItem) => ({
      name: item.hour,
      value: item.count
    }));
  },

  async exportReport(params: ReportParams): Promise<Blob> {
    const response: AxiosResponse<Blob> = await axios.get(`${API_BASE_URL}/reports/export`, {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};

export default reportService; 