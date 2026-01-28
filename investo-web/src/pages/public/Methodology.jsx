import React from 'react';
import { METHODOLOGY_CONTENT } from '../../data/content';
import { Card } from '../../components/ui/Card';
import { Database, Cpu, ShieldAlert, Zap, ArrowDown } from 'lucide-react';
import { motion } from 'framer-motion';

// Map icon strings to components
const IconMap = {
    Database: Database,
    Cpu: Cpu,
    ShieldAlert: ShieldAlert,
    Zap: Zap
};

export default function Methodology() {
    return (
        <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
            <div className="text-center mb-20">
                <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">The Nexus-7 Engine</h1>
                <p className="text-xl text-white/50 max-w-3xl mx-auto leading-relaxed">
                    Our systematic approach eliminates human bias. By combining high-frequency data ingestion with deep learning models, we identify and execute profitable opportunities in milliseconds.
                </p>
            </div>

            <div className="relative">
                {/* Connecting Line (Desktop) */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent -translate-x-1/2 hidden md:block" />

                <div className="space-y-12 md:space-y-24 relative z-10">
                    {METHODOLOGY_CONTENT.map((step, index) => {
                        const Icon = IconMap[step.icon];
                        const isEven = index % 2 === 0;

                        return (
                            <motion.div
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                key={index}
                                className={`flex flex-col md:flex-row items-center gap-8 md:gap-20 ${isEven ? 'md:flex-row' : 'md:flex-row-reverse text-right'}`}
                            >
                                {/* Text Side */}
                                <div className={`flex-1 ${isEven ? 'md:text-right' : 'md:text-left'}`}>
                                    <div className="inline-block p-3 rounded-2xl bg-white/5 border border-white/10 mb-6 md:hidden">
                                        <Icon size={32} className="text-white" />
                                    </div>
                                    <h3 className="text-3xl font-bold text-white mb-4">{step.title}</h3>
                                    <p className="text-white/50 leading-relaxed text-lg">{step.description}</p>
                                </div>

                                {/* Center Marker (Desktop Only) */}
                                <div className="w-12 h-12 rounded-full bg-black border-4 border-zinc-800 hidden md:flex items-center justify-center shrink-0 z-10 relative">
                                    <div className="w-4 h-4 rounded-full bg-white" />
                                </div>

                                {/* Illustration Side */}
                                <div className="flex-1 w-full">
                                    <Card className="p-8 md:p-12 flex items-center justify-center aspect-video group">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-white/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <Icon size={64} strokeWidth={1} className="text-white relative z-10" />
                                        </div>
                                    </Card>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            </div>

            <div className="mt-32 text-center">
                <h2 className="text-2xl font-bold text-white mb-8">Ready to deploy capital?</h2>
                <a href="/register" className="inline-flex items-center justify-center px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition-colors">
                    Start Institutional Trial
                </a>
            </div>
        </div>
    );
}
