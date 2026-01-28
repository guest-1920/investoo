import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const client = axios.create({
    baseURL,
    withCredentials: true, // Critical for httpOnly cookies
    headers: {
        'Content-Type': 'application/json',
    },
});

// Response interceptor for global error handling
// Response interceptor setup
export const setupInterceptors = (onUnauth) => {
    client.interceptors.response.use(
        (response) => response,
        (error) => {
            const originalRequest = error.config;

            // Handle 401 Unauthorized (Session Expired / Not Logged In)
            if (error.response?.status === 401 && !originalRequest._retry) {
                if (onUnauth) {
                    onUnauth();
                }
            }

            return Promise.reject(error);
        }
    );
};

export default client;
