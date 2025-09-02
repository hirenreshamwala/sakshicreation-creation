import axios, { type AxiosResponse } from "axios"
import Endpoint from "@/API/apiConfig"
import { authService } from "./auth.service"

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
      const token = authService.getToken()
      if (!token) {
        throw new Error("No authentication token found")
      }


      const response: AxiosResponse<ApiResponse<Party[]>> = await axios.get(
        `${Endpoint.GET_PARTIES_BY_COMPANY}/${companyId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        },
      )


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
