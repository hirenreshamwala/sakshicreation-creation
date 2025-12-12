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

// services/companyName.service.ts (update getAllCompanyNames and add getCompanyNameFilters)
async getAllCompanyNames(filters: Partial<CompanyNameFilters>): Promise<ApiResponse<CompanyName[]>> {
  try {
    const params = new URLSearchParams();
    if (filters.page) params.append("page", String(filters.page));
    if (filters.limit) params.append("limit", String(filters.limit));
    if (filters.search) params.append("search", filters.search);
    if (filters.companyNames?.length) filters.companyNames.forEach(v => params.append("companyNames", v));
    if (filters.defaults?.length) filters.defaults.forEach(v => params.append("defaults", v));
    const response: AxiosResponse<ApiResponse<CompanyName[]>> = await Request.get(
      `${Endpoint.GET_ALL_COMPANY_NAME}?${params.toString()}`
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch company names");
  }
},
async getCompanyNameFilters(): Promise<AvailableFilters> {
  try {
    const response = await Request.get(Endpoint.GET_COMPANY_FILTERS);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to load filters");
  }
}
,
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
        `${Endpoint.UPDATE_COMPANY_NAME}/${id}`, data);
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