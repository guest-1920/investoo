import React from 'react';
import { Gift } from 'lucide-react';

const RewardCard = ({ reward, onClaim, isClaimable, claimButtonText = 'Claim Reward', badge }) => {
    const imageUrl = reward.imageUrl?.startsWith('public/')
        ? `/${reward.imageUrl.replace('public/', '')}`
        : reward.imageUrl;

    return (
        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden hover:border-amber-500/50 hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.2)] transition-all duration-300 group relative flex flex-col h-full">

            {/* Image Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-white/5 to-transparent pt-12 pb-4 px-4 sm:px-6">
                {/* Badges Row - positioned at top */}
                <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-2 sm:p-3 z-20">
                    {/* Left badge (custom badge like "Refer X Users") */}
                    {badge && (
                        <span className="bg-white/10 backdrop-blur-md text-white text-[9px] sm:text-[10px] uppercase font-bold px-2 sm:px-3 py-1 rounded-full border border-white/10">
                            {badge}
                        </span>
                    )}
                </div>

                {/* Image Container */}
                <div className="flex items-center justify-center py-4 sm:py-6">
                    <div className="absolute inset-0 bg-amber-500/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={reward.name}
                            className="w-28 h-28 sm:w-36 sm:h-36 object-contain drop-shadow-2xl transform group-hover:scale-110 transition-transform duration-500 relative z-10"
                        />
                    ) : (
                        <div className="w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center">
                            <Gift size={48} className="text-white/20" />
                        </div>
                    )}
                </div>
            </div>

            {/* Content Section */}
            <div className="p-4 sm:p-5 flex flex-col gap-3 sm:gap-4 flex-1 border-t border-white/5">
                <div className="flex-1">
                    <h3 className="font-bold text-base sm:text-lg text-white mb-1 line-clamp-1 group-hover:text-amber-400 transition-colors">{reward.name}</h3>
                    <p className="text-xs sm:text-sm text-white/40 line-clamp-2 leading-relaxed">{reward.description || 'Exclusive reward for our valued investors.'}</p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-auto">
                    <div className="flex flex-col">
                        <span className="text-[9px] sm:text-[10px] text-white/30 font-bold uppercase tracking-wider">Value</span>
                        <div className="text-white font-bold text-sm sm:text-base font-mono">
                            {reward.value.toLocaleString()} USDT
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RewardCard;