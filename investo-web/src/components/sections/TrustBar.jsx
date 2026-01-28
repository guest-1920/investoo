import React from 'react';

const partners = [
    "BlackRock", "Binance", "Ethereum", "J.P. Morgan", "Goldman Sachs", "Solana", "Coinbase"
];

export default function TrustBar() {
    return (
        <section className="py-12 border-b border-white/5 bg-background">
            <div className="max-w-7xl mx-auto px-6">
                <p className="text-center text-xs font-semibold text-white/30 uppercase tracking-widest mb-8">
                    Trusted by industry leaders
                </p>
                <div className="flex flex-wrap justify-center items-center gap-12 md:gap-10 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                    {partners.map(partner => (
                        <div key={partner} className="text-lg md:text-2xl font-bold text-white font-serif">
                            {partner}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
