// src/services/staff.service.ts
import axios from 'axios';
import Endpoint from '@/API/apiConfig';
import { authService } from './auth.service';
import Request from './axios';

interface Staff {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  mobileNo: string;
  whatsappNo: string;
  address: string;
  aadharNo: string;
  joiningDate: string;
  birthDay?: string;
  password?: string;
  role: string;
  status?: boolean;
}

class StaffService {
  static async getAllStaff() {
    try {
      const response = await Request.get(Endpoint.GET_ALL_STAFF);
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  static async getStaffById(id: string) {
    try {
      const response = await Request.get(`${Endpoint.GET_STAFF_BY_ID}/${id}`);
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  static async createStaff(staffData: Omit<Staff, 'id'>) {
    try {
      const response = await Request.post(Endpoint.CREATE_STAFF, staffData);
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  static async updateStaff(id: string, staffData: Partial<Staff>) {
    try {
      const response = await Request.patch(`${Endpoint.UPDATE_STAFF}/${id}`, staffData);
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  static async updateStaffStatus(id: string, status: boolean) {
    try {
      const response = await Request.patch(
        `${Endpoint.UPDATE_STAFF_STATUS}/${id}`,
        { status });
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  static async deleteStaff(id: string) {
    try {
      const response = await Request.delete(`${Endpoint.DELETE_STAFF}/${id}`);
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }
  static async updateStaffPassword(id: string, passwordData: { currentPassword: string; newPassword: string }) {
    try {
      const response = await Request.patch(
        `${Endpoint.UPDATE_STAFF_PASSWORD}/${id}`,
        passwordData);
      return response.data;
    } catch (error: any) {
      // Extract the error message from the response
      const errorMessage = error.response?.data?.message || error.message || "Failed to update password";
      throw new Error(errorMessage);
    }
  }
  static async updateStaffAttachments(id: any, body: boolean) {
    try {
      const response = await Request.post(
        `${Endpoint.UPDATE_STAFF_ATTACHMENTS}/${id}`,
        body);
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }
}

export default StaffService;