import React from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Check, Shield } from 'lucide-react';

/**
 * Reusable PlanCard component for displaying investment plans
 * Used in both dashboard Plans page and public PlansPreview section
 */
export default function PlanCard({
    plan,
    onSelect,
    buttonText = 'Start Investment',
    buttonVariant = 'primary',
    showPrincipalTax = false,
    principalTax = 0
}) {
    // Calculate percentage based on daily fixed return amount vs price
    const dailyReturnPercent = plan.price ? ((Number(plan.dailyReturn) / Number(plan.price)) * 100).toFixed(2) : '0.00';

    return (
        <Card hover className="p-4 sm:p-5 lg:p-6 flex flex-col relative overflow-hidden group border-white/10 hover:border-white/20 gap-4 sm:gap-5 lg:gap-6 h-full">
            {/* Decorative Shield */}
            <div className="absolute -top-10 -right-10 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity rotate-12 hidden sm:block">
                <Shield size={180} />
            </div>

            {/* Header Section */}
            <div className="relative z-10 w-full">
                {/* Lock-in Badge */}
                <div className="mb-3 sm:mb-4">
                    <div className="inline-block px-2 sm:px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[9px] sm:text-[10px] font-bold text-white/60 uppercase tracking-widest">
                        {plan.validity} Days Lock-in
                    </div>
                </div>

                {/* Plan Name & Description */}
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2 tracking-tight">{plan.name}</h3>
                <p className="text-xs sm:text-sm text-white/50 leading-relaxed mb-4 sm:mb-5 line-clamp-2">{plan.description}</p>

                {/* Reward Section */}
                {plan.reward && (
                    <div className="mb-4 sm:mb-5 relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-500/20 via-black/40 to-black/60 border border-amber-500/30 p-3 sm:p-4 flex flex-col items-center text-center gap-2 sm:gap-3 transition-all hover:border-amber-500/50 hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.3)]">
                        {/* Free Gift Badge */}
                        <div className="absolute top-0 right-0">
                            <div className="bg-amber-500 text-black text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-2 sm:px-3 py-0.5 sm:py-1 rounded-bl-lg shadow-lg">
                                Free Gift
                            </div>
                        </div>

                        {/* Reward Image */}
                        <div className="relative w-full flex justify-center py-2 sm:py-3">
                            <div className="absolute inset-0 bg-amber-500 blur-3xl opacity-15 rounded-full group-hover:opacity-30 transition-opacity"></div>
                            {plan.reward.imageUrl && (
                                <img
                                    src={plan.reward.imageUrl.startsWith('public/') ? `/${plan.reward.imageUrl.replace('public/', '')}` : plan.reward.imageUrl}
                                    className="relative w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 object-contain drop-shadow-2xl transform group-hover:scale-105 transition-transform duration-500"
                                    alt={plan.reward.name}
                                />
                            )}
                        </div>

                        {/* Reward Details */}
                        <div className="flex flex-col z-10 w-full">
                            <span className="text-sm sm:text-base lg:text-lg font-bold text-white leading-tight mb-1 group-hover:text-amber-100 transition-colors">
                                {plan.reward.name}
                            </span>
                            <div className="h-px w-10 sm:w-12 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mx-auto mb-1"></div>
                            <span className="text-[10px] sm:text-xs text-white/50">
                                Included with investment
                            </span>
                            <span className="text-[9px] sm:text-[10px] font-mono text-amber-500/80 mt-0.5">
                                Value: {plan.reward.value} USDT
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Action Section */}
            <div className="relative z-10 w-full flex flex-col flex-1">
                {/* Daily Yield */}
                <div className="flex items-end gap-1 sm:gap-2 mb-3 sm:mb-4 lg:mb-5">
                    <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tighter">
                        {dailyReturnPercent}%
                    </span>
                    <span className="text-[10px] sm:text-xs text-green-500 font-bold mb-1 uppercase tracking-wide">daily yields</span>
                </div>

                {/* Features List */}
                <div className="space-y-2 sm:space-y-2.5 mb-4 sm:mb-5 flex-1">
                    <FeatureRow text={`Min Deposit: ${parseFloat(plan.price).toLocaleString()} USDT`} />
                    <FeatureRow text={`Daily Return: ${parseFloat(plan.dailyReturn).toLocaleString()} USDT`} />
                    <FeatureRow text={showPrincipalTax && principalTax > 0
                        ? `Principal returned with ${principalTax}% tax`
                        : 'Principal returned at maturity'
                    } />
                    <FeatureRow text="24/7 Dedicated Support" />
                </div>

                {/* CTA Button */}
                <Button onClick={onSelect} className="w-full mt-auto" variant={buttonVariant}>
                    {buttonText}
                </Button>
            </div>
        </Card>
    );
}

function FeatureRow({ text }) {
    return (
        <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-white/70">
            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center shrink-0">
                <Check size={8} className="sm:w-2.5 sm:h-2.5" strokeWidth={3} />
            </div>
            <span className="line-clamp-1">{text}</span>
        </div>
    );
}
