import { type AxiosResponse } from "axios"
import Endpoint from "@/API/apiConfig"
import Request from "./axios"

interface Party {
  _id: string
  partyName: string
  companyId?: string; // Optional since not returned by getQualityPackingParties
  unitNo?: string; // Optional since not returned
  marketName?: string;
  // Add other party fields as needed
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
}

export const partyService = {
  async getPartiesByCompany(companyId: string): Promise<ApiResponse<Party[]>> {
    try {
      const response: AxiosResponse<ApiResponse<Party[]>> = await Request.get(
        `${Endpoint.GET_PARTIES_BY_COMPANY}/${companyId}`)

      return {
        success: response.data.success,
        data: response.data.data || [],
        message: response.data.message,
      }
    } catch (error: any) {
      console.error("Party service error:", error)
      throw new Error(error.response?.data?.message || "Failed to fetch parties")
    }
  },
  async getQualityPackingParties(): Promise<ApiResponse<Party[]>> {
    try {
      const response: AxiosResponse<ApiResponse<Party[]>> = await Request.get(
        `${Endpoint.GET_QP_PARTIES}` // Ensure this endpoint is defined in apiConfig
      );

      return {
        success: true,
        data: response.data.data || [],
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Quality Packaging parties service error:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch Quality Packaging parties");
    }
  },
  async getPartyById(id: string): Promise<ApiResponse<Party>> {
    try {
      const response: AxiosResponse<ApiResponse<Party>> = await Request.get(
        `${Endpoint.GET_PARTY_BY_Id}/${id}`
      );

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Party by ID service error:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch party by ID");
    }
  },
}
