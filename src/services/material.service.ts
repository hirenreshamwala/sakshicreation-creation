import axios, { AxiosResponse } from 'axios';
import Endpoint from '@/API/apiConfig';
import { authService } from './auth.service';

export interface Material {
  _id: string;
  materialName: string;
  materialSize: string;
  materialGSM: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMaterial {
  materialName: string;
  materialSize: string;
  materialGSM: number;
}

export interface UpdateMaterial {
  materialName?: string;
  materialSize?: string;
  materialGSM?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export const materialService = {
  async getMaterials(): Promise<ApiResponse<Material[]>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response: AxiosResponse<ApiResponse<Material[]>> = await axios.get(
        Endpoint.GET_ALL_MATERIALS,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch materials'
      );
    }
  },

  async getMaterialById(id: string): Promise<ApiResponse<Material>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response: AxiosResponse<ApiResponse<Material>> = await axios.get(
        `${Endpoint.GET_MATERIAL_BY_ID}/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch material'
      );
    }
  },

  async createMaterial(data: CreateMaterial): Promise<Material> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response: AxiosResponse<ApiResponse<Material>> = await axios.post(
        Endpoint.CREATE_MATERIAL,
        data,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return response.data.data!;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to create material'
      );
    }
  },

  async updateMaterial(id: string, data: Partial<UpdateMaterial>): Promise<Material> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response: AxiosResponse<ApiResponse<Material>> = await axios.patch(
        `${Endpoint.UPDATE_MATERIAL}/${id}`,
        data,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return response.data.data!;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to update material'
      );
    }
  },

  async deleteMaterial(id: string): Promise<void> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      await axios.delete(`${Endpoint.DELETE_MATERIAL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to delete material'
      );
    }
  },

  async bulkCreateMaterials(formData: FormData): Promise<ApiResponse<Material[]>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response: AxiosResponse<ApiResponse<Material[]>> = await axios.post(
        Endpoint.BULK_CREATE_MATERIALS,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to bulk create materials'
      );
    }
  },
};