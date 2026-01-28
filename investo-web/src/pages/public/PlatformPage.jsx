import React from 'react';
import { PLATFORM_CONTENT } from '../../data/content';
import { Card } from '../../components/ui/Card';
import { Globe, Activity, BarChart2, RefreshCw, TrendingDown, Layers, ShieldAlert, Zap, Grid } from 'lucide-react';

const IconMap = { Globe, Activity, BarChart2, RefreshCw, TrendingDown, Layers, ShieldAlert, Zap, Grid };

export default function PlatformPage({ type }) {
    const data = PLATFORM_CONTENT[type];

    if (!data) return null;

    return (
        <div className="pt-32 pb-20 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-20">
                    <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">{data.title}</h1>
                    <p className="text-xl text-white/50 max-w-2xl mx-auto">{data.subtitle}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {data.features.map((feature, idx) => {
                        const Icon = IconMap[feature.icon] || Globe;
                        return (
                            <Card key={idx} className="p-8 border-white/10 bg-[#0A0A0A] hover:bg-white/5 transition-colors">
                                <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6">
                                    <Icon size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                                <p className="text-white/50 leading-relaxed">{feature.desc}</p>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
