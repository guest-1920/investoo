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
     * Get presigned URL for upload
     */
    async getPresignedUrl(contentType = 'image/jpeg') {
        const response = await client.get('/upload/presigned-url', {
            params: { contentType }
        });
        return response.data;
    }

    /**
     * Upload file to S3 using presigned URL
     */
    async uploadProof(file) {
        // 1. Get Presigned URL and Fields
        const { url, fields, key } = await this.getPresignedUrl(file.type);

        // 2. Prepare FormData
        const formData = new FormData();
        Object.entries(fields).forEach(([k, v]) => {
            formData.append(k, v);
        });
        formData.append('file', file); // File must be the last field

        // 3. Upload to S3
        const response = await fetch(url, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            console.error('S3 Upload Failed:', await response.text());
            throw new Error('Failed to upload proof to S3');
        }

        return key;
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
