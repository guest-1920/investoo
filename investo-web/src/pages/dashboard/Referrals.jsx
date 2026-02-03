import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { referralService } from '../../services/referral.service';
import RewardCard from '../../components/RewardCard';
import ClaimRewardModal from '../../components/ClaimRewardModal';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { Gift, TrendingUp, Share2, Award, Copy, CheckCircle, Users, Trophy, RefreshCcw, Loader2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

const Referrals = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [activeWindows, setActiveWindows] = useState([]);
    const [myProgress, setMyProgress] = useState([]);
    const [pendingClaims, setPendingClaims] = useState([]);
    const [referralStats, setReferralStats] = useState({ directReferrals: 0, totalReferrals: 0, totalEarned: 0, pendingRewards: 0 });
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedReward, setSelectedReward] = useState(null);
    const [claimSource, setClaimSource] = useState(null);
    const [copied, setCopied] = useState(false);

    // Polling logic for just-purchased items
    const pollIntervalRef = useRef(null);
    const pollCountRef = useRef(0);

    // Use user's actual referral code from profile
    const referralCode = user?.referralCode || 'Loading...';
    const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

    useEffect(() => {
        fetchData();

        // If we just got redirected from a purchase, poll for a few seconds
        // because the BullMQ job might be processing the fulfillment
        if (location.state?.justPurchased) {
            startPolling();
        }

        return () => {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        };
    }, [location.state?.justPurchased]);

    const startPolling = () => {
        if (pollIntervalRef.current) return;

        // Capture initial count to compare against
        const initialCount = pendingClaims?.length || 0;

        pollCountRef.current = 0;
        pollIntervalRef.current = setInterval(async () => {
            pollCountRef.current += 1;

            // Stop after 10 retries (20 seconds) - giving BullMQ more time
            if (pollCountRef.current > 10) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
                return;
            }

            const claims = await referralService.getPendingClaims();
            if (claims && claims.length > initialCount) {
                setPendingClaims(claims);
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
                toast.success('Reward detected! Ready to claim.');
            }
        }, 2000);
    };

    const fetchData = async (isManualRefresh = false) => {
        try {
            if (isManualRefresh) setIsRefreshing(true);
            else setLoading(true);
            const results = await Promise.allSettled([
                referralService.getActiveWindows(),
                referralService.getMyProgress(),
                referralService.getPendingClaims(),
                referralService.getReferralStats()
            ]);

            // Handle each result independently to prevent one failure from breaking everything
            if (results[0].status === 'fulfilled') setActiveWindows(results[0].value || []);
            if (results[1].status === 'fulfilled') setMyProgress(results[1].value || []);
            if (results[2].status === 'fulfilled') setPendingClaims(results[2].value || []);
            if (results[3].status === 'fulfilled') setReferralStats(results[3].value || { directReferrals: 0, totalReferrals: 0, totalEarned: 0, pendingRewards: 0 });

        } catch (error) {
            console.error('Failed to fetch referral data', error);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        toast.success('Referral link copied!');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClaimRewardClick = (fulfillment) => {
        setSelectedReward(fulfillment.reward);
        setClaimSource({ id: fulfillment.sourcePlanId, type: 'PLAN' });
    };

    const handleWindowClaimClick = (reward, windowId) => {
        setSelectedReward(reward);
        setClaimSource({ id: windowId, type: 'WINDOW' });
    };

    const handleClaimSuccess = () => {
        setSelectedReward(null);
        setClaimSource(null);
        fetchData();
        toast.success('Reward claim initiated successfully!');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-white/50 animate-pulse">Loading referral dashboard...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6 sm:space-y-8 md:space-y-10">
            {/* Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2 tracking-tight">Referrals</h1>
                <p className="text-sm sm:text-base text-white/50">Invite friends and earn rewards together.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white/5 text-white/60 flex items-center justify-center border border-white/10">
                            <Users size={22} />
                        </div>
                        <div>
                            <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold mb-1">Direct Referrals</p>
                            <p className="text-2xl font-bold text-white">{referralStats.directReferrals}</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white/5 text-white/60 flex items-center justify-center border border-white/10">
                            <Trophy size={22} />
                        </div>
                        <div>
                            <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold mb-1">Total Referrals</p>
                            <p className="text-2xl font-bold text-white">{referralStats.totalReferrals}</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white/5 text-white/60 flex items-center justify-center border border-white/10">
                            <Gift size={22} />
                        </div>
                        <div>
                            <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold mb-1">Rewards Earned</p>
                            <p className="text-2xl font-bold text-white">{referralStats.totalEarned.toLocaleString()} USDT</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white/5 text-white/60 flex items-center justify-center border border-white/10">
                            <Award size={22} />
                        </div>
                        <div>
                            <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold mb-1">Pending Claims</p>
                            <p className="text-2xl font-bold text-white">{pendingClaims.length}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Referral Link Section */}
            <Card className="p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                        <Share2 size={18} className="sm:w-5 sm:h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm sm:text-base">Your Referral Link</h3>
                        <p className="text-[10px] sm:text-xs text-white/40">Share with friends to earn rewards</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <div className="flex-1 bg-black/40 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 border border-white/5 flex items-center">
                        <span className="text-xs sm:text-sm text-white/60 truncate font-mono">{referralLink}</span>
                    </div>
                    <button
                        onClick={handleCopy}
                        className={`px-4 py-2.5 sm:py-0 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 bg-white text-black hover:bg-white/90`}
                    >
                        {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                </div>

            </Card>


            {/* Pending Claims Section */}
            {(pendingClaims.length > 0 || isRefreshing) && (
                <section>
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center border border-green-500/20">
                                <Gift size={18} className="sm:w-5 sm:h-5" />
                            </div>
                            <h2 className="text-lg sm:text-xl font-bold text-white">Ready to Claim</h2>
                        </div>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => fetchData(true)}
                            disabled={isRefreshing}
                            className="text-white/40 hover:text-white"
                        >
                            {isRefreshing ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <RefreshCcw size={16} />
                            )}
                            <span className="ml-2 hidden sm:inline">Refresh</span>
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                        {pendingClaims.map(fulfillment => (
                            <div key={fulfillment.id} className="relative group">
                                <RewardCard
                                    reward={fulfillment.reward}
                                    isClaimable={true}
                                    claimButtonText="Claim Reward"
                                    onClaim={() => handleClaimRewardClick(fulfillment)}
                                />
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Active Campaigns Section */}
            {myProgress.length > 0 && (
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-white/5 text-white/60 flex items-center justify-center border border-white/10">
                            <TrendingUp size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-white">Your Progress</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {myProgress.map((item) => {
                            const { window, progress } = item;
                            const isCompleted = progress?.status === 'COMPLETED';
                            const percent = Math.min(100, ((progress?.qualifiedReferrals || 0) / window.targetReferralCount) * 100);

                            return (
                                <Card key={item.window.id} className="p-6" hover>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-lg text-white mb-1">{window.name}</h3>
                                            <p className="text-sm text-white/50">
                                                Goal: {window.targetReferralCount} Referrals
                                            </p>
                                        </div>
                                        {/* <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${isCompleted
                                            ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                            : 'bg-white/5 text-white/60 border-white/10'
                                            }`}>
                                            {isCompleted ? 'Completed' : 'In Progress'}
                                        </span> */}
                                    </div>

                                    <div className="mb-4">
                                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2 text-white/40">
                                            <span>Progress</span>
                                            <span className="text-white">{progress?.qualifiedReferrals || 0} / {window.targetReferralCount}</span>
                                        </div>
                                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-white transition-all duration-500"
                                                style={{ width: `${percent}%` }}
                                            />
                                        </div>
                                    </div>

                                    {window.reward && (
                                        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                                                    {window.reward.imageUrl ? (
                                                        <img
                                                            src={window.reward.imageUrl.startsWith('public/') ? `/${window.reward.imageUrl.replace('public/', '')}` : window.reward.imageUrl}
                                                            alt="Reward"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <Gift size={16} className="text-white/30" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-white">{window.reward.name}</p>
                                                    <p className="text-xs text-white/50">{window.reward.value} USDT</p>
                                                </div>
                                            </div>

                                            {isCompleted && (
                                                <button
                                                    onClick={() => handleWindowClaimClick(window.reward, window.id)}
                                                    className="px-4 py-2 bg-white text-black text-xs font-bold uppercase tracking-wide rounded-lg hover:bg-white/90 transition-colors"
                                                >
                                                    Claim
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Referral Goals Section */}
            <section>
                <div className="flex items-center gap-3 mb-4 sm:mb-6">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                        <Trophy size={18} className="sm:w-5 sm:h-5" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-white">Referral Goals</h2>
                </div>

                {activeWindows.length === 0 ? (
                    <Card className="p-8 sm:p-12 text-center">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trophy size={24} className="sm:w-7 sm:h-7 text-amber-500/50" />
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-white mb-2">No Active Goals</h3>
                        <p className="text-sm sm:text-base text-white/50 max-w-sm mx-auto">
                            There are no referral campaigns available right now. Check back later for exciting new opportunities!
                        </p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                        {activeWindows.map(window => (
                            window.reward ? (
                                <RewardCard
                                    key={window.id}
                                    reward={window.reward}
                                    isClaimable={false}
                                    claimButtonText="View Details"
                                    onClaim={() => { }}
                                    badge={`Refer ${window.targetReferralCount} Users`}
                                />
                            ) : null
                        ))}
                    </div>
                )}
            </section>

            {/* Claim Modal */}
            {selectedReward && (
                <ClaimRewardModal
                    isOpen={!!selectedReward}
                    onClose={() => setSelectedReward(null)}
                    reward={selectedReward}
                    source={claimSource}
                    onSuccess={handleClaimSuccess}
                />
            )}
        </div>
    );
};

export default Referrals;
