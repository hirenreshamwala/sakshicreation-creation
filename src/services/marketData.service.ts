import { AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import Request from "./axios";

export interface Market {
  _id: string;
  name: string;
  area: string;
  // streetAddress: string;
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
      const response: AxiosResponse<ApiResponse<Market>> = await Request.post(
        Endpoint.CREATE_MARKET,
        marketData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to create market");
    }
  },

  async getAllMarkets(): Promise<ApiResponse<Market[]>> {
    try {
      const response: AxiosResponse<ApiResponse<Market[]>> = await Request.get(
        Endpoint.GET_ALL_MARKETS);
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
      const response: AxiosResponse<ApiResponse<Market>> = await Request.patch(
        `${Endpoint.UPDATE_MARKET}/${id}`,
        updateData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to update market");
    }
  },

  async deleteMarket(id: string): Promise<ApiResponse<void>> {
    try {
      const response: AxiosResponse<ApiResponse<void>> = await Request.delete(
        `${Endpoint.DELETE_MARKET}/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to delete market");
    }
  },
};
