import { AxiosResponse } from 'axios';
import Endpoint from '@/API/apiConfig';
import Request from './axios';

export interface PackagingOption {
  _id: string;
  ply: string;
  uom: string;
  length: string;
  width: string;
  height: string;
  deckal: string;
  paper1GSM: string;
  paper2GSM: string;
  paper3GSM: string;
  name: string;
  noOfPieces: string;
  ratePerPiece: string;
  party?: {
    _id: string;
    partyName: string;
  };
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
      const response: AxiosResponse<ApiResponse<PackagingOption>> = await Request.post(
        Endpoint.CREATE_PACKAGING_OPTION,
        packagingData);
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to create packaging option'
      );
    }
  },

  async getAllPackagingOptions(): Promise<PackagingOption[]> {
    try {
      const response: AxiosResponse<ApiResponse<PackagingOption[]>> = await Request.get(
        Endpoint.GET_ALL_PACKAGING_OPTION);
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch packaging options'
      );
    }
  },

  async updatePackagingOption(id: string, updateData: Partial<PackagingOption>): Promise<PackagingOption> {
    try {
      const response: AxiosResponse<ApiResponse<PackagingOption>> = await Request.patch(
        `${Endpoint.UPDATE_PACKAGING_OPTION}/${id}`,
        updateData);
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to update packaging option'
      );
    }
  },

  async deletePackagingOption(id: string): Promise<AxiosResponse<ApiResponse<void>>> {
    try {
      const response: AxiosResponse<ApiResponse<void>> = await Request.delete(
        `${Endpoint.DELETE_PACKAGING_OPTION}/${id}`);
      return response;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to delete packaging option'
      );
    }
  },
};