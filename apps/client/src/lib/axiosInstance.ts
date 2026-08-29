import axios, { AxiosError } from 'axios';

export const axiosInstance = axios.create({
  baseURL: '/api/v1',
  withCredentials: true, // Sends httpOnly JWT cookies automatically with every request
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for centralized error extraction
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ success: boolean; error: { code: string; message: string; details?: unknown } }>) => {
    // Standardize error messaging
    const message = error.response?.data?.error?.message || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);
