export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  is_onboarded: boolean;
  is_active: boolean;
  date_joined: string;
  last_login: string;
  agency?: number;
  agency_id?: number;
  agency_name?: string;
  is_onboarding_complete?: boolean;
}

export interface LoginResponse {
  refresh: string;
  access: string;
  user: User;
  role: string;
}

export interface LoginCredentials {
  username?: string;
  password?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  new_password: string;
  confirm_password: string;
}

export interface AuthResponse {
  status: string;
  data: {
    message: string;
  };
}

export interface LogoutResponse {
  message: string;
  username: string;
}

export interface PasswordResetResponse {
  message: string;
  error?: string;
}

export interface CreatePasswordResponse {
  message: string;
  username: string;
  is_first_time: boolean;
  error?: string;
}
