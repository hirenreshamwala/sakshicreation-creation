import { AxiosResponse } from 'axios';
import Endpoint from '@/API/apiConfig';
import Request from './axios';

export interface Gsm {
  _id: string;
  companyName: string | { _id: string; companyName: string };
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGsm {
  companyName: string;
  name: string;
  description?: string;
}

export interface UpdateGsm {
  companyName?: string;
  name?: string;
  description?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export const gsmService = {
  async getGsm(): Promise<ApiResponse<Gsm[]>> {
    try {
      const response: AxiosResponse<ApiResponse<Gsm[]>> = await Request.get(
        Endpoint.GET_ALL_GSM
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch gsm'
      );
    }
  },

  async getGsmById(id: string): Promise<ApiResponse<Gsm>> {
    try {
      const response: AxiosResponse<ApiResponse<Gsm>> = await Request.get(
        `${Endpoint.GET_GSM_BY_ID}/${id}`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch gsm'
      );
    }
  },

  async createGsm(data: CreateGsm): Promise<Gsm> {
    try {
      const response: AxiosResponse<ApiResponse<Gsm>> = await Request.post(
        Endpoint.CREATE_GSM,
        data
      );
      return response.data.data!;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to create gsm'
      );
    }
  },

  async updateGsm(id: string, data: Partial<UpdateGsm>): Promise<Gsm> {
    try {
      const response: AxiosResponse<ApiResponse<Gsm>> = await Request.patch(
        `${Endpoint.UPDATE_GSM}/${id}`,
        data
      );
      return response.data.data!;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to update gsm'
      );
    }
  },

  async deleteGsm(id: string): Promise<void> {
    try {
      await Request.delete(`${Endpoint.DELETE_GSM}/${id}`);
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to delete gsm'
      );
    }
  }
};