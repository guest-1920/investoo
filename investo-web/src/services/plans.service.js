import client from '../api/client';

export const plansService = {
    /**
     * Get all active plans
     * GET /plans
     */
    getAllPlans: async () => {
        const response = await client.get('/plans');
        return response.data;
    },

    /**
     * Get single plan by ID
     * GET /plans/:id
     */
    getPlanById: async (id) => {
        const response = await client.get(`/plans/${id}`);
        return response.data;
    },

    purchasePlan: async (planId) => {
        const response = await client.post(`/subscriptions/buy/${planId}`);
        return response.data;
    },

    /**
     * Get my active subscriptions
     * GET /subscriptions/me
     */
    getMySubscriptions: async () => {
        const response = await client.get('/subscriptions/me');
        return response.data;
    }
};
