import React, { useEffect, useState } from 'react';
import rechargeService from '../../../services/recharge.service';
import withdrawalsService from '../../../services/withdrawals.service';
import { Card } from '../../ui/Card';
import { ArrowUpRight, ArrowDownLeft, Info, ChevronDown } from 'lucide-react';

export default function RequestsTab() {
    const [filter, setFilter] = useState('RECHARGE'); // 'RECHARGE' | 'WITHDRAWAL'

    // Separate state for each type
    const [recharges, setRecharges] = useState([]);
    const [rechargeMeta, setRechargeMeta] = useState(null);
    const [rechargePage, setRechargePage] = useState(1);
    const [rechargeLoading, setRechargeLoading] = useState(false);

    const [withdrawals, setWithdrawals] = useState([]);
    const [withdrawalMeta, setWithdrawalMeta] = useState(null);
    const [withdrawalPage, setWithdrawalPage] = useState(1);
    const [withdrawalLoading, setWithdrawalLoading] = useState(false);

    // Fetch recharges when page changes
    useEffect(() => {
        const fetchRecharges = async () => {
            setRechargeLoading(true);
            try {
                const res = await rechargeService.getMyRecharges({ page: rechargePage, limit: 5 });
                setRecharges(res.data?.data || []);
                setRechargeMeta(res.data?.meta || null);
            } catch (error) {
                console.error("Failed to fetch recharges", error);
            } finally {
                setRechargeLoading(false);
            }
        };
        fetchRecharges();
    }, [rechargePage]);

    // Fetch withdrawals when page changes
    useEffect(() => {
        const fetchWithdrawals = async () => {
            setWithdrawalLoading(true);
            try {
                const res = await withdrawalsService.getMyWithdrawals({ page: withdrawalPage, limit: 10 });
                setWithdrawals(res.data?.data || []);
                setWithdrawalMeta(res.data?.meta || null);
            } catch (error) {
                console.error("Failed to fetch withdrawals", error);
            } finally {
                setWithdrawalLoading(false);
            }
        };
        fetchWithdrawals();
    }, [withdrawalPage]);

    // Get current data based on filter
    const isRechargeView = filter === 'RECHARGE';
    const requests = isRechargeView ? recharges : withdrawals;
    const meta = isRechargeView ? rechargeMeta : withdrawalMeta;
    const loading = isRechargeView ? rechargeLoading : withdrawalLoading;
    const page = isRechargeView ? rechargePage : withdrawalPage;
    const setPage = isRechargeView ? setRechargePage : setWithdrawalPage;

    const getMeta = (req) => {
        return {
            label: isRechargeView ? 'Recharge' : 'Withdrawal',
            colorClass: isRechargeView ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500',
            Icon: isRechargeView ? ArrowDownLeft : ArrowUpRight
        };
    };

    const [dropdownOpen, setDropdownOpen] = useState(false);

    const FilterDropdown = () => (
        <div className="flex items-center justify-between p-4 border-b border-white/5">
            <div className="text-sm font-bold text-white/70">
                {isRechargeView ? 'Recharge Requests' : 'Withdrawal Requests'}
            </div>
            <div className="relative">
                <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm font-medium text-white cursor-pointer hover:bg-white/10 transition-colors focus:outline-none focus:ring-1 focus:ring-white/20"
                >
                    {isRechargeView ? 'Recharges' : 'Withdrawals'}
                    <ChevronDown size={14} className={`text-white/50 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-10"
                            onClick={() => setDropdownOpen(false)}
                        />
                        <div className="absolute right-0 top-full mt-1 z-20 bg-[#0A0A0A] border border-white/10 rounded-lg shadow-xl overflow-hidden min-w-[140px]">
                            <button
                                onClick={() => { setFilter('RECHARGE'); setDropdownOpen(false); }}
                                className={`w-full px-4 py-2.5 text-left text-sm font-medium transition-colors ${filter === 'RECHARGE'
                                    ? 'bg-white/10 text-white'
                                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                Recharges
                            </button>
                            <button
                                onClick={() => { setFilter('WITHDRAWAL'); setDropdownOpen(false); }}
                                className={`w-full px-4 py-2.5 text-left text-sm font-medium transition-colors ${filter === 'WITHDRAWAL'
                                    ? 'bg-white/10 text-white'
                                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                Withdrawals
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );

    const PaginationControls = () => {
        if (!meta || meta.totalPages <= 1) return null;

        return (
            <div className="flex items-center justify-between px-4 md:px-6 py-4 border-t border-white/5">
                <div className="text-xs text-white/40 font-medium">
                    Page {meta.page} of {meta.totalPages}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={!meta.hasPreviousPage || loading}
                        className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-white"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => setPage(p => p + 1)}
                        disabled={!meta.hasNextPage || loading}
                        className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-white"
                    >
                        Next
                    </button>
                </div>
            </div>
        );
    };

    const DesktopView = () => (
        <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-white/5 text-white/40 font-bold text-xs uppercase tracking-wider border-b border-white/5">
                    <tr>
                        <th className="px-6 py-5">Amount</th>
                        <th className="px-6 py-5">Status</th>
                        <th className="px-6 py-5">Admin Remark</th>
                        <th className="px-6 py-5 text-right">Date</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {loading ? (
                        <tr>
                            <td colSpan="4" className="px-6 py-8 text-center text-white/30 animate-pulse">
                                Loading...
                            </td>
                        </tr>
                    ) : requests.map(req => {
                        const reqMeta = getMeta(req);
                        return (
                            <tr key={req.id} className="text-white hover:bg-white/5 transition-colors group">
                                <td className="px-6 py-5 font-bold tracking-wide text-white/90">
                                    {Number(req.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT
                                </td>
                                <td className="px-6 py-5">
                                    <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${req.status === 'APPROVED' ? 'bg-green-500/10 text-green-500' :
                                        req.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500' :
                                            'bg-red-500/10 text-red-500'
                                        }`}>
                                        {req.status}
                                    </span>
                                </td>
                                <td className="px-6 py-5 text-white/60 text-xs max-w-xs truncate">
                                    {req.adminRemark || <span className="text-white/20 italic">—</span>}
                                </td>
                                <td className="px-6 py-5 text-right text-white/40 font-mono text-xs">
                                    {new Date(req.createdAt).toLocaleDateString()}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );

    const MobileView = () => (
        <div className="md:hidden space-y-3 p-4">
            {loading ? (
                <div className="p-8 text-center text-white/30 animate-pulse">Loading...</div>
            ) : requests.map(req => {
                const reqMeta = getMeta(req);
                return (
                    <div key={req.id} className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col gap-3 hover:bg-white/10 transition-colors">
                        <div className="flex items-center justify-between">
                            <div className="text-lg font-bold text-white tracking-tight">
                                {Number(req.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${req.status === 'APPROVED' ? 'bg-green-500/10 text-green-500' :
                                req.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500' :
                                    'bg-red-500/10 text-red-500'
                                }`}>
                                {req.status}
                            </span>
                        </div>

                        <div className="text-xs text-white/40 font-mono">
                            {new Date(req.createdAt).toLocaleDateString()}
                        </div>

                        {req.adminRemark && (
                            <div className="bg-black/20 p-2.5 rounded border border-white/5 flex gap-2 items-start">
                                <Info size={14} className="text-white/40 mt-0.5 shrink-0" />
                                <div className="text-xs text-white/70 leading-relaxed">
                                    <span className="font-bold text-white/50 block text-[9px] uppercase tracking-wider mb-0.5">Admin Remark</span>
                                    {req.adminRemark}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );

    return (
        <Card className="overflow-hidden">
            <FilterDropdown />
            {requests.length > 0 || loading ? (
                <>
                    <DesktopView />
                    <MobileView />
                    <PaginationControls />
                </>
            ) : (
                <div className="p-12 text-center text-white/30 text-sm">
                    {isRechargeView
                        ? 'No recharge requests found.'
                        : 'No withdrawal requests found.'
                    }
                </div>
            )}
        </Card>
    );
}
