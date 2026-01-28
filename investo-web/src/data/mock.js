/**
 * Mock Data Layer
 * Simulating Backend Entities: User, Plan, Recharge, Withdrawal
 */

// --- STORAGE ---
let CURRENT_USER = {
    id: 'u-123456',
    name: 'Demo Investor',
    email: 'demo@Investoo.com',
    password: 'password', // In reality hashed
    role: 'USER',
    walletBalance: 2450.50,
    referralCode: 'INV-8821',
    referredBy: null
};

const PLANS = [
    {
        id: 'p-001',
        name: 'Starter Yield',
        price: 100,
        validity: 30,
        status: 'ACTIVE',
        referralReward: 5,
        dailyReturn: 0.5, // $0.50/day = 0.5%
        description: 'Entry-level algorithmic trading access.'
    },
    {
        id: 'p-002',
        name: 'Growth Alpha',
        price: 500,
        validity: 60,
        status: 'ACTIVE',
        referralReward: 25,
        dailyReturn: 3.5, // $3.50/day = 0.7%
        description: 'Balanced exposure to DeFi and Blue-chip assets.'
    },
    {
        id: 'p-003',
        name: 'Institutional Elite',
        price: 5000,
        validity: 90,
        status: 'ACTIVE',
        referralReward: 300,
        dailyReturn: 45.0, // $45/day = 0.9%
        description: 'High-frequency arbitrage strategies with leverage.'
    }
];

const TRANSACTIONS = [
    {
        id: 'tx-991',
        userId: 'u-123456',
        amount: 1000,
        paymentMethod: 'Blockchain',
        blockchainAddress: 'TQn9Yh...j8s',
        chainName: 'TRC20',
        transactionId: '7f9a...3b21',
        status: 'APPROVED',
        type: 'RECHARGE',
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
    },
    {
        id: 'tx-992',
        userId: 'u-123456',
        amount: 500,
        payoutMethod: 'Blockchain',
        blockchainAddress: 'TWz...99x',
        chainName: 'TRC20',
        status: 'PENDING',
        type: 'WITHDRAWAL',
        createdAt: new Date(Date.now() - 3600000).toISOString()
    }
];

const INVESTMENTS = [
    {
        id: 'sub-001',
        userId: 'u-123456',
        planId: 'p-001',
        planName: 'Starter Yield',
        startDate: new Date(Date.now() - 86400000 * 10).toISOString(),
        status: 'ACTIVE'
    }
];

// --- AUTH FUNCTIONS ---

export const login = async (email, password) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (email === 'demo@Investoo.com' && password === 'password') {
                resolve(CURRENT_USER);
            } else {
                reject(new Error('Invalid credentials'));
            }
        }, 800);
    });
};

export const register = async (userData) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            CURRENT_USER = {
                ...CURRENT_USER,
                ...userData,
                walletBalance: 0,
                id: `u-${Math.floor(Math.random() * 100000)}`
            };
            resolve(CURRENT_USER);
        }, 1000);
    });
};

export const verifyOtp = async (otp) => {
    // Simulate OTP verify
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (otp === '123456') resolve(true);
            else reject(new Error('Invalid OTP'));
        }, 800);
    });
};

export const logout = () => {
    return Promise.resolve(true);
};

// --- DATA FUNCTIONS ---

export const getUser = () => Promise.resolve(CURRENT_USER);

export const getPlans = () => Promise.resolve(PLANS);

export const getInvestments = () => Promise.resolve(INVESTMENTS);

export const getTransactions = () => Promise.resolve(TRANSACTIONS);

export const buyPlan = async (planId) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const plan = PLANS.find(p => p.id === planId);
            if (!plan) return reject(new Error('Plan not found'));

            if (CURRENT_USER.walletBalance < plan.price) {
                return reject(new Error('Insufficient balance'));
            }

            // Deduct balance
            CURRENT_USER.walletBalance -= plan.price;

            // Create investment
            const newInv = {
                id: `sub-${Date.now()}`,
                userId: CURRENT_USER.id,
                planId: plan.id,
                planName: plan.name,
                startDate: new Date().toISOString(),
                status: 'ACTIVE'
            };
            INVESTMENTS.unshift(newInv);
            resolve(newInv);
        }, 1000);
    });
};

export const requestRecharge = async (amount, txHash) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const tx = {
                id: `tx-${Date.now()}`,
                userId: CURRENT_USER.id,
                amount: parseFloat(amount),
                paymentMethod: 'Blockchain',
                blockchainAddress: 'SYSTEM_WALLET_ADDRESS',
                chainName: 'TRC20',
                transactionId: txHash,
                status: 'PENDING',
                type: 'RECHARGE',
                createdAt: new Date().toISOString()
            };
            TRANSACTIONS.unshift(tx);
            resolve(tx);
        }, 1000);
    });
};

export const requestWithdrawal = async (amount, address, chain) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (CURRENT_USER.walletBalance < amount) return reject(new Error('Insufficient funds'));

            CURRENT_USER.walletBalance -= amount;

            const tx = {
                id: `tx-${Date.now()}`,
                userId: CURRENT_USER.id,
                amount: parseFloat(amount),
                payoutMethod: 'Blockchain',
                blockchainAddress: address,
                chainName: chain,
                status: 'PENDING',
                type: 'WITHDRAWAL',
                createdAt: new Date().toISOString()
            };
            TRANSACTIONS.unshift(tx);
            resolve(tx);
        }, 1000);
    });
};
