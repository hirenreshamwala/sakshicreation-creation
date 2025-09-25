import { AxiosResponse } from 'axios';
import Endpoint from '@/API/apiConfig';
import { Lead } from './types';
import Request from './axios';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  count?: number;
}

export const leadService = {
  async getAllLeads(filters): Promise<ApiResponse<Lead[]>> {
    try {

      const response: AxiosResponse<ApiResponse<Lead[]>> = await Request.post(
        Endpoint.GET_ALL_LEADS,filters);

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
      const response: AxiosResponse<ApiResponse<Lead[]>> = await Request.get(
        `${Endpoint.GET_LEAD_BY_STAFF_ID}/${id}`);
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
      const response: AxiosResponse<Lead> = await Request.post(
        Endpoint.CREATE_LEAD,
        data);
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create lead');
    }
  },

  async bulkCreateLeads(leadsData: Partial<Lead>[]): Promise<ApiResponse<Lead[]>> {
    try {
      const response: AxiosResponse<ApiResponse<Lead[]>> = await Request.post(
        `${Endpoint.CREATE_LEAD}/bulk`,
        leadsData);
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
      const response: AxiosResponse<Lead> = await Request.patch(
        `${Endpoint.UPDATE_LEAD}/${id}`,
        data);
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update lead');
    }
  },

  async deleteLead(id: string): Promise<void> {
    try {
      await Request.delete(`${Endpoint.DELETE_LEAD}/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete lead');
    }
  },
};