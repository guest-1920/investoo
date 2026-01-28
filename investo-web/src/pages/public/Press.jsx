import React from 'react';
import { PRESS_RELEASES } from '../../data/content';
import { Card } from '../../components/ui/Card';
import { ExternalLink } from 'lucide-react';

export default function Press() {
    return (
        <div className="pt-32 pb-20 px-6 max-w-5xl mx-auto">
            <h1 className="text-5xl font-bold text-white mb-12">Press Room</h1>

            <div className="space-y-8">
                {PRESS_RELEASES.map((item, idx) => (
                    <div key={idx} className="group border-b border-white/10 pb-8 hover:border-white/30 transition-colors">
                        <div className="flex items-center gap-4 mb-2 text-sm text-white/40">
                            <span>{item.date}</span>
                            <span>•</span>
                            <span className="text-blue-400 font-bold uppercase">{item.source}</span>
                        </div>
                        <h3 className="text-3xl font-bold text-white mb-4 group-hover:text-blue-400 transition-colors flex items-center gap-3">
                            {item.title}
                            <ExternalLink size={24} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </h3>
                    </div>
                ))}
            </div>
        </div>
    );
}
