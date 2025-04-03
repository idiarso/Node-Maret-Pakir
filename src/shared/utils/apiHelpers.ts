/**
 * Utility functions for API communication
 */

import axios, { AxiosResponse, AxiosError } from 'axios';

/**
 * Log API requests for debugging purposes
 * @param method HTTP method
 * @param url API endpoint URL
 * @param data Request data
 */
export const logApiRequest = (method: string, url: string, data?: any): void => {
  console.log(`API Request: ${method} ${url}`);
  if (data) {
    console.log('Request data:', data);
  }
};

/**
 * Log API responses for debugging purposes
 * @param method HTTP method
 * @param url API endpoint URL
 * @param response Response data
 */
export const logApiResponse = (method: string, url: string, response: AxiosResponse): void => {
  console.log(`API Response: ${method} ${url} - Status: ${response.status}`);
  console.log('Response data:', response.data);
};

/**
 * Log API errors for debugging purposes
 * @param method HTTP method
 * @param url API endpoint URL
 * @param error Error object
 */
export const logApiError = (method: string, url: string, error: AxiosError): void => {
  console.error(`API Error: ${method} ${url}`);
  if (error.response) {
    console.error('Error status:', error.response.status);
    console.error('Error data:', error.response.data);
  } else if (error.request) {
    console.error('No response received:', error.request);
  } else {
    console.error('Error details:', error.message);
  }
};

/**
 * Make a wrapped API request with logging
 * @param method HTTP method
 * @param url API endpoint URL
 * @param data Request data
 * @returns Promise with API response
 */
export const makeApiRequest = async (method: string, url: string, data?: any): Promise<any> => {
  try {
    logApiRequest(method, url, data);
    
    let response;
    
    switch (method.toUpperCase()) {
      case 'GET':
        response = await axios.get(url);
        break;
      case 'POST':
        response = await axios.post(url, data);
        break;
      case 'PUT':
        response = await axios.put(url, data);
        break;
      case 'PATCH':
        response = await axios.patch(url, data);
        break;
      case 'DELETE':
        response = await axios.delete(url);
        break;
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
    
    logApiResponse(method, url, response);
    return response.data;
  } catch (error) {
    logApiError(method, url, error as AxiosError);
    throw error;
  }
}; 