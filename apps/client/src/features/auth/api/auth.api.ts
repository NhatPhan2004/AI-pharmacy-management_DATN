import axios from "axios";

export type UserRole = "ADMIN" | "MANAGER" | "STAFF";

export interface UserInfo {
  id: string | number;
  username: string;
  full_name: string;
  role: UserRole;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserInfo;
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  data: T;
  timestamp: string;
}

export interface ForgotPasswordRequest {
  username: string;
  email: string;
}

export type ContactRequestCategory =
  | "LOGIN_ISSUE"
  | "ACCOUNT_LOCKED"
  | "PASSWORD_ISSUE"
  | "ACCOUNT_REQUEST"
  | "OTHER";

export interface ContactAdminRequest {
  username: string;
  email: string;
  category: ContactRequestCategory;
  description: string;
}

export const authApi = {
  async login(payload: LoginRequest): Promise<LoginResponse> {
    const response = await axios.post<ApiResponse<LoginResponse>>(
      "/api/v1/auth/login",
      payload,
    );

    return response.data.data;
  },

  async forgotPassword(payload: ForgotPasswordRequest): Promise<never> {
    void payload;
    throw new Error("PASSWORD_RESET_API_NOT_IMPLEMENTED");
  },

  async contactAdmin(payload: ContactAdminRequest): Promise<never> {
    void payload;
    throw new Error("CONTACT_ADMIN_API_NOT_IMPLEMENTED");
  },
};
