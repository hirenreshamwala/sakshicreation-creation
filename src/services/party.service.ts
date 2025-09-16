import { type AxiosResponse } from "axios"
import Endpoint from "@/API/apiConfig"
import Request from "./axios"

interface Party {
  _id: string
  partyName: string
  companyId: string
  unitNo: string; // Added
  marketName: string;
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
}
