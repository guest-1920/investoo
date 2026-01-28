import api from '../api/client';

export const settingsService = {
    getFinancialSettings: async () => {
        const response = await api.get('/settings/public/FINANCIAL_SETTINGS');
        return response.data;
    },
};

export default settingsService;
