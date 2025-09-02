import axios, { type AxiosResponse } from "axios"
import Endpoint from "@/API/apiConfig"
import { authService } from "./auth.service"

interface Company {
  _id: string
  companyName: string
  name?: string
  partyList?: any[]
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
}

export const companyService = {
  async getAllCompanies(hasParties = false): Promise<ApiResponse<Company[]>> {
    try {
      const token = authService.getToken()
      if (!token) {
        throw new Error("No authentication token found")
      }


      const response: AxiosResponse<ApiResponse<Company[]>> = await axios.get(Endpoint.GET_ALL_COMPANY, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        params: hasParties ? { hasParties: true } : {},
        withCredentials: true,
      })


      return {
        success: response.data.success,
        data: response.data.data || [],
        message: response.data.message,
      }
    } catch (error: any) {
      console.error("Company service error:", error)
      throw new Error(error.response?.data?.message || "Failed to fetch companies")
    }
  },
}
