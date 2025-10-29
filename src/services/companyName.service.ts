import { AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import Request from "./axios";

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
      const response: AxiosResponse<ApiResponse<CompanyName>> = await Request.post(
        Endpoint.CREATE_COMPANY_NAME,
        data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to create company name");
    }
  },

  async getAllCompanyNames(): Promise<ApiResponse<CompanyName[]>> {
    try {
      const response: AxiosResponse<ApiResponse<CompanyName[]>> = await Request.get(
        Endpoint.GET_ALL_COMPANY_NAME);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch company names");
    }
  },

  async getCompanyNameById(id: string): Promise<ApiResponse<CompanyName>> {
    try {
      const response: AxiosResponse<ApiResponse<CompanyName>> = await Request.get(
        `${Endpoint.GET_COMPANY_NAME_BY_ID}/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch company name");
    }
  },

  async updateCompanyName(id: string, data: Partial<CreateCompanyNameData>): Promise<ApiResponse<CompanyName>> {
    try {
      const response: AxiosResponse<ApiResponse<CompanyName>> = await Request.patch(
        `${Endpoint.UPDATE_COMPANY_NAME}/${id}`,data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to update company name");
    }
  },

  async deleteCompanyName(id: string): Promise<ApiResponse<void>> {
    try {
      const response: AxiosResponse<ApiResponse<void>> = await Request.delete(
        `${Endpoint.DELETE_COMPANY_NAME}/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to delete company name");
    }
  },
};