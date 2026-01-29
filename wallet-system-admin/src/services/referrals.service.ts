import api  from './api';

// ==================== REFERRAL WINDOWS ====================

export const referralWindowsService = {
    getAll: (params?: any) => api.get('/referrals/windows/admin/all', { params }),
    getById: (id: string) => api.get(`/referrals/windows/admin/${id}`),
    create: (data: any) => api.post('/referrals/windows', data),
    update: (id: string, data: any) => api.patch(`/referrals/windows/${id}`, data),
    activate: (id: string) => api.patch(`/referrals/windows/${id}/activate`),
    deactivate: (id: string) => api.patch(`/referrals/windows/${id}/deactivate`),
    delete: (id: string) => api.delete(`/referrals/windows/${id}`),
};

// ==================== REWARDS ====================

export const rewardsService = {
    getAll: (params?: any) => api.get('/referrals/rewards/admin/all', { params }),
    getById: (id: string) => api.get(`/referrals/rewards/admin/${id}`),
    create: (data: any) => api.post('/referrals/rewards', data),
    update: (id: string, data: any) => api.patch(`/referrals/rewards/${id}`, data),
    delete: (id: string) => api.delete(`/referrals/rewards/${id}`),
    linkToWindow: (rewardId: string, windowId: string) =>
        api.post(`/referrals/rewards/${rewardId}/link-window`, { windowId }),
    linkToPlan: (rewardId: string, planId: string) =>
        api.post(`/referrals/rewards/${rewardId}/link-plan`, { planId }),
};

// ==================== FULFILLMENTS ====================

export const fulfillmentsService = {
    getAll: (params?: any) => api.get('/referrals/fulfillments/admin/all', { params }),
    getPending: (params?: any) => api.get('/referrals/fulfillments/admin/pending', { params }),
    getById: (id: string) => api.get(`/referrals/fulfillments/admin/${id}`),
    updateStatus: (id: string, data: { status: string; trackingNumber?: string; notes?: string }) =>
        api.patch(`/referrals/fulfillments/admin/${id}/status`, data),
};
