import axios, { AxiosResponse } from 'axios';
import Endpoint from '@/API/apiConfig';
import { authService } from './auth.service';
import { Lead } from './types';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  count?: number;
}

export const leadService = {
  async getAllLeads(): Promise<ApiResponse<Lead[]>> {
  try {
    const token = authService.getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }
    const response: AxiosResponse<ApiResponse<Lead[]>> = await axios.get(
      Endpoint.GET_ALL_LEADS,
      {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      }
    );
    
    // Ensure response.data exists and has the correct structure
    if (!response.data) {
      throw new Error('No data received from server');
    }

    // Ensure data is always an array, even if empty
    const data = Array.isArray(response.data.data) ? response.data.data : [];

    return {
      success: response.data.success,
      data: data,
      message: response.data.message,
      count: response.data.count || data.length,
    };
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch leads');
  }
},

  async getLeadsByStaffId(id: string): Promise<ApiResponse<Lead[]>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response: AxiosResponse<ApiResponse<Lead[]>> = await axios.get(
        `${Endpoint.GET_LEAD_BY_STAFF_ID}/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return {
        success: response.data.success,
        data: response.data.data || [],
        message: response.data.message,
        count: response.data.count,
      };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch leads by staff ID');
    }
  },

  async createLead(data: Partial<Lead>): Promise<Lead> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response: AxiosResponse<Lead> = await axios.post(
        Endpoint.CREATE_LEAD,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          withCredentials: true,
        }
      );
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create lead');
    }
  },

  async bulkCreateLeads(leadsData: Partial<Lead>[]): Promise<ApiResponse<Lead[]>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response: AxiosResponse<ApiResponse<Lead[]>> = await axios.post(
        `${Endpoint.CREATE_LEAD}/bulk`,
        leadsData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          withCredentials: true,
        }
      );
      if (!response.data) {
        throw new Error('No data received from server');
      }
      const data = Array.isArray(response.data.data) ? response.data.data : [];
      return {
        success: response.data.success,
        data: data,
        message: response.data.message,
        count: response.data.count || data.length,
      };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create leads');
    }
  },

  async updateLead(id: string, data: Partial<Lead>): Promise<Lead> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response: AxiosResponse<Lead> = await axios.patch(
        `${Endpoint.UPDATE_LEAD}/${id}`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          withCredentials: true,
        }
      );
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update lead');
    }
  },

  async deleteLead(id: string): Promise<void> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      await axios.delete(`${Endpoint.DELETE_LEAD}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete lead');
    }
  },
};