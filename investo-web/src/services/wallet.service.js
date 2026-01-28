import client from '../api/client';

class WalletService {
    /**
     * Get wallet balance
     * GET /wallet/balance
     */
    async getBalance() {
        const response = await client.get('/wallet/balance');
        return response.data;
    }

    /**
     * Get wallet transactions
     * GET /wallet/transactions
     */
    async getTransactions(params = {}) {
        // Default pagination params
        const defaultParams = {
            page: 1,
            limit: 10,
            sortBy: 'createdAt',
            sortOrder: 'DESC',
            ...params,
        };
        const response = await client.get('/wallet/transactions', { params: defaultParams });
        return response.data;
    }
}

export default new WalletService();
