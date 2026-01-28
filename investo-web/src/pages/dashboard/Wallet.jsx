import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import authService from '../../services/auth.service';
import { ArrowUpRight, ArrowDownLeft, Wallet as WalletIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import DepositTab from '../../components/dashboard/wallet/DepositTab';
import WithdrawTab from '../../components/dashboard/wallet/WithdrawTab';
import HistoryTab from '../../components/dashboard/wallet/HistoryTab';
import RequestsTab from '../../components/dashboard/wallet/RequestsTab';

export default function Wallet() {
    const [searchParams] = useSearchParams();
    const [user, setUser] = useState(null);
    // Get initial tab from URL query param, default to 'deposit'
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'deposit');

    useEffect(() => {
        authService.getProfile().then(setUser);
    }, [activeTab]);

    if (!user) return <div className="text-white/40 animate-pulse">Loading wallet...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
            <h1 className="text-3xl font-bold text-white tracking-tight">My Wallet</h1>

            {/* Premium Balance Card */}
            <div className="p-8 md:p-10 rounded-2xl relative overflow-hidden bg-black border border-white/10 shadow-2xl">
                <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 pointer-events-none">
                    <WalletIcon size={200} className="text-white" />
                </div>
                {/* Abstract Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/50 via-black to-zinc-900/50 z-0 pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="text-center md:text-left">
                        <h2 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3 flex items-center gap-2 justify-center md:justify-start">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Available Balance
                        </h2>
                        <div className="text-5xl md:text-7xl font-bold text-white tracking-tighter mb-2">
                            {user.walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT
                        </div>
                        <div className="text-white/30 text-sm font-medium">Assets locked in active plans are excluded</div>
                    </div>

                </div>
            </div>

            {/* Tabs - Sleek Underline Style */}
            <div className="flex gap-6 border-b border-white/10 pb-1 overflow-x-auto">
                {['deposit', 'withdraw', 'requests', 'history'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-4 px-2 text-sm font-bold uppercase tracking-wider transition-colors relative whitespace-nowrap ${activeTab === tab ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
                    >
                        {tab}
                        {activeTab === tab && (
                            <motion.div layoutId="activeWalletTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                {activeTab === 'deposit' && <DepositTab />}
                {activeTab === 'withdraw' && <WithdrawTab balance={user.walletBalance} />}
                {activeTab === 'history' && <HistoryTab />}
                {activeTab === 'requests' && <RequestsTab />}
            </motion.div>
        </div>
    );
}
