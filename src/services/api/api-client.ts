import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

interface ApiError extends Error {
  status?: number;
  details?: any;
}

// Create a new axios instance with custom config
export const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    // You can add auth tokens here
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any): Promise<never> => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  async (error: any): Promise<never> => {
    const apiError: ApiError = new Error(error.message);

    if (error.response) {
      apiError.status = error.response.status;
      apiError.details = error.response.data;

      // Handle specific HTTP error codes
      switch (error.response.status) {
        case 401:
          // Handle unauthorized
          // Could redirect to login or refresh token
          console.error("Unauthorized access");
          break;
        case 403:
          // Handle forbidden
          console.error("Forbidden access");
          break;
        case 404:
          // Handle not found
          console.error("Resource not found");
          break;
        case 500:
          // Handle server error
          console.error("Internal server error");
          break;
        default:
          console.error(`HTTP Error ${error.response.status}`);
      }
    } else if (error.request) {
      // Request was made but no response received
      apiError.status = 0;
      apiError.details = { message: "No response received from server" };
      console.error("No response received:", error.request);
    } else {
      // Error in request configuration
      apiError.status = -1;
      apiError.details = { message: "Request configuration error" };
      console.error("Request configuration error:", error.message);
    }

    return Promise.reject(apiError);
  }
);

// Create type-safe request methods
export const apiRequest = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    api.get(url, config).then((response) => response.data),

  post: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    api.post(url, data, config).then((response) => response.data),

  put: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    api.put(url, data, config).then((response) => response.data),

  patch: <T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> =>
    api.patch(url, data, config).then((response) => response.data),

  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    api.delete(url, config).then((response) => response.data),
};

export default api;
