import client from '../api/client';

export const referralService = {
    /**
     * Get all active, time-bound referral windows
     * GET /referrals/windows/active
     */
    getActiveWindows: async () => {
        const response = await client.get('/referrals/windows/active');
        return response.data;
    },

    /**
     * Get my progress in current windows
     * GET /referrals/windows/my-progress
     */
    getMyProgress: async () => {
        const response = await client.get('/referrals/windows/my-progress');
        return response.data;
    },

    /**
     * Get my pending rewards (waiting for claim selection)
     * GET /referrals/fulfillments/my-fulfillments?status=PENDING
     */
    getPendingClaims: async () => {
        const response = await client.get('/referrals/fulfillments/my-fulfillments', {
            params: { status: 'PENDING_SELECTION' }
        });
        // Handle pagination response structure if present, otherwise assume array or { data: [] }
        return response.data.data || response.data;
    },

    /**
     * Claim a reward (Digital or Physical)
     * POST /referrals/fulfillments/claim
     */
    claimReward: async (payload) => {
        const response = await client.post('/referrals/fulfillments/claim', payload);
        return response.data;
    },

    /**
     * Create/Update Address for delivery
     * POST /referrals/addresses
     */
    createAddress: async (addressData) => {
        const response = await client.post('/referrals/addresses', addressData);
        return response.data;
    },

    /**
     * Get Referral Statistics (Total Referrals, Earnings)
     * This might be a computed endpoint or aggregate from existing data.
     * Use /users/me/stats if available, or mock for now if backend is missing it.
     */
    getReferralStats: async () => {
        // Placeholder for stats endpoint. 
        // If backend doesn't have it, we might need to rely on what we have or generic profile stats.
        // For now, let's try to mock or use a likely endpoint.
        try {
            const response = await client.get('/referrals/stats');
            return response.data;
        } catch (error) {
            // Fallback mock if endpoint doesn't exist yet
            console.warn('Referral stats endpoint missing, using mock data');
            return {
                totalReferrals: 0,
                totalEarned: 0,
                pendingRewards: 0
            };
        }
    }
};
