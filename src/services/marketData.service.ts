import axios, { AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import { authService } from "./auth.service";

export interface Market {
  _id: string;
  name: string;
  area: string;
  streetAddress: string;
  landmark?: string;
  pincode: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  count?: number;
}

export const marketService = {
  async createMarket(
    marketData: Omit<Market, "_id" | "createdAt" | "updatedAt">
  ): Promise<ApiResponse<Market>> {
    try {
      const token = authService.getToken();
      if (!token) throw new Error("No authentication token found");

      const response: AxiosResponse<ApiResponse<Market>> = await axios.post(
        Endpoint.CREATE_MARKET,
        marketData,
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
      throw new Error(error.response?.data?.message || "Failed to create market");
    }
  },

  async getAllMarkets(): Promise<ApiResponse<Market[]>> {
    try {
      const token = authService.getToken();
      if (!token) throw new Error("No authentication token found");

      const response: AxiosResponse<ApiResponse<Market[]>> = await axios.get(
        Endpoint.GET_ALL_MARKETS,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch markets");
    }
  },

  async updateMarket(
    id: string,
    updateData: Partial<Market>
  ): Promise<ApiResponse<Market>> {
    try {
      const token = authService.getToken();
      if (!token) throw new Error("No authentication token found");

      const response: AxiosResponse<ApiResponse<Market>> = await axios.patch(
        `${Endpoint.UPDATE_MARKET}/${id}`,
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
      throw new Error(error.response?.data?.message || "Failed to update market");
    }
  },

  async deleteMarket(id: string): Promise<ApiResponse<void>> {
    try {
      const token = authService.getToken();
      if (!token) throw new Error("No authentication token found");

      const response: AxiosResponse<ApiResponse<void>> = await axios.delete(
        `${Endpoint.DELETE_MARKET}/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to delete market");
    }
  },
};
