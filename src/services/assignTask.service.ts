import axios, { AxiosResponse } from 'axios';
import Endpoint from '@/API/apiConfig';
import { authService } from './auth.service';

export interface Address {
  unitNo: string;
  marketName: string;
  streetAddress: string;
  landMark?: string;
  area: string;
  pincode: string;
}

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface AssignTask {
  _id: string;
  companyName: string;
  partyName: string;
  date: string;
  time: string;
  reasonForVisit: string;
  assignTo: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  rescheduleDate?: string;
  originalTaskId?: {
    _id: string;
    date: string;
    status: string;
    createdAt: string; // Add createdAt for originalTaskId
  };
  visitDate?: string;
  visitTime?: string;
  feedback?: string;
  accountDetails: {
    _id: string;
    companyName: string;
    partyName: string;
    ownerName: string;
    ownerMobileNo: string;
    ownerWhatsAppNo: string;
    contactPerson: string;
    personMobileNo: string;
    personWhatsAppNo: string;
    contactForPayment: string;
    contactMobileNo: string;
    contactWhatsAppNo: string;
    GSTNo: string;
    address: Address;
    reasonToVisit: string;
    createdBy: User | string;
    assignedTo: string[];
    status: string;
    remarks: string;
    partyTag: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface CreateAssignTask {
  companyName: string;
  partyName: string;
  date: string;
  time: string;
  reasonForVisit: string;
  assignTo: string;
  remarks?: string;
  visitDate?: string;
  visitTime?: string;
  feedback?: string;
  status?: string;
  rescheduleDate?: string;
}

export interface UpdateAssignTask {
  companyName?: string;
  partyName?: string;
  date?: string;
  time?: string;
  reasonForVisit?: string;
  assignTo?: string;
  status?: string;
  visitDate?: string;
  visitTime?: string;
  feedback?: string;
  rescheduleDate?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export const assignTaskService = {
  async getAllAssignTasks(): Promise<ApiResponse<AssignTask[]>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response: AxiosResponse<ApiResponse<AssignTask[]>> = await axios.get(
        Endpoint.GET_ALL_ASSIGN_TASKS,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return {
        success: response.data.success,
        data: response.data.data || [],
        message: response.data.message,
      };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch assigned tasks');
    }
  },

  async getAssignTaskById(id: string): Promise<ApiResponse<AssignTask>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response: AxiosResponse<ApiResponse<AssignTask>> = await axios.get(
        `${Endpoint.GET_ASSIGN_TASK_BY_ID}/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch assigned task');
    }
  },
  async getAssignTaskByStaffId(id: string): Promise<ApiResponse<AssignTask>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response: AxiosResponse<ApiResponse<AssignTask>> = await axios.get(
        `${Endpoint.GET_ASSIGN_TASK_BY_STAFF_ID}/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch assigned task');
    }
  },

  async createAssignTask(data: CreateAssignTask): Promise<AssignTask> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response: AxiosResponse<AssignTask> = await axios.post(
        Endpoint.CREATE_ASSIGN_TASK,
        data,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create assigned task');
    }
  },

  async updateAssignTask(id: string, data: Partial<UpdateAssignTask>): Promise<AssignTask> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response: AxiosResponse<AssignTask> = await axios.patch(
        `${Endpoint.UPDATE_ASSIGN_TASK}/${id}`,
        data,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update assigned task');
    }
  },

  async deleteAssignTask(id: string): Promise<ApiResponse<void>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response: AxiosResponse<ApiResponse<void>> = await axios.delete(
        `${Endpoint.DELETE_ASSIGN_TASK}/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return {
        success: response.data.success,
        message: response.data.message,
      };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete assigned task');
    }
  }
};