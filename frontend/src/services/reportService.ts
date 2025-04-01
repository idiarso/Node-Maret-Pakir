import axios from 'axios';
import { API_BASE_URL } from '../config';

export interface RevenueData {
  name: string;
  revenue: number;
}

export interface OccupancyData {
  name: string;
  occupancy: number;
}

export interface VehicleTypeData {
  name: string;
  value: number;
}

export interface PeakHoursData {
  hour: string;
  count: number;
}

export interface PaymentMethodData {
  method: string;
  count: number;
  total: number;
}

export interface ReportParams {
  startDate: string;
  endDate: string;
  reportType: string;
}

const reportService = {
  async getRevenueReport(params: ReportParams): Promise<RevenueData[]> {
    const response = await axios.get(`${API_BASE_URL}/reports/revenue`, { params });
    return response.data;
  },

  async getOccupancyReport(params: ReportParams): Promise<OccupancyData[]> {
    const response = await axios.get(`${API_BASE_URL}/reports/occupancy`, { params });
    return response.data;
  },

  async getVehicleTypeReport(params: ReportParams): Promise<VehicleTypeData[]> {
    const response = await axios.get(`${API_BASE_URL}/reports/vehicle-types`, { params });
    return response.data;
  },

  async getPeakHoursReport(params: ReportParams): Promise<PeakHoursData[]> {
    const response = await axios.get(`${API_BASE_URL}/reports/peak-hours`, { params });
    return response.data;
  },

  async getPaymentMethodReport(params: ReportParams): Promise<PaymentMethodData[]> {
    const response = await axios.get(`${API_BASE_URL}/reports/payment-methods`, { params });
    return response.data;
  },

  async exportReport(params: ReportParams): Promise<Blob> {
    const response = await axios.get(`${API_BASE_URL}/reports/export`, {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};

export default reportService; 