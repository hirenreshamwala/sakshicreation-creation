import { AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import Request from "./axios";

export interface Kantan {
  _id: string;
  kantanName: string;
  deckal: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  count?: number;
}

export const kantanService = {
  async createKantan(
    kantanData: Omit<Kantan, "_id" | "createdAt" | "updatedAt">
  ): Promise<ApiResponse<Kantan>> {
    try {

      const response: AxiosResponse<ApiResponse<Kantan>> = await Request.post(
        Endpoint.CREATE_KANTAN,
        kantanData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to create kantan");
    }
  },

  async getAllKantans(): Promise<ApiResponse<Kantan[]>> {
    try {
      const response: AxiosResponse<ApiResponse<Kantan[]>> = await Request.get(
        Endpoint.GET_ALL_KANTANS);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch kantans");
    }
  },

  async updateKantan(
    id: string,
    updateData: Partial<Kantan>
  ): Promise<ApiResponse<Kantan>> {
    try {
      const response: AxiosResponse<ApiResponse<Kantan>> = await Request.patch(
        `${Endpoint.UPDATE_KANTAN}/${id}`,
        updateData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to update kantan");
    }
  },

  async deleteKantan(id: string): Promise<ApiResponse<void>> {
    try {
      const response: AxiosResponse<ApiResponse<void>> = await Request.delete(
        `${Endpoint.DELETE_KANTAN}/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to delete kantan");
    }
  },
};