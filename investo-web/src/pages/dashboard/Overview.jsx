import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PerformanceChart from '../../components/charts/PerformanceChart';
import { format, subDays, subMonths, subYears } from 'date-fns';
import authService from '../../services/auth.service';
import walletService from '../../services/wallet.service';
import subscriptionsService from '../../services/subscriptions.service';
import { Card } from '../../components/ui/Card';
import { DollarSign, TrendingUp, Activity, ArrowUpRight, ArrowDownLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const GRAPH_FILTERS = [
    { label: '1W', days: 7, groupBy: 'day' },
    { label: '1M', days: 30, groupBy: 'day' },
    { label: '1Y', days: 365, groupBy: 'week' },
    { label: 'ALL', days: null, groupBy: 'month' },
];

export default function Overview() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({ balance: 0, profit: 0, activePlans: 0 });
    const [recentTx, setRecentTx] = useState([]);
    const [graphData, setGraphData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [graphLoading, setGraphLoading] = useState(false);
    const [graphFilter, setGraphFilter] = useState('1M');

    // Cache for graph data per filter to avoid re-fetching
    const graphCache = useRef({});

    // Fetch graph data based on filter (with caching)
    const fetchGraphData = useCallback(async (filterLabel, skipCache = false) => {
        // Check cache first (unless skipCache is true)
        if (!skipCache && graphCache.current[filterLabel]) {
            setGraphData(graphCache.current[filterLabel]);
            return;
        }

        setGraphLoading(true);
        try {
            const filter = GRAPH_FILTERS.find(f => f.label === filterLabel);
            const params = {};

            if (filter.days) {
                const sinceDate = subDays(new Date(), filter.days);
                params.since = format(sinceDate, 'yyyy-MM-dd');
            }
            if (filter.groupBy) {
                params.groupBy = filter.groupBy;
            }

            const dailyReturns = await subscriptionsService.getMyDailyReturns(params);

            // Process cumulative profit from aggregated data
            let cumulative = 0;
            const processedData = (dailyReturns.data || []).map(item => {
                cumulative += Number(item.amount);
                return {
                    date: item.createdAt,
                    value: cumulative,
                    formattedDate: format(new Date(item.createdAt), filterLabel === 'ALL' || filterLabel === '1Y' ? 'MMM yy' : 'MMM dd')
                };
            });

            // Store in cache
            graphCache.current[filterLabel] = processedData;
            setGraphData(processedData);
        } catch (error) {
            console.error("Failed to fetch graph data", error);
        } finally {
            setGraphLoading(false);
        }
    }, []);

    // Initial data fetch
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [profile, subscriptions, transactions, lifetimeReturns] = await Promise.all([
                    authService.getProfile(),
                    subscriptionsService.getMySubscriptions(),
                    walletService.getTransactions({ limit: 5 }),
                    subscriptionsService.getMyDailyReturns() // Fetch all-time returns for lifetime profit
                ]);

                setUser(profile);
                const activePlansCount = subscriptions.data?.length || 0;
                const lifetimeProfit = lifetimeReturns.summary?.totalProfit || 0;

                setStats({
                    balance: Number(profile.walletBalance),
                    profit: lifetimeProfit,
                    activePlans: activePlansCount
                });

                setRecentTx(transactions.data || []);

                // Fetch graph data with default filter
                await fetchGraphData('1M');

            } catch (error) {
                console.error("Failed to load dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [fetchGraphData]);

    // Handle filter change
    const handleFilterChange = (filterLabel) => {
        setGraphFilter(filterLabel);
        fetchGraphData(filterLabel);
    };

    const getTxMeta = (tx) => {
        const isCredit = tx.type === 'CREDIT';

        let label = tx.source;
        switch (tx.source) {
            case 'RECHARGE': label = 'Deposit'; break;
            case 'WITHDRAW': label = 'Withdrawal'; break;
            case 'PURCHASE': label = 'Plan Purchase'; break;
            case 'REFERRAL_BONUS': label = 'Referral Bonus'; break;
            case 'DAILY_RETURN': label = 'Daily Return'; break;
            case 'REWARD': label = 'REWARD'; break;
            default: label = tx.source?.replace('_', ' ') || (isCredit ? 'Credit' : 'Debit');
        }

        return {
            isCredit,
            label,
            colorClass: isCredit ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500',
            Icon: isCredit ? ArrowDownLeft : ArrowUpRight
        };
    };


    if (loading) return (
        <div className="space-y-8 animate-pulse">
            <div className="h-20 bg-white/5 rounded-xl w-full"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="h-32 bg-white/5 rounded-xl"></div>
                <div className="h-32 bg-white/5 rounded-xl"></div>
                <div className="h-32 bg-white/5 rounded-xl"></div>
            </div>
            <div className="h-96 bg-white/5 rounded-xl"></div>
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-1">
                        Welcome back, <span className="text-white/60">{user?.name}</span>
                    </h1>
                    <p className="text-white/40 text-sm">Here is your portfolio performance overview.</p>
                </div>
                <div className="text-right hidden md:block">
                    <div className="text-xs font-bold text-white/30 uppercase tracking-widest mb-1">Last Update</div>
                    <div className="text-white text-sm font-medium">{new Date().toLocaleTimeString()}</div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard
                    label="Total Balance"
                    value={`${stats.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`}
                    trend="Available funds"
                    icon={DollarSign}
                    color="text-white"
                    bg="bg-white/10"
                />
                <StatCard
                    label="Total Profit"
                    value={`${stats.profit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`}
                    trend="Lifetime earnings"
                    icon={TrendingUp}
                    color="text-green-500"
                    bg="bg-green-500/10"
                />
                <StatCard
                    label="Active Plans"
                    value={stats.activePlans}
                    trend="Generating yields"
                    icon={Activity}
                    color="text-blue-500"
                    bg="bg-blue-500/10"
                />
            </div>

            {/* Performance Chart */}
            <Card className="p-0 overflow-hidden bg-gradient-to-b from-white/5 to-transparent border-white/5">
                <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between bg-black/20 backdrop-blur-sm">
                    <div>
                        <h3 className="text-lg font-bold text-white mb-1">Performance Analysis</h3>
                        <p className="text-xs text-white/40">Cumulative profit growth over time</p>
                    </div>
                    <div className="flex bg-black/40 p-1 rounded-lg border border-white/5">
                        {GRAPH_FILTERS.map(({ label }) => (
                            <button
                                key={label}
                                onClick={() => handleFilterChange(label)}
                                disabled={graphLoading}
                                className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${graphFilter === label
                                    ? 'bg-white/10 text-white'
                                    : 'text-white/40 hover:bg-white/5 hover:text-white/60'
                                    } ${graphLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <PerformanceChart
                    data={graphData}
                    loading={graphLoading}
                    className="mt-4"
                />
            </Card>

            {/* Recent Activity */}
            <Card>
                <div className="p-6 md:px-8 md:py-6 border-b border-white/5 flex items-center justify-between">
                    <h3 className="font-bold text-white">Recent Transactions</h3>
                    <button
                        onClick={() => navigate('/dashboard/wallet?tab=history')}
                        className="text-xs font-bold text-white/40 hover:text-white flex items-center gap-1 transition-colors"
                    >
                        View All <ChevronRight size={12} />
                    </button>
                </div>
                <div className="p-2">
                    {recentTx.map((tx) => {
                        const txMeta = getTxMeta(tx);
                        return (
                            <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-white/5 rounded-xl transition-colors cursor-pointer group">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${txMeta.colorClass}`}>
                                        <txMeta.Icon size={18} />
                                    </div>
                                    <div>
                                        <div className="text-white font-bold text-sm mb-0.5">{txMeta.label}</div>
                                        <div className="text-xs text-white/40">{new Date(tx.createdAt).toLocaleDateString()}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-white text-sm mb-1">
                                        {txMeta.isCredit ? '+' : '-'}{Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                                    </div>
                                    <ActivityStatus status={tx.status || 'COMPLETED'} />
                                </div>
                            </div>
                        );
                    })}
                    {recentTx.length === 0 && <div className="text-white/30 text-center py-8 text-sm">No recent interactions</div>}
                </div>
            </Card>

            {/* footer-section */}
        </div>
    );
}

function StatCard({ label, value, trend, icon: Icon, color, bg }) {
    return (
        <Card hover className="p-6 md:p-8 flex items-center gap-6 group cursor-default">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${bg} ${color} group-hover:scale-110 transition-transform`}>
                <Icon size={28} />
            </div>
            <div>
                <div className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">{label}</div>
                <div className="text-2xl font-bold text-white mb-1">{value}</div>
                <div className="text-[10px] font-bold text-white/30 flex items-center gap-2">
                    <span className={trend.includes('Profit') ? 'text-green-500' : 'text-white/30'}>{trend}</span>
                </div>
            </div>
        </Card>
    )
}

function ActivityStatus({ status }) {
    const styles = {
        APPROVED: 'bg-green-500/10 text-green-500',
        COMPLETED: 'bg-green-500/10 text-green-500',
        PENDING: 'bg-yellow-500/10 text-yellow-500',
        REJECTED: 'bg-red-500/10 text-red-500',
        FAILED: 'bg-red-500/10 text-red-500'
    };

    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${styles[status] || styles.PENDING}`}>
            {status}
        </span>
    )
}

