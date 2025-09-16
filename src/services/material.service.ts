import axios, { AxiosResponse } from 'axios';
import Endpoint from '@/API/apiConfig';
import { authService } from './auth.service';
import Request from './axios';

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
      const response: AxiosResponse<ApiResponse<Material[]>> = await Request.get(
        Endpoint.GET_ALL_MATERIALS);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch materials'
      );
    }
  },

  async getMaterialById(id: string): Promise<ApiResponse<Material>> {
    try {
      const response: AxiosResponse<ApiResponse<Material>> = await Request.get(
        `${Endpoint.GET_MATERIAL_BY_ID}/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch material'
      );
    }
  },

  async createMaterial(data: CreateMaterial): Promise<Material> {
    try {
      const response: AxiosResponse<ApiResponse<Material>> = await Request.post(
        Endpoint.CREATE_MATERIAL,
        data);
      return response.data.data!;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to create material'
      );
    }
  },

  async updateMaterial(id: string, data: Partial<UpdateMaterial>): Promise<Material> {
    try {
      const response: AxiosResponse<ApiResponse<Material>> = await Request.patch(
        `${Endpoint.UPDATE_MATERIAL}/${id}`,
        data);
      return response.data.data!;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to update material'
      );
    }
  },

  async deleteMaterial(id: string): Promise<void> {
    try {
      await Request.delete(`${Endpoint.DELETE_MATERIAL}/${id}`);
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to delete material'
      );
    }
  },

  async bulkCreateMaterials(formData: FormData): Promise<ApiResponse<Material[]>> {
    try {
      const response: AxiosResponse<ApiResponse<Material[]>> = await Request.post(
        Endpoint.BULK_CREATE_MATERIALS,
        formData);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to bulk create materials'
      );
    }
  },
};