import apiClient from './apiClient';
import type {RegisterData, LoginData, AuthResponse, UserResponse} from "../types/auth.ts";

export const authApi = {
    register: async (data: RegisterData): Promise<AuthResponse> => {
        const response = await apiClient.post('/auth/register', data);
        return response.data;
    },

    login: async (credentials: LoginData): Promise<AuthResponse> => {
        const response = await apiClient.post('/auth/login', credentials);
        return response.data;
    },

    getProfile: async (): Promise<UserResponse> => {
        const response = await apiClient.get('/auth/profile');
        return response.data;

    }
};