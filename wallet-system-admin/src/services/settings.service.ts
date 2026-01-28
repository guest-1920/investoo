import api from './api';

export const SETTINGS_KEYS = {
    REFERRAL: 'REFERRAL_SETTINGS',
    FINANCIAL: 'FINANCIAL_SETTINGS',
};

export interface ReferralLevelConfig {
    level: number;
    percentage: number;
}

export interface ReferralSettings {
    levels: ReferralLevelConfig[];
}

export interface FinancialSettings {
    withdrawalFee: number;
    minWithdrawal: number;
    minRecharge: number;
    principalTax: number;
}

export const SettingsService = {
    getSettings: async <T>(key: string): Promise<T> => {
        const response = await api.get<T>(`/settings/${key}`);
        return response.data;
    },

    updateSettings: async (key: string, value: any): Promise<void> => {
        await api.put(`/settings/${key}`, value);
    },
};
