import { AxiosResponse } from 'axios';
import Endpoint from '@/API/apiConfig';
import Request from './axios';

export interface Deckal {
  _id: string;
  companyName: string | { _id: string; companyName: string };
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeckal {
  companyName: string;
  name: string;
  description?: string;
}

export interface UpdateDeckal {
  companyName?: string;
  name?: string;
  description?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export const deckalService = {
  async getDeckals(): Promise<ApiResponse<Deckal[]>> {
    try {
      const response: AxiosResponse<ApiResponse<Deckal[]>> = await Request.get(
        Endpoint.GET_ALL_DECKAL
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch plies'
      );
    }
  },

  async getDeckalById(id: string): Promise<ApiResponse<Deckal>> {
    try {
      const response: AxiosResponse<ApiResponse<Deckal>> = await Request.get(
        `${Endpoint.GET_DECKAL_BY_ID}/${id}`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch deckal'
      );
    }
  },

  async createDeckal(data: CreateDeckal): Promise<Deckal> {
    try {
      const response: AxiosResponse<ApiResponse<Deckal>> = await Request.post(
        Endpoint.CREATE_DECKAL,
        data
      );
      return response.data.data!;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to create deckal'
      );
    }
  },

  async updateDeckal(id: string, data: Partial<UpdateDeckal>): Promise<Deckal> {
    try {
      const response: AxiosResponse<ApiResponse<Deckal>> = await Request.patch(
        `${Endpoint.UPDATE_DECKAL}/${id}`,
        data
      );
      return response.data.data!;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to update deckal'
      );
    }
  },

  async deleteDeckal(id: string): Promise<void> {
    try {
      await Request.delete(`${Endpoint.DELETE_DECKAL}/${id}`);
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to delete deckal'
      );
    }
  },
};