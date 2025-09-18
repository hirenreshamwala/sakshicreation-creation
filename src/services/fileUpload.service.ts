import axios, { type AxiosResponse } from "axios"
import Endpoint from "@/API/apiConfig"
import Request from "./axios"
import { authService } from "./auth.service"

interface UploadedFile {
  filename: string
  originalName: string
  size: number
  mimetype: string
  folder: string
  url: string
  path: string
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
}

export const fileUploadService = {
  // Upload single file
  async uploadSingleFile(file: File, folder = "general"): Promise<ApiResponse<UploadedFile>> {
    try {
      const token = authService.getToken()
      if (!token) {
        throw new Error("No authentication token found")
      }

      const formData = new FormData()
      formData.append("folder", folder)
      formData.append("file", file)

      const response: AxiosResponse<ApiResponse<UploadedFile>> = await axios.post(
        Endpoint.UPLOAD_SINGLE_FILE,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
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
      console.error("Upload Single File Service Error:", error)
      throw new Error(error.response?.data?.message || "Failed to upload file")
    }
  },

  // Upload multiple files
  async uploadMultipleFiles(files: File[], folder = "general"): Promise<ApiResponse<UploadedFile[]>> {
    try {
      const token = authService.getToken()
      if (!token) {
        throw new Error("No authentication token found")
      }

      const formData = new FormData()
      files.forEach((file) => {
        formData.append("files", file)
      })
      formData.append("folder", folder)

      console.log("Uploading multiple files:", files.length, "files to folder:", folder)

      const response: AxiosResponse<ApiResponse<UploadedFile[]>> = await axios.post(
        Endpoint.UPLOAD_MULTIPLE_FILES,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
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
      console.error("Upload Multiple Files Service Error:", error)
      throw new Error(error.response?.data?.message || "Failed to upload files")
    }
  },

  // Delete file
  async deleteFile(folder: string, filename: string): Promise<ApiResponse<null>> {
    try {

      const response: AxiosResponse<ApiResponse<null>> = await Request.delete(
        `${Endpoint.DELETE_FILE}/${folder}/${filename}`)

      return {
        success: response.data.success,
        data: response.data.data,
        message: response.data.message,
      }
    } catch (error: any) {
      console.error("Delete File Service Error:", error)
      throw new Error(error.response?.data?.message || "Failed to delete file")
    }
  },

  // Get file info
  async getFileInfo(folder: string, filename: string): Promise<ApiResponse<UploadedFile>> {
    try {

      const response: AxiosResponse<ApiResponse<UploadedFile>> = await Request.get(
        `${Endpoint.GET_FILE_INFO}/${folder}/${filename}`)

      return {
        success: response.data.success,
        data: response.data.data,
        message: response.data.message,
      }
    } catch (error: any) {
      console.error("Get File Info Service Error:", error)
      throw new Error(error.response?.data?.message || "Failed to get file info")
    }
  },
}
