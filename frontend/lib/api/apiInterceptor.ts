import axios, { InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'sonner';

// Extend AxiosRequestConfig to include custom properties
declare module 'axios' {
  export interface AxiosRequestConfig {
    _suppressToast?: boolean;
  }
}

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
let isRedirectingToLogin = false;

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      if (!error.config?._suppressToast) {
        toast.error('Request timed out. Please try again.');
      }
      return Promise.reject(error);
    }

    if (error.response) {
      const shouldSuppressToast = error.config?._suppressToast;

      if (error.response.status === 401) {
          if (typeof window !== 'undefined' && !isRedirectingToLogin) {
              isRedirectingToLogin = true;
              
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              localStorage.removeItem('user_data');
              
              if (!shouldSuppressToast) {
                  toast.error('Session expired. Please login again.');
              }
              
              // Use replace to avoid back button issues
              window.location.replace('/login');
              
              // Reset flag after a delay to allow for future logins
              setTimeout(() => {
                  isRedirectingToLogin = false;
              }, 5000);
          }
      } else if (error.response.status >= 500) {
          if (!shouldSuppressToast) {
              toast.error('Server error. Please try again later.');
          }
      } else {
          if (!shouldSuppressToast) {
              const message = error.response.data?.message || error.response.data?.error || 'An error occurred';
              toast.error(message);
          }
      }

    } else if (error.request) {
      if (!error.config?._suppressToast) {
          toast.error('Network error. Please check your connection.');
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

export const simulateApiCall = <T>(data: T, delay = 1000): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(data);
    }, delay);
  });
};
