import React, { useEffect, useRef } from 'react';
import { useMotionValue, animate } from 'framer-motion';

const stats = [
    {
        label: "Assets Under Management",
        start: 12.150,
        variance: 0.0005, // Tuned for realistic daily growth
        interval: 2000,
        type: 'growth',
        format: (v) => `$${v.toFixed(1)} M`
    },
    {
        label: "Active Investors",
        start: 42000,
        variance: 1, // steady organic user growth
        interval: 3000,
        type: 'growth',
        format: (v) => `${Math.floor(v).toLocaleString()}`
    },
    {
        label: "Markets Covered",
        start: 63,
        variance: 0.005, // Very slow, effectively stable for long periods
        interval: 5000,
        type: 'growth',
        format: (v) => `${Math.floor(v)}`
    },
    {
        label: "Average Yield",
        start: 8.42,
        variance: 0.04, // Fluctuation range
        interval: 2500,
        type: 'fluctuation',
        format: (v) => `${v.toFixed(2)}%`
    },
];

const AnimatedStat = ({ start, label, variance, interval, type = 'growth', format }) => {
    const value = useMotionValue(start);
    const ref = useRef(null);

    useEffect(() => {
        let currentTarget = start;

        const timer = setInterval(() => {
            let change;

            if (type === 'fluctuation') {
                // Random walk: -0.5 to 0.5 * variance
                // This simulates market volatility around the average
                change = (Math.random() - 0.5) * variance;

                // optional: add slight gravitational pull to start to prevent extreme drift?
                // currentTarget += change + (start - currentTarget) * 0.05
                // For simple visuals, pure random walk is acceptable
            } else {
                // Strict growth for cumulative metrics
                change = Math.random() * variance;
            }

            currentTarget += change;

            animate(value, currentTarget, {
                duration: interval / 1000,
                ease: "linear"
            });
        }, interval);

        return () => clearInterval(timer);
    }, [start, variance, interval, value, type]);

    useEffect(() => {
        const unsubscribe = value.on("change", (latest) => {
            if (ref.current) {
                ref.current.textContent = format(latest);
            }
        });
        return unsubscribe;
    }, [value, format]);

    return (
        <div className="px-4">
            <div
                ref={ref}
                className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tighter tabular-nums"
            >
                {format(start)}
            </div>
            <div className="text-sm font-medium text-white/40 uppercase tracking-widest">
                {label}
            </div>
        </div>
    );
};

export default function StatsSection() {
    return (
        <section className="py-24 border-y border-white/5 bg-zinc-950/50">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center divide-x divide-white/5">
                    {stats.map((stat, i) => (
                        <AnimatedStat key={i} {...stat} />
                    ))}
                </div>
            </div>
        </section>
    );
}
