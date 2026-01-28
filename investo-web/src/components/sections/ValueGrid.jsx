import React from 'react';
import { ShieldCheck, Zap, Lock, BarChart3, PieChart, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
    {
        icon: ShieldCheck,
        title: "Bank-Grade Security",
        desc: "Your assets are protected by SOC 2 Type II certified infrastructure and military-grade encryption."
    },
    {
        icon: Zap,
        title: "Real-Time Execution",
        desc: "Direct market access ensures your portfolio rebalances instantly in response to market shifts."
    },
    {
        icon: Lock,
        title: "Private Ownership",
        desc: "Full segregation of assets. You own the underlying securities, not a derivative claim."
    },
    {
        icon: BarChart3,
        title: "Advanced Analytics",
        desc: "Institutional tools simplified. Visualize exposure, attribution, and risk in real-time."
    },
    {
        icon: PieChart,
        title: "Smart Diversification",
        desc: "Automated exposure across asset classes, geographies, and sectors to minimize volatility."
    },
    {
        icon: Wallet,
        title: "Liquidity First",
        desc: "No lock-up periods. Access your capital whenever you need it without penalty."
    }
];

export default function ValueGrid() {
    return (
        <section className="py-24 md:py-32 bg-background relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/[0.02] rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                        Institutional Power. <br />
                        <span className="text-white/50">Personal Control.</span>
                    </h2>
                    <p className="text-lg text-white/60">
                        We've dismantled the barriers between retail investors and elite wealth management strategies.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, i) => (
                        <div key={i} className="p-8 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-colors group">
                            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform">
                                <feature.icon size={24} />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                            <p className="text-white/50 leading-relaxed text-sm">
                                {feature.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
