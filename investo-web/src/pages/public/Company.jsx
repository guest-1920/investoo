import React from 'react';
import { COMPANY_CONTENT } from '../../data/content';
import { Card } from '../../components/ui/Card';
import { motion } from 'framer-motion';
import { MapPin, Globe, Award, ShieldCheck } from 'lucide-react';
import StatsSection from '../../components/sections/StatsSection';

export default function Company() {
    return (
        <div className="pt-32 pb-20 overflow-x-hidden">

            {/* Hero Section */}
            <section className="px-6 max-w-7xl mx-auto mb-32">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-4xl"
                >
                    <div className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-white/60 uppercase tracking-widest mb-6">
                        About Investoo
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight leading-tight">
                        Architecting the future of <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
                            Algorithmic Wealth.
                        </span>
                    </h1>
                    <p className="text-xl md:text-2xl text-white/50 leading-relaxed">
                        {COMPANY_CONTENT.mission}
                    </p>
                </motion.div>
            </section>

            {/* Stats Strip */}
            <div className="mb-32">
            <StatsSection />
            </div>

            {/* Values */}
            <section className="px-6 max-w-7xl mx-auto mb-32">
                <div className="mb-16">
                    <h2 className="text-3xl font-bold text-white mb-6">Our Principles</h2>
                    <div className="w-20 h-1 bg-blue-500 rounded-full" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {COMPANY_CONTENT.values.map((value, index) => (
                        <Card key={index} className="p-8 md:p-10 border-white/10 bg-[#0A0A0A]">
                            <h3 className="text-2xl font-bold text-white mb-4">{value.title}</h3>
                            <p className="text-white/50 leading-relaxed">
                                {value.description}
                            </p>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Leadership */}
            <section className="px-6 max-w-7xl mx-auto mb-32">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-6">Leadership Team</h2>
                        <div className="w-20 h-1 bg-violet-500 rounded-full" />
                    </div>
                    <p className="text-white/50 max-w-md text-right">
                        Veterans from BlackRock, Citadel, and Google building the next financial infrastructure.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {COMPANY_CONTENT.team.map((member, index) => (
                        <div key={index} className="group relative">
                            <div className="aspect-[3/4] rounded-2xl overflow-hidden mb-6 filter grayscale group-hover:grayscale-0 transition-all duration-500">
                                <img
                                    src={member.image}
                                    alt={member.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-1">{member.name}</h3>
                            <div className="text-sm font-medium text-blue-400 mb-2 uppercase tracking-wide">{member.role}</div>
                            <p className="text-sm text-white/40 leading-relaxed">
                                {member.bio}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Global Presence */}
            <section className="py-20 bg-[#080808] border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <div className="inline-flex items-center gap-2 text-white/40 mb-8 border border-white/10 px-4 py-2 rounded-full">
                        <Globe size={16} /> Global Infrastructure
                    </div>
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-8">Serving Institutional Clients <br /> in 30+ Jurisdictions</h2>
                    <div className="flex flex-wrap justify-center gap-4">
                        {['New York', 'London', 'Singapore', 'Dubai', 'Hong Kong', 'Tokyo', 'Zurich'].map(city => (
                            <div key={city} className="px-6 py-3 rounded-xl bg-white/5 text-white/80 font-medium hover:bg-white/10 hover:text-white transition-colors cursor-default border border-white/5">
                                {city}
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
