import apiClient from './apiInterceptor';
import { LoginResponse, LoginCredentials, LogoutResponse, PasswordResetResponse, CreatePasswordResponse } from '@/lib/types/auth';

export const authApi = {
  login: async (credentials: LoginCredentials) => {
    const response = await apiClient.post<LoginResponse>('/auth/login/', credentials, {
      _suppressToast: true 
    });
    return response.data;
  },

  logout: async (refresh: string) => {
    const response = await apiClient.post<LogoutResponse>('/auth/logout/', { refresh });
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/user/');
    return response.data;
  },

  requestPasswordReset: async (data: { email: string }) => {
    const response = await apiClient.post<PasswordResetResponse>('/auth/reset-password/', data);
    return response.data;
  },

  confirmPasswordReset: async (data: any) => {
    const response = await apiClient.put<CreatePasswordResponse>('/auth/create-password/', data);
    return response.data;
  },
};
