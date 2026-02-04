import React, { useEffect, useRef, useState } from 'react';
import { useMotionValue, animate } from 'framer-motion';
import client from '../../api/client';

const AnimatedStat = ({ value, label, format }) => {
    const displayValue = useMotionValue(0);
    const ref = useRef(null);

    useEffect(() => {
        const controls = animate(displayValue, value, {
            duration: 1.5,
            ease: "easeOut"
        });
        return controls.stop;
    }, [value]);

    useEffect(() => {
        const unsubscribe = displayValue.on("change", (latest) => {
            if (ref.current) {
                ref.current.textContent = format(latest);
            }
        });
        return unsubscribe;
    }, [displayValue, format]);

    return (
        <div className="px-4">
            <div
                ref={ref}
                className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tighter tabular-nums"
            >
                {format(value)}
            </div>
            <div className="text-sm font-medium text-white/40 uppercase tracking-widest">
                {label}
            </div>
        </div>
    );
};

export default function StatsSection() {
    const [stats, setStats] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await client.get('/stats');
                setStats(data);
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            }
        };

        // Initial fetch
        fetchStats();

        // Poll for updates every 5 seconds to match backend cron
        const intervalId = setInterval(fetchStats, 5000);

        return () => clearInterval(intervalId);
    }, []);

    if (!stats) {
        return (
            <section className="py-24 border-y border-white/5 bg-zinc-950/50">
                <div className="max-w-7xl mx-auto px-6 h-32 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
            </section>
        );
    }

    const statsConfig = [
        {
            label: "Assets Under Management",
            value: stats.aum,
            format: (v) => `$${v.toFixed(2)}M`
        },
        {
            label: "Active Investors",
            value: stats.activeInvestors,
            format: (v) => `${Math.floor(v).toLocaleString()}`
        },
        {
            label: "Markets Covered",
            value: stats.marketsCovered,
            format: (v) => `${Math.floor(v)}`
        },
        {
            label: "Average Yield",
            value: stats.averageYield,
            format: (v) => `${v.toFixed(2)}%`
        },
    ];

    return (
        <section className="py-24 border-y border-white/5 bg-zinc-950/50">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center divide-x divide-white/5">
                    {statsConfig.map((stat, i) => (
                        <AnimatedStat key={i} {...stat} />
                    ))}
                </div>
            </div>
        </section>
    );
}