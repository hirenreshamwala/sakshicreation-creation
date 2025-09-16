import { AxiosResponse } from 'axios';
import Endpoint from '@/API/apiConfig';
import Request from './axios';

export interface PaperGSM {
  _id: string;
  deckal: string;
  gsm: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface GSMOption {
  id: string;
  value: string;
  label: string;
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
      const response: AxiosResponse<ApiResponse<PaperGSM>> = await Request.post(
        Endpoint.CREATE_PAPER_GSM,
        paperData);
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to create Paper GSM'
      );
    }
  },

  async getAllPaperGSM(): Promise<PaperGSM[]> {
    try {
      const response: AxiosResponse<ApiResponse<PaperGSM[]>> = await Request.get(
        Endpoint.GET_ALL_PAPER_GSM);
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch Paper GSM'
      );
    }
  },

  async updatePaperGSM(id: string, updateData: Partial<PaperGSM>): Promise<PaperGSM> {
    try {
      const response: AxiosResponse<ApiResponse<PaperGSM>> = await Request.patch(
        `${Endpoint.UPDATE_PAPER_GSM}/${id}`,
        updateData);
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to update Paper GSM'
      );
    }
  },

  async deletePaperGSM(id: string): Promise<AxiosResponse<ApiResponse<void>>> {
    try {
      const response: AxiosResponse<ApiResponse<void>> = await Request.delete(
        `${Endpoint.DELETE_PAPER_GSM}/${id}`);
      return response;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to delete packaging option'
      );
    }
  },
  async getGSMByDeckal(deckal: string): Promise<GSMOption[]> {
    try {
      const response: AxiosResponse<ApiResponse<GSMOption[]>> = await Request.get(
        `${Endpoint.GET_GSM_BY_DECKAL}?deckal=${deckal}`);

      return response || [];
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch GSM by Deckal"
      );
    }
  }
};