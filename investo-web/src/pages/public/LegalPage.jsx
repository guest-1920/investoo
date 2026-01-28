import React from 'react';
import { LEGAL_CONTENT } from '../../data/content';
import { Card } from '../../components/ui/Card';

export default function LegalPage({ type }) {
    const data = LEGAL_CONTENT[type];

    if (!data) return <div className="text-white pt-32 text-center">Content not found.</div>;

    return (
        <div className="pt-32 pb-20 px-6">
            <div className="max-w-4xl mx-auto">
                <header className="mb-12 border-b border-white/10 pb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">{data.title}</h1>
                    <p className="text-white/40">Last Updated: {data.lastUpdated}</p>
                </header>

                <div className="prose prose-invert prose-lg max-w-none text-white/70">
                    <div dangerouslySetInnerHTML={{ __html: data.content }} />
                </div>
            </div>
        </div>
    );
}
