import { AxiosResponse } from 'axios';
import Request from './axios';
import Endpoint from '@/API/apiConfig';

export interface PaymentFolder {
    _id: string;
    company: string; // or Company type if you have a Company interface
    party: string; // or Party type
    assignedTo: string; // or Staff type
    assignedDate: string;
    remarks?: string;
    paymentType: string;
    month: string;
    paymentAmount: number;
    area?: string;
    receivedAmount: number;
    pendingAmount: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    count?: number;
    pagination?: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
    totalCount?: number;
}

interface MultipleDeleteResponse {
    success: boolean;
    message: string;
    deletedCount: number;
    deletedIds: string[];
}

export const paymentFolderService = {

    async createPaymentFolder(data: Partial<PaymentFolder>): Promise<PaymentFolder> {
        try {
            const response: AxiosResponse<{ data: PaymentFolder; message: string }> = await Request.post(
                Endpoint.CREATE_PAYMENT_FOLDER,
                data
            );
            return response.data.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to create payment folder');
        }
    },

    async getAllPaymentFolders(filters?: any): Promise<ApiResponse<PaymentFolder[]>> {
        try {
            const response: AxiosResponse<ApiResponse<PaymentFolder[]>> = await Request.post(
                `${Endpoint.GET_ALL_PAYMENT_FOLDERS}`,
                filters || {}
            );
            return {
                success: true,
                data: response.data.data || [],
                message: response.data.message,
                pagination: response.data.pagination,
                totalCount: response.data.totalCount
            };
        } catch (error: any) {
            throw new Error(error.response?.data?.message || "Failed to fetch payment folders");
        }
    },

    // Fixed: Renamed to searchFilterOptions to match complainService and page call
    async searchFilterOptions(field: string, searchTerm: string, filters?: any): Promise<ApiResponse<string[]>> {
        try {
            const response: AxiosResponse<ApiResponse<string[]>> = await Request.post(
                `${Endpoint.GET_PAYMENT_FOLDER_FILTER_OPTIONS}/${field}`,
                { search: searchTerm, ...filters }
            );
            return {
                success: true,
                data: response.data.data || [],
                message: response.data.message
            };
        } catch (error: any) {
            throw new Error(error.response?.data?.message || `Failed to search ${field} options`);
        }
    },

    async getPaymentFolderById(id: string): Promise<PaymentFolder> {
        try {
            const response: AxiosResponse<PaymentFolder> = await Request.get(
                `${Endpoint.GET_PAYMENT_FOLDER_BY_ID}/${id}`
            );
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to fetch payment folder');
        }
    },

    async updatePaymentFolder(id: string, data: Partial<PaymentFolder>): Promise<PaymentFolder> {
        try {
            const response: AxiosResponse<{ data: PaymentFolder; message: string }> = await Request.post(
                `${Endpoint.UPDATE_PAYMENT_FOLDER}/${id}`,
                data
            );
            return response.data.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to update payment folder');
        }
    },
    async addPaymentFolder(id: string, data: Partial<PaymentFolder>): Promise<PaymentFolder> {
        try {
            const response: AxiosResponse<{ data: PaymentFolder; message: string }> = await Request.post(
                `${Endpoint.ADD_PAYMENT_FOLDER}/${id}`,
                data
            );
            return response.data.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to update payment folder');
        }
    },

    async deletePaymentFolder(id: string): Promise<void> {
        try {
            await Request.delete(`${Endpoint.DELETE_PAYMENT_FOLDER}/${id}`);
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to delete payment folder');
        }
    },
    async deleteMultiplePaymentFolders(ids: string[]): Promise<MultipleDeleteResponse> {
        try {
            const response: AxiosResponse<MultipleDeleteResponse> = await Request.post(
                Endpoint.DELETE_MULTIPLE_PAYMENT_FOLDER, // Make sure this endpoint supports multiple deletion
                { ids }  // Send IDs in request body
            );

            return {
                success: true,
                message: response.data.message || `${ids.length} payment folder(s) deleted successfully`,
                deletedCount: response.data.deletedCount || ids.length,
                deletedIds: ids
            };
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to delete payment folders');
        }
    },

    async assignTaskToFolder(id: string, data: { assignedTo: string; assignedDate: string; remarks?: string }): Promise<PaymentFolder> {
        try {
            const response: AxiosResponse<{ data: PaymentFolder; message: string }> = await Request.post(
                `${Endpoint.ASSIGN_TASK_FOLDER}/${id}`,
                data
            );
            return response.data.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to assign task to payment folder');
        }
    }
};