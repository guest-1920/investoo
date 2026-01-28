
import { useEffect, useState } from 'react';
import api from '../../services/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import './OverviewPage.css';

interface DashboardSummary {
    totalUsers: number;
    totalRecharges: number;
    totalWithdrawals: number;
    totalPlanValue: number;
    totalSubscriptions: number;
    totalReferralRewards: number;
}

interface ChartData {
    date: string;
    newUsers: number;
    recharges: number;
    withdrawals: number;
}

export const OverviewPage = () => {
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [charts, setCharts] = useState<ChartData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [summaryRes, chartsRes] = await Promise.all([
                    api.get('/dashboard/summary'),
                    api.get('/dashboard/charts')
                ]);
                setSummary(summaryRes.data);
                setCharts(chartsRes.data);
            } catch (e) {
                console.error("Failed to load dashboard", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-muted">Loading dashboard analytics...</div>
            </div>
        );
    }

    // Custom Tooltip for Recharts
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="chart-tooltip">
                    <p className="tooltip-date">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} style={{ color: entry.color }}>
                            {entry.name}: {entry.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="overview-page fade-in">

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <h3>Total Users</h3>
                    <p className="stat-value">{summary?.totalUsers?.toLocaleString()}</p>
                    <div className="stat-trend positive">
                        <span>Verified Users</span>
                    </div>
                </div>
                <div className="stat-card">
                    <h3>Total Recharges</h3>
                    <p className="stat-value text-success">{summary?.totalRecharges?.toLocaleString()} USDT</p>
                    <div className="stat-trend positive">
                        <span>Deposited</span>
                    </div>
                </div>
                <div className="stat-card">
                    <h3>Total Withdrawals</h3>
                    <p className="stat-value text-error">{summary?.totalWithdrawals?.toLocaleString()} USDT</p>
                    <div className="stat-trend negative">
                        <span>Paid Out</span>
                    </div>
                </div>
                <div className="stat-card">
                    <h3>Total Subscription Revenue</h3>
                    <p className="stat-value text-secondary">{summary?.totalPlanValue?.toLocaleString()} USDT</p>
                    <div className="stat-trend positive">
                        <span>{summary?.totalSubscriptions} Sold</span>
                    </div>
                </div>
                <div className="stat-card">
                    <h3>Referral Rewards</h3>
                    <p className="stat-value text-warning">{summary?.totalReferralRewards?.toLocaleString()} USDT</p>
                    <div className="stat-trend positive">
                        <span>Dispersed</span>
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="charts-grid mt-8">

                <div className="chart-wrapper">
                    <div className="chart-header">
                        <h3 className="font-semibold text-lg">Financial Flow</h3>
                        <span className="text-xs text-secondary">Last 30 Days</span>
                    </div>
                    <div style={{ height: 350, width: '100%' }}>
                        <ResponsiveContainer>
                            <AreaChart data={charts} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRecharge" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorWithdrawal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }}
                                    tickLine={false}
                                    axisLine={false}
                                    minTickGap={30}
                                    tickFormatter={(value) => {
                                        const date = new Date(value);
                                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                    }}
                                />
                                <YAxis
                                    tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${value / 1000}k USDT`}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend iconType="circle" />
                                <Area type="monotone" dataKey="recharges" stroke="#10b981" fillOpacity={1} fill="url(#colorRecharge)" name="Recharges" strokeWidth={2} />
                                <Area type="monotone" dataKey="withdrawals" stroke="#ef4444" fillOpacity={1} fill="url(#colorWithdrawal)" name="Withdrawals" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-wrapper">
                    <div className="chart-header">
                        <h3 className="font-semibold text-lg">Daily New Users</h3>
                        <span className="text-xs text-secondary">Last 30 Days</span>
                    </div>
                    <div style={{ height: 350, width: '100%' }}>
                        <ResponsiveContainer>
                            <BarChart data={charts} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }}
                                    tickLine={false}
                                    axisLine={false}
                                    minTickGap={30}
                                    tickFormatter={(value) => {
                                        const date = new Date(value);
                                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                    }}
                                />
                                <YAxis
                                    tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="newUsers" fill="#3b82f6" name="New Users" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div >
    );
};
