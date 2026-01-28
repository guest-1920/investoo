import BaseService from './base.service';
import client from '../api/client';

class SubscriptionsService extends BaseService {
    constructor() {
        super('/subscriptions');
    }

    /**
     * Purchase a plan
     * POST /subscriptions/buy/:planId
     */
    async purchase(planId) {
        return client.post(`${this.endpoint}/buy/${planId}`);
    }

    /**
     * Get my active subscriptions
     * GET /subscriptions/me
     */
    async getMySubscriptions() {
        return client.get(`${this.endpoint}/me`);
    }

    /**
     * Get my daily returns logs with optional filtering
     * GET /subscriptions/daily-returns/my
     * @param {Object} params - Optional { since: 'YYYY-MM-DD', groupBy: 'day' | 'week' | 'month' }
     */
    async getMyDailyReturns(params = {}) {
        const response = await client.get(`${this.endpoint}/daily-returns/my`, { params });
        return response.data;
    }
}

export default new SubscriptionsService();
