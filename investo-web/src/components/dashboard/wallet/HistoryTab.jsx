import React, { useEffect, useState } from 'react';
import walletService from '../../../services/wallet.service';
import { Card } from '../../ui/Card';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HistoryTab() {
    const [txs, setTxs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState(null);

    useEffect(() => {
        setLoading(true);
        walletService.getTransactions({ page, limit: 10 })
            .then(res => {
                setTxs(res.data || []);
                setMeta(res.meta);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [page]);

    const getTxMeta = (tx) => {
        const isCredit = tx.type === 'CREDIT';

        let label = tx.source;
        switch (tx.source) {
            case 'RECHARGE': label = 'Deposit'; break;
            case 'WITHDRAW': label = 'Withdrawal'; break;
            case 'PURCHASE': label = 'Plan Purchase'; break;
            case 'REFERRAL_BONUS': label = 'Referral Bonus'; break;
            case 'DAILY_RETURN': label = 'Daily Return'; break;
            default: label = tx.source?.replace('_', ' ') || (isCredit ? 'Credit' : 'Debit');
        }

        return {
            isCredit,
            label,
            colorClass: isCredit ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500',
            Icon: isCredit ? ArrowDownLeft : ArrowUpRight
        };
    };

    const PaginationControls = () => {
        if (!meta || meta.totalPages <= 1) return null;

        return (
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
                <div className="text-xs text-white/40 font-medium">
                    Showing {(meta.page - 1) * meta.limit + 1} to {Math.min(meta.page * meta.limit, meta.totalItems)} of {meta.totalItems} results
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={!meta.hasPreviousPage}
                        className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-white"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => setPage(p => p + 1)}
                        disabled={!meta.hasNextPage}
                        className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-white"
                    >
                        Next
                    </button>
                </div>
            </div>
        );
    };

    if (loading && page === 1 && !txs.length) {
        return <div className="p-12 text-center text-white/30 text-sm animate-pulse">Loading transaction history...</div>;
    }

    // Desktop Table View - Polished
    const DesktopView = () => (
        <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-white/5 text-white/40 font-bold text-xs uppercase tracking-wider border-b border-white/5">
                    <tr>
                        <th className="px-6 py-5">Transaction Type</th>
                        <th className="px-6 py-5">Amount</th>
                        <th className="px-6 py-5">Status</th>
                        <th className="px-6 py-5 text-right">Date</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {loading ? (
                        <tr>
                            <td colSpan="4" className="px-6 py-8 text-center text-white/30 animate-pulse">
                                Refreshing data...
                            </td>
                        </tr>
                    ) : txs.map(tx => {
                        const meta = getTxMeta(tx);
                        return (
                            <tr key={tx.id} className="text-white hover:bg-white/5 transition-colors group">
                                <td className="px-6 py-5 flex items-center gap-3 font-medium">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${meta.colorClass}`}>
                                        <meta.Icon size={14} strokeWidth={3} />
                                    </div>
                                    {meta.label}
                                </td>
                                <td className="px-6 py-5 font-bold tracking-wide text-white/90">
                                    {meta.isCredit ? '+' : '-'}${Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-6 py-5">
                                    <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${tx.status === 'SUCCESS' ? 'bg-green-500/10 text-green-500' :
                                        tx.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500' :
                                            'bg-red-500/10 text-red-500'
                                        }`}>
                                        {tx.status}
                                    </span>
                                </td>
                                <td className="px-6 py-5 text-right text-white/40 font-mono text-xs">
                                    {new Date(tx.createdAt).toLocaleDateString()}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );

    // Mobile Card View - Polished
    const MobileView = () => (
        <div className="md:hidden space-y-3 p-4">
            {loading ? (
                <div className="p-8 text-center text-white/30 animate-pulse">Refreshing...</div>
            ) : txs.map(tx => {
                const meta = getTxMeta(tx);
                return (
                    <div key={tx.id} className="bg-white/5 p-4 rounded-xl border border-white/5 flex items-center justify-between hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${meta.colorClass}`}>
                                <meta.Icon size={18} />
                            </div>
                            <div>
                                <div className="font-bold text-white text-sm">{meta.label}</div>
                                <div className="text-xs text-white/30 font-mono">{new Date(tx.createdAt).toLocaleDateString()}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className={`font-bold text-sm mb-1 ${meta.isCredit ? 'text-green-400' : 'text-white'}`}>
                                {meta.isCredit ? '+' : '-'}${Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${tx.status === 'SUCCESS' ? 'bg-green-500/10 text-green-500' :
                                tx.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500' :
                                    'bg-red-500/10 text-red-500'
                                }`}>
                                {tx.status}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );

    return (
        <Card className="overflow-hidden">
            {txs.length > 0 || loading ? (
                <>
                    <DesktopView />
                    <MobileView />
                    <PaginationControls />
                </>
            ) : (
                <div className="p-12 text-center text-white/30 text-sm">
                    No transaction history found.
                </div>
            )}
        </Card>
    )
}
