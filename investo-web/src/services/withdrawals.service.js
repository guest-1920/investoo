import BaseService from './base.service';
import client from '../api/client';

class WithdrawalsService extends BaseService {
    constructor() {
        super('/withdrawals');
    }

    /**
     * Request a withdrawal
     * POST /withdrawals
     */
    async requestWithdrawal(amount, address, chainName = 'TRC20') {
        return this.create({
            amount,
            blockchainAddress: address,
            chainName,
        });
    }

    /**
     * Get my withdrawals
     * GET /withdrawals/my
     */
    async getMyWithdrawals(params = {}) {
        return client.get(`${this.endpoint}/my`, { params });
    }

    /**
     * Verify withdrawal email token
     * POST /withdrawals/verify
     */
    async verifyWithdrawal(token) {
        const response = await client.post(`${this.endpoint}/verify`, { token });
        return response.data;
    }
}

export default new WithdrawalsService();
