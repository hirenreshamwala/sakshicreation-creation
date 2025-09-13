import axios, { AxiosResponse } from 'axios';
import Endpoint from '@/API/apiConfig';
import { authService } from './auth.service';

const BaseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8383";

export interface PaperGSM {
  _id: string;
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

export const paperGSMService = {
  async createPaperGSM(paperData: Omit<PaperGSM, '_id' | 'createdAt' | 'updatedAt'>): Promise<PaperGSM> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response: AxiosResponse<ApiResponse<PaperGSM>> = await axios.post(
        Endpoint.CREATE_PAPER_GSM,
        paperData,
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
        error.response?.data?.message || 'Failed to create Paper GSM'
      );
    }
  },

  async getAllPaperGSM(): Promise<PaperGSM[]> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response: AxiosResponse<ApiResponse<PaperGSM[]>> = await axios.get(
        Endpoint.GET_ALL_PAPER_GSM,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch Paper GSM'
      );
    }
  },

  async updatePaperGSM(id: string, updateData: Partial<PaperGSM>): Promise<PaperGSM> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response: AxiosResponse<ApiResponse<PaperGSM>> = await axios.patch(
        `${Endpoint.UPDATE_PAPER_GSM}/${id}`,
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
        error.response?.data?.message || 'Failed to update Paper GSM'
      );
    }
  },

  async deletePaperGSM(id: string): Promise<AxiosResponse<ApiResponse<void>>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response: AxiosResponse<ApiResponse<void>> = await axios.delete(
        `${Endpoint.DELETE_PAPER_GSM}/${id}`,
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