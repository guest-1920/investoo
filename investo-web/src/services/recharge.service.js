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
    /**
     * Helper to request a recharge
     * POST /recharges
     */
    async requestRecharge(amount, proofKey, chainName) {
        return this.create({
            amount,
            proofKey,
            chainName,
        });
    }


    /**
     * Upload file to Virtualine Object Storage
     */
    async uploadProof(file) {

        // 1. Prepare FormData
        const formData = new FormData();
        formData.append('file', file);

        // Upload directly to backend
        try {
            const response = await client.post('/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
        
        return response.data.key;
        
        }catch (error) {
            console.error('Error uploading file:', error);
            throw new Error('Failed to upload proof');
        }
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
