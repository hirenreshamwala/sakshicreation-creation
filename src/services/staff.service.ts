// src/services/staff.service.ts
import axios from 'axios';
import Endpoint from '@/API/apiConfig';
import { authService } from './auth.service';

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
  private static getAuthHeader() {
    const token = authService.getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }
    return { Authorization: `Bearer ${token}` };
  }

  static async getAllStaff() {
    try {
      const response = await axios.get(Endpoint.GET_ALL_STAFF, {
        headers: this.getAuthHeader(),
        withCredentials: true,
      });
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  static async getStaffById(id: string) {
    try {
      const response = await axios.get(`${Endpoint.GET_STAFF_BY_ID}/${id}`, {
        headers: this.getAuthHeader(),
        withCredentials: true,
      });
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  static async createStaff(staffData: Omit<Staff, 'id'>) {
    try {
      const response = await axios.post(Endpoint.CREATE_STAFF, staffData, {
        headers: this.getAuthHeader(),
        withCredentials: true,
      });
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  static async updateStaff(id: string, staffData: Partial<Staff>) {
    try {
      const response = await axios.patch(`${Endpoint.UPDATE_STAFF}/${id}`, staffData, {
        headers: this.getAuthHeader(),
        withCredentials: true,
      });
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  static async updateStaffStatus(id: string, status: boolean) {
    try {
      const response = await axios.patch(
        `${Endpoint.UPDATE_STAFF_STATUS}/${id}`,
        { status },
        {
          headers: this.getAuthHeader(),
          withCredentials: true,
        }
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  static async deleteStaff(id: string) {
    try {
      const response = await axios.delete(`${Endpoint.DELETE_STAFF}/${id}`, {
        headers: this.getAuthHeader(),
        withCredentials: true,
      });
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }
static async updateStaffPassword(id: string, passwordData: { currentPassword: string; newPassword: string }) {
  try {
    const response = await axios.patch(
      `${Endpoint.UPDATE_STAFF_PASSWORD}/${id}`,
      passwordData,
      {
        headers: this.getAuthHeader(),
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error: any) {
    // Extract the error message from the response
    const errorMessage = error.response?.data?.message || error.message || "Failed to update password";
    throw new Error(errorMessage);
  }
}
}

export default StaffService;