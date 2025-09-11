import axios, { AxiosResponse } from 'axios';
import Endpoint from '@/API/apiConfig';
import { authService } from './auth.service';

const BaseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8383";

export interface PackagingOption {
  _id: string;
  ply: string;
  length: string;
  width: string;
  height: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  count?: number;
}

export const packagingOptionService = {
  async createPackagingOption(packagingData: Omit<PackagingOption, '_id' | 'createdAt' | 'updatedAt'>): Promise<PackagingOption> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response: AxiosResponse<ApiResponse<PackagingOption>> = await axios.post(
        Endpoint.CREATE_PACKAGING_OPTION,
        packagingData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true,
        }
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to create packaging option'
      );
    }
  },

  async getAllPackagingOptions(): Promise<PackagingOption[]> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response: AxiosResponse<ApiResponse<PackagingOption[]>> = await axios.get(
        Endpoint.GET_ALL_PACKAGING_OPTION,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch packaging options'
      );
    }
  },

  async updatePackagingOption(id: string, updateData: Partial<PackagingOption>): Promise<PackagingOption> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response: AxiosResponse<ApiResponse<PackagingOption>> = await axios.patch(
        `${Endpoint.UPDATE_PACKAGING_OPTION}/${id}`,
        updateData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true,
        }
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to update packaging option'
      );
    }
  },

  async deletePackagingOption(id: string): Promise<AxiosResponse<ApiResponse<void>>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response: AxiosResponse<ApiResponse<void>> = await axios.delete(
        `${Endpoint.DELETE_PACKAGING_OPTION}/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return response;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to delete packaging option'
      );
    }
  },
};