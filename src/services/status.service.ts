import axios, { type AxiosResponse } from "axios"
import Endpoint from "@/API/apiConfig"
import { authService } from "./auth.service"

interface Status {
  _id: string
  name: string
  orderNumber: number
  isDefault: boolean
  isActive: boolean
  color: string
  description: string
  statusType: string
  createdBy: {
    _id: string
    name: string
  }
  createdAt: string
  updatedAt: string
}

interface CreateStatusData {
  name: string
  orderNumber: number
  isDefault?: boolean
  isActive?: boolean
  color?: string
  description?: string
  createdBy?: string
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  pagination?: {
    currentPage: number
    totalPages: number
    totalCount: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export const statusService = {
  // Create Status
  async createStatus(type: string, data: CreateStatusData): Promise<ApiResponse<Status>> {
    try {
      const token = authService.getToken()
      if (!token) {
        throw new Error("No authentication token found")
      }

      const response: AxiosResponse<ApiResponse<Status>> = await axios.post(
        `${Endpoint.STATUS_BASE}/${type}/create`,
        data,
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
        data: response.data.data,
        message: response.data.message,
      }
    } catch (error: any) {
      console.error(`Service: Create ${type} status error:`, error)
      throw new Error(error.response?.data?.message || `Failed to create ${type} status`)
    }
  },

  // Get All Statuses
  async getAllStatuses(
    type: string,
    params?: {
      page?: number
      limit?: number
      isActive?: boolean
      search?: string
    },
  ): Promise<ApiResponse<Status[]>> {
    try {
      const token = authService.getToken()
      if (!token) {
        throw new Error("No authentication token found")
      }


      const queryParams: any = {}
      if (params?.page) queryParams.page = params.page
      if (params?.limit) queryParams.limit = params.limit
      if (params?.isActive !== undefined) queryParams.isActive = params.isActive
      if (params?.search) queryParams.search = params.search

      const response: AxiosResponse<ApiResponse<Status[]>> = await axios.get(`${Endpoint.STATUS_BASE}/${type}/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        params: queryParams,
        withCredentials: true,
      })


      return {
        success: response.data.success,
        data: response.data.data || [],
        message: response.data.message,
        pagination: response.data.pagination,
      }
    } catch (error: any) {
      console.error(`Service: Get all ${type} statuses error:`, error)
      throw new Error(error.response?.data?.message || `Failed to fetch ${type} statuses`)
    }
  },

  // Get Status By ID
  async getStatusById(type: string, id: string): Promise<ApiResponse<Status>> {
    try {
      const token = authService.getToken()
      if (!token) {
        throw new Error("No authentication token found")
      }


      const response: AxiosResponse<ApiResponse<Status>> = await axios.get(`${Endpoint.STATUS_BASE}/${type}/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      })


      return {
        success: response.data.success,
        data: response.data.data,
        message: response.data.message,
      }
    } catch (error: any) {
      console.error(`Service: Get ${type} status by ID error:`, error)
      throw new Error(error.response?.data?.message || `Failed to fetch ${type} status`)
    }
  },

  // Update Status
  async updateStatus(type: string, id: string, data: Partial<CreateStatusData>): Promise<ApiResponse<Status>> {
    try {
      const token = authService.getToken()
      if (!token) {
        throw new Error("No authentication token found")
      }


      const response: AxiosResponse<ApiResponse<Status>> = await axios.put(
        `${Endpoint.STATUS_BASE}/${type}/update/${id}`,
        data,
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
        data: response.data.data,
        message: response.data.message,
      }
    } catch (error: any) {
      console.error(`Service: Update ${type} status error:`, error)
      throw new Error(error.response?.data?.message || `Failed to update ${type} status`)
    }
  },

  // Delete Status
  async deleteStatus(type: string, id: string): Promise<ApiResponse<null>> {
    try {
      const token = authService.getToken()
      if (!token) {
        throw new Error("No authentication token found")
      }


      const response: AxiosResponse<ApiResponse<null>> = await axios.delete(
        `${Endpoint.STATUS_BASE}/${type}/delete/${id}`,
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
        data: response.data.data,
        message: response.data.message,
      }
    } catch (error: any) {
      console.error(`Service: Delete ${type} status error:`, error)
      throw new Error(error.response?.data?.message || `Failed to delete ${type} status`)
    }
  },

  // Get Default Status
  async getDefaultStatus(type: string): Promise<ApiResponse<Status>> {
    try {
      const token = authService.getToken()
      if (!token) {
        throw new Error("No authentication token found")
      }


      const response: AxiosResponse<ApiResponse<Status>> = await axios.get(`${Endpoint.STATUS_BASE}/${type}/default`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      })


      return {
        success: response.data.success,
        data: response.data.data,
        message: response.data.message,
      }
    } catch (error: any) {
      console.error(`Service: Get default ${type} status error:`, error)
      throw new Error(error.response?.data?.message || `Failed to fetch default ${type} status`)
    }
  },

  // Reorder Statuses
  async reorderStatuses(type: string, statusIds: string[]): Promise<ApiResponse<Status[]>> {
    try {
      const token = authService.getToken()
      if (!token) {
        throw new Error("No authentication token found")
      }


      const response: AxiosResponse<ApiResponse<Status[]>> = await axios.put(
        `${Endpoint.STATUS_BASE}/${type}/reorder`,
        { statusIds },
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
      console.error(`Service: Reorder ${type} statuses error:`, error)
      throw new Error(error.response?.data?.message || `Failed to reorder ${type} statuses`)
    }
  },
}
