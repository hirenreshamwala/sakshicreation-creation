import axios, { AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import { authService } from "./auth.service";

export interface Kantan {
  _id: string;
  kantanName: string;
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
      const token = authService.getToken();
      if (!token) throw new Error("No authentication token found");

      const response: AxiosResponse<ApiResponse<Kantan>> = await axios.post(
        Endpoint.CREATE_KANTAN,
        kantanData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to create kantan");
    }
  },

  async getAllKantans(): Promise<ApiResponse<Kantan[]>> {
    try {
      const token = authService.getToken();
      if (!token) throw new Error("No authentication token found");

      const response: AxiosResponse<ApiResponse<Kantan[]>> = await axios.get(
        Endpoint.GET_ALL_KANTANS,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
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
      const token = authService.getToken();
      if (!token) throw new Error("No authentication token found");

      const response: AxiosResponse<ApiResponse<Kantan>> = await axios.patch(
        `${Endpoint.UPDATE_KANTAN}/${id}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to update kantan");
    }
  },

  async deleteKantan(id: string): Promise<ApiResponse<void>> {
    try {
      const token = authService.getToken();
      if (!token) throw new Error("No authentication token found");

      const response: AxiosResponse<ApiResponse<void>> = await axios.delete(
        `${Endpoint.DELETE_KANTAN}/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to delete kantan");
    }
  },
};