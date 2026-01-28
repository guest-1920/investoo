import api from './api';

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'USER' | 'ADMIN';
    walletBalance: number;
    referralCode: string;
    referredBy?: string;
    createdAt: string;
    updatedAt: string;
}

export interface LoginResponse {
    accessToken: string;
    role: 'USER' | 'ADMIN';
}

export const authService = {
    /**
     * Login with email and password
     */
    async login(email: string, password: string): Promise<LoginResponse> {
        const response = await api.post<LoginResponse>('/auth/login', {
            email,
            password,
        });
        return response.data;
    },

    /**
     * Logout current user
     */
    async logout(): Promise<void> {
        await api.post('/auth/logout');
    },

    /**
     * Get current authenticated user
     */
    async getMe(): Promise<User> {
        const response = await api.get<User>('/users/me');
        return response.data;
    },
};

export default authService;
