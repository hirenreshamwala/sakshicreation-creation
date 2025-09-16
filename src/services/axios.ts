// src/API/apiClient.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import { authService } from "@/services/auth.service";

const Request: AxiosInstance = axios.create({
  baseURL: Endpoint.BASE_URL, // make sure apiConfig has BASE_URL
  withCredentials: true,
});

// 🔹 Request Interceptor
Request.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const token = authService.getToken();
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    // Handle form-data vs JSON automatically
    if (config.data instanceof FormData) {
      config.headers = {
        ...config.headers,
        "Content-Type": "multipart/form-data",
      };
    } else {
      config.headers = {
        ...config.headers,
        "Content-Type": "application/json",
      };
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// 🔹 Response Interceptor
Request.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 403) {
      // clear local storage + redirect
      // localStorage.clear();
      // window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default Request;
