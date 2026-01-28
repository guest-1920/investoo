import React, { useEffect, useState } from 'react';
import { plansService } from '../../services/plans.service';
import settingsService from '../../services/settings.service';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Check, Shield, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MyIndexes() {
    const [subscriptions, setSubscriptions] = useState([]);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [subsData, settingsData] = await Promise.all([
                plansService.getMySubscriptions(),
                settingsService.getFinancialSettings()
            ]);
            setSubscriptions(subsData || []);
            setSettings(settingsData);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-white/50 p-8">Loading portfolio...</div>;
    }

    if (subscriptions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                    <Shield size={40} className="text-white/20" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">No Active Indexes</h2>
                    <p className="text-white/50 max-w-md">You don't have any active investments yet. Start building your portfolio today.</p>
                </div>
                <Button onClick={() => navigate('/dashboard/plans')}>
                    Browse Indexes
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">My Portfolio</h1>
                    <p className="text-white/50">Manage your active index subscriptions and track performance.</p>
                </div>
                <Button variant="secondary" onClick={() => navigate('/dashboard/plans')}>
                    Add New Index
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {subscriptions.map((sub) => (
                    <ActiveIndexCard key={sub.id} subscription={sub} settings={settings} />
                ))}
            </div>
        </div>
    );
}

function ActiveIndexCard({ subscription, settings }) {
    const { plan, startDate, endDate } = subscription;

    // Calculate progress
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const now = new Date().getTime();
    const totalDuration = end - start;
    const elapsed = now - start;
    const progress = Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);

    // Calculate days remaining
    const daysRemaining = Math.max(Math.ceil((end - now) / (1000 * 60 * 60 * 24)), 0);

    // Formats
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric'
    });

    const dailyReturnPercent = ((plan.dailyReturn / plan.price) * 100).toFixed(1);

    return (
        <Card className="p-6 md:p-8 border-white/10 hover:border-white/20 transition-all">
            <div className="flex flex-col lg:flex-row gap-8 lg:items-center">

                {/* ID & Basic Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-bold uppercase tracking-wider">
                            Active
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-1">{plan.name}</h3>
                    <p className="text-sm text-white/50 mb-4">{plan.description}</p>

                    {plan.reward && (
                        <div className="flex items-center gap-3 p-2 pr-4 rounded-lg bg-gradient-to-r from-amber-500/10 to-transparent border-l-2 border-amber-500 w-fit">
                            {plan.reward.imageUrl && (
                                <div className="w-10 h-10 rounded bg-black/20 flex items-center justify-center overflow-hidden">
                                    <img
                                        src={plan.reward.imageUrl.startsWith('public/') ? `/${plan.reward.imageUrl.replace('public/', '')}` : plan.reward.imageUrl}
                                        className="w-full h-full object-contain"
                                        alt="Reward"
                                    />
                                </div>
                            )}
                            <div className="flex flex-col">
                                <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider leading-none mb-1">Includes Free Gift</span>
                                <span className="text-xs text-white/90 font-medium leading-none">{plan.reward.name}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Metrics Grid */}
                <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div>
                        <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Invested</div>
                        <div className="text-xl font-bold text-white">{parseFloat(plan.price).toLocaleString()} USDT</div>
                    </div>
                    <div>
                        <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Daily Return</div>
                        <div className="text-xl font-bold text-green-400">
                            {parseFloat(plan.dailyReturn).toLocaleString()} USDT
                            <span className="text-sm text-white/40 ml-1 font-normal">({dailyReturnPercent}%)</span>
                        </div>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Expires In</div>
                        <div className="text-xl font-bold text-white">{daysRemaining} Days</div>
                    </div>
                </div>

                {/* Timeline / Progress */}
                <div className="flex-1 w-full lg:max-w-xs space-y-3">
                    <div className="flex justify-between text-xs text-white/50">
                        <span>Started {formatDate(startDate)}</span>
                        <span>Maturity {formatDate(endDate)}</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-green-500/50 rounded-full transition-all duration-1000"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/40">
                        <TrendingUp size={12} />
                        <span>
                            Principal returned at maturity
                            {settings?.principalTax > 0 ? ` with ${settings.principalTax}% tax deduction` : ''}
                        </span>
                    </div>
                </div>

            </div>
        </Card>
    );
}
