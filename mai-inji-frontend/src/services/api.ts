import axios, { AxiosInstance, AxiosError } from 'axios';
import { env } from '@/lib/env';

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  error?: string;
};

export const unwrapApiResponse = <T>(payload: unknown): T => {
  if (
    payload &&
    typeof payload === 'object' &&
    'success' in payload &&
    (payload as ApiEnvelope<T>).success === true &&
    'data' in payload
  ) {
    return (payload as ApiEnvelope<T>).data as T;
  }
  return payload as T;
};

export const apiClient: AxiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Add JWT token to all requests
apiClient.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Handle 401 (unauthorized)
apiClient.interceptors.response.use(
  (response) => {
    response.data = unwrapApiResponse(response.data);
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear auth and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('admin_user');
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
