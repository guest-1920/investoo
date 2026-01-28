import client from '../api/client';

class AuthService {
    /**
     * Register a new user
     * POST /auth/register
     */
    async register(data) {
        const response = await client.post('/auth/register', data);
        return response.data;
    }

    /**
     * Login user
     * POST /auth/login
     */
    async login(email, password) {
        const response = await client.post('/auth/login', { email, password });
        return response.data;
    }



    /**
     * Verify Email Token
     * POST /auth/verify-email
     */
    async verifyEmail(token) {
        const response = await client.post('/auth/verify-email', { token });
        return response.data;
    }

    /**
     * Logout user
     * POST /auth/logout
     */
    async logout() {
        const response = await client.post('/auth/logout');
        return response.data;
    }
    /**
     * Forgot Password
     * POST /auth/forgot-password
     */
    async forgotPassword(email) {
        const response = await client.post('/auth/forgot-password', { email });
        return response.data;
    }

    /**
     * Reset Password
     * POST /auth/reset-password
     */
    async resetPassword(token, newPassword) {
        const response = await client.post('/auth/reset-password', { token, newPassword });
        return response.data;
    }

    /**
     * Get current user profile
     * GET /users/me
     */
    async getProfile() {
        const response = await client.get('/users/me');
        return response.data;
    }

    /**
     * Update current user profile
     * PATCH /users/me
     */
    async updateProfile(data) {
        const response = await client.patch('/users/me', data);
        return response.data;
    }
}

export default new AuthService();
