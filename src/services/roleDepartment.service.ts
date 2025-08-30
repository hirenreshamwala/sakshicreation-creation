import axios, { AxiosResponse } from 'axios';
import Endpoint from '@/API/apiConfig';
import { authService } from './auth.service';

// Interfaces for Party
export interface Party {
  _id: string;
  companyName: string;
  party: string;
  reasonToVisit: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

// Interfaces for CompanyName
export interface CompanyName {
  _id: string;
  companyName: string;
  __v?: number;
  partyList?: Party[];
}

// Interfaces for RoleDepartment
export interface RoleDepartment {
  _id: string;
  roleDepartment: string;
  CompanyName: CompanyName | string; // Can be populated object or ID
}

export interface CreateRoleDepartment {
  roleDepartment: string;
  CompanyName: string; // ID of the company
}

export interface UpdateRoleDepartment {
  roleDepartment?: string;
  CompanyName?: string; // ID of the company
}

// Interfaces for RoleDepartmentCompany
export interface RoleDepartmentCompany {
  _id: string;
  roleDepartment: RoleDepartment | string; // Can be populated object or ID
  roleDepartmentCompanyName: string;
}

export interface CreateRoleDepartmentCompany {
  roleDepartment: string; // ID of the role department
  roleDepartmentCompanyName: string;
}

export interface UpdateRoleDepartmentCompany {
  roleDepartment?: string; // ID of the role department
  roleDepartmentCompanyName?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export const roleDepartmentService = {
  // CompanyName Services
  async getAllCompanies(): Promise<ApiResponse<CompanyName[]>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response: AxiosResponse<ApiResponse<CompanyName[]>> = await axios.get(
        Endpoint.COMPANY_NAME_GET_ALL,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch companies');
    }
  },

  // RoleDepartment Services
  async getAllRoleDepartments(): Promise<ApiResponse<RoleDepartment[]>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response: AxiosResponse<ApiResponse<RoleDepartment[]>> = await axios.get(
        Endpoint.ROLE_DEPARTMENT_GET_ALL,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch role departments');
    }
  },

  async getRoleDepartmentById(id: string): Promise<ApiResponse<RoleDepartment>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response: AxiosResponse<ApiResponse<RoleDepartment>> = await axios.get(
        `${Endpoint.ROLE_DEPARTMENT_GET_BY_ID}/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch role department');
    }
  },

  async createRoleDepartment(data: CreateRoleDepartment): Promise<RoleDepartment> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response: AxiosResponse<ApiResponse<RoleDepartment>> = await axios.post(
        Endpoint.ROLE_DEPARTMENT_CREATE,
        data,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return response.data.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create role department');
    }
  },

  async updateRoleDepartment(id: string, data: Partial<UpdateRoleDepartment>): Promise<RoleDepartment> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response: AxiosResponse<ApiResponse<RoleDepartment>> = await axios.patch(
        `${Endpoint.ROLE_DEPARTMENT_UPDATE}/${id}`,
        data,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return response.data.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update role department');
    }
  },

  async deleteRoleDepartment(id: string): Promise<void> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      await axios.delete(`${Endpoint.ROLE_DEPARTMENT_DELETE}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete role department');
    }
  },

  // RoleDepartmentCompany Services
  async getAllRoleDepartmentCompanies(): Promise<ApiResponse<RoleDepartmentCompany[]>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response: AxiosResponse<ApiResponse<RoleDepartmentCompany[]>> = await axios.get(
        Endpoint.ROLE_DEPARTMENT_COMPANY_GET_ALL,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch role department companies');
    }
  },

  async getRoleDepartmentCompanyById(id: string): Promise<ApiResponse<RoleDepartmentCompany>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response: AxiosResponse<ApiResponse<RoleDepartmentCompany>> = await axios.get(
        `${Endpoint.ROLE_DEPARTMENT_COMPANY_GET_BY_ID}/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch role department company');
    }
  },

  async createRoleDepartmentCompany(data: CreateRoleDepartmentCompany): Promise<RoleDepartmentCompany> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response: AxiosResponse<ApiResponse<RoleDepartmentCompany>> = await axios.post(
        Endpoint.ROLE_DEPARTMENT_COMPANY_CREATE,
        data,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return response.data.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create role department company');
    }
  },

  async updateRoleDepartmentCompany(id: string, data: Partial<UpdateRoleDepartmentCompany>): Promise<RoleDepartmentCompany> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response: AxiosResponse<ApiResponse<RoleDepartmentCompany>> = await axios.patch(
        `${Endpoint.ROLE_DEPARTMENT_COMPANY_UPDATE}/${id}`,
        data,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return response.data.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update role department company');
    }
  },

  async deleteRoleDepartmentCompany(id: string): Promise<void> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      await axios.delete(`${Endpoint.ROLE_DEPARTMENT_COMPANY_DELETE}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete role department company');
    }
  },
};

export default roleDepartmentService;