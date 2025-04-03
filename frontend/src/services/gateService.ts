import { Gate } from '../types';
import { getApiUrl } from './api';

// Interfaces
export interface GateFormData {
  name: string;
  gate_number: string;
  location: string;
  type: 'ENTRY' | 'EXIT';
  description: string;
  status?: string;
}

/**
 * Standalone Gate Service implementing API calls with fetch
 * This service is separate from the main api.ts to provide more reliable
 * gate management functionality.
 */
const gateService = {
  /**
   * Get all gates
   * @returns Promise<Gate[]> Array of gates
   */
  getAll: async (): Promise<Gate[]> => {
    try {
      console.log('GateService: Memulai fetch gates...');
      const url = getApiUrl('gates');
      console.log('GateService: URL API Gates:', url);
      
      // Tambahkan log untuk memeriksa koneksi ke server
      console.log('GateService: Memeriksa koneksi ke server...');
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('GateService: Respons status dari server:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('GateService: Error respons dari server:', errorText);
        throw new Error(`Failed to fetch gates: ${errorText || response.statusText}`);
      }
      
      const rawText = await response.text();
      console.log('GateService: Respons raw text:', rawText);
      
      let data;
      try {
        // Parse JSON hanya jika ada konten
        data = rawText ? JSON.parse(rawText) : [];
        console.log('GateService: Data gates berhasil di-parse:', data);
      } catch (parseError) {
        console.error('GateService: Gagal parse respons JSON:', parseError);
        console.log('GateService: Raw text yang gagal di-parse:', rawText);
        return [];
      }
      
      // Ensure we return an array even if server response is invalid
      if (!Array.isArray(data)) {
        console.warn('GateService: Gates API mengembalikan data non-array:', data);
        return [];
      }
      
      console.log(`GateService: Berhasil fetch ${data.length} gates`);
      return data;
    } catch (error) {
      console.error('GateService: Error saat fetch gates:', error);
      // Return empty array instead of throwing to avoid crashing UI
      return [];
    }
  },

  /**
   * Get gate by ID
   * @param id Gate ID
   * @returns Promise<Gate> Gate object
   */
  getById: async (id: number): Promise<Gate> => {
    try {
      const url = getApiUrl(`gates/${id}`);
      console.log(`GateService: Fetching gate ${id} from ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`GateService: Error fetching gate ${id}:`, errorText);
        throw new Error(`Failed to fetch gate: ${errorText || response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`GateService: Error fetching gate ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new gate
   * @param data Gate data
   * @returns Promise<Gate> Created gate
   */
  create: async (data: GateFormData): Promise<Gate> => {
    try {
      const url = getApiUrl('gates');
      console.log('GateService: Creating gate at', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('GateService: Error creating gate:', errorText);
        throw new Error(`Failed to create gate: ${errorText || response.statusText}`);
      }
      
      const createdGate = await response.json();
      return createdGate;
    } catch (error) {
      console.error('GateService: Error creating gate:', error);
      throw error;
    }
  },

  /**
   * Update a gate
   * @param id Gate ID
   * @param data Gate data
   * @returns Promise<Gate> Updated gate
   */
  update: async (id: number, data: GateFormData): Promise<Gate> => {
    try {
      const url = getApiUrl(`gates/${id}`);
      console.log(`GateService: Updating gate ${id} at ${url}`);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`GateService: Error updating gate ${id}:`, errorText);
        throw new Error(`Failed to update gate: ${errorText || response.statusText}`);
      }
      
      const updatedGate = await response.json();
      return updatedGate;
    } catch (error) {
      console.error(`GateService: Error updating gate ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a gate
   * @param id Gate ID
   * @returns Promise<void>
   */
  delete: async (id: number): Promise<void> => {
    try {
      const url = getApiUrl(`gates/${id}`);
      console.log(`GateService: Deleting gate ${id} at ${url}`);
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`GateService: Error deleting gate ${id}:`, errorText);
        throw new Error(`Failed to delete gate: ${errorText || response.statusText}`);
      }
    } catch (error) {
      console.error(`GateService: Error deleting gate ${id}:`, error);
      throw error;
    }
  },

  /**
   * Change gate status
   * @param id Gate ID
   * @param status New status
   * @returns Promise<Gate> Updated gate
   */
  changeStatus: async (id: number, status: string): Promise<Gate> => {
    try {
      console.log(`GateService: Changing gate ${id} status to ${status}`);
      
      // Map open/close to database status if needed
      let dbStatus = status;
      if (status === 'OPEN') dbStatus = 'ACTIVE';
      if (status === 'CLOSE') dbStatus = 'INACTIVE';
      
      const url = getApiUrl(`gates/${id}/status`);
      console.log(`GateService: Sending PUT request to ${url}`);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: dbStatus }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('GateService: Error response from server:', errorText);
        throw new Error(`Failed to change gate status: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('GateService: Gate status changed successfully:', result);
      return result;
    } catch (error) {
      console.error(`GateService: Error changing gate ${id} status:`, error);
      throw error;
    }
  }
};

export default gateService; 