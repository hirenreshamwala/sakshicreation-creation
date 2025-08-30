import axios, { AxiosResponse } from "axios";
import { authService } from "./auth.service";
import Endpoint from "@/API/apiConfig";

export interface CompanyName {
  _id: string;
  companyName: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCompanyNameData {
  companyName: string;
  avatar?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export const companyNameService = {
  async createCompanyName(data: CreateCompanyNameData): Promise<ApiResponse<CompanyName>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }
      const response: AxiosResponse<ApiResponse<CompanyName>> = await axios.post(
        Endpoint.CREATE_COMPANY_NAME,
        data,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to create company name");
    }
  },

  async getAllCompanyNames(): Promise<ApiResponse<CompanyName[]>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }
      const response: AxiosResponse<ApiResponse<CompanyName[]>> = await axios.get(
        Endpoint.GET_ALL_COMPANY_NAME,
        
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      console.log("responseresponseresponse",response)
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch company names");
    }
  },

  async getCompanyNameById(id: string): Promise<ApiResponse<CompanyName>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }
      const response: AxiosResponse<ApiResponse<CompanyName>> = await axios.get(
        `${Endpoint.GET_COMPANY_NAME_BY_ID}/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch company name");
    }
  },

  async updateCompanyName(id: string, data: Partial<CreateCompanyNameData>): Promise<ApiResponse<CompanyName>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }
      const response: AxiosResponse<ApiResponse<CompanyName>> = await axios.patch(
        `${Endpoint.UPDATE_COMPANY_NAME}/${id}`,
        data,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to update company name");
    }
  },

  async deleteCompanyName(id: string): Promise<ApiResponse<void>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }
      const response: AxiosResponse<ApiResponse<void>> = await axios.delete(
        `${Endpoint.DELETE_COMPANY_NAME}/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to delete company name");
    }
  },
};