import BaseService from './base.service';
import client from '../api/client';

class RechargeService extends BaseService {
    constructor() {
        super('/recharges');
    }

    /**
     * Helper to request a recharge
     * POST /recharges
     */
    async requestRecharge(amount, transactionId, chainName) {
        return this.create({
            amount,
            transactionId,
            chainName,
        });
    }

    /**
     * Get my recharges
     * GET /recharges/my
     */
    async getMyRecharges(params = {}) {
        return client.get(`${this.endpoint}/my`, { params });
    }
}

export default new RechargeService();
