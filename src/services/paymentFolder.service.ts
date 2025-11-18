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

    async getAllPaymentFolders(): Promise<ApiResponse<PaymentFolder[]>> {
        try {
            const response: AxiosResponse<{ data: PaymentFolder[] }> = await Request.get(
                Endpoint.GET_ALL_PAYMENT_FOLDERS
            );
            return {
                success: true,
                data: response.data.data || [],
                count: response.data.data?.length || 0,
            };
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to fetch payment folders');
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
            console.log("last respoinse",response.data.data)
            return response.data.data;
        } catch (error: any) {
            console.log(error,';error in service')
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
};