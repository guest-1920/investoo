import React from 'react';
import { Twitter, Linkedin, Facebook, Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="bg-background border-t border-white/5 pt-20 pb-10">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 mb-20">
                    {/* Brand Column */}
                    <div className="col-span-2 lg:col-span-2">
                        <Link to="/" className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded bg-white flex items-center justify-center">
                                <div className="w-4 h-4 rounded-full bg-black" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xl font-bold tracking-tight text-white leading-none">Investoo</span>
                                <span className="text-[12px] font-medium text-white/50 tracking-wide camelcase mt-0.5">Future Of Investing</span>
                            </div>
                        </Link>
                        <p className="text-white/50 text-sm leading-relaxed max-w-sm mb-8">
                            Empowering the next generation of wealth with institutional-grade analytics, automated diversification, and premium asset access.
                        </p>
                        <div className="flex gap-4">
                            {[Twitter, Linkedin, Facebook, Instagram].map((Icon, i) => (
                                <a key={i} href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors text-white/70 hover:text-white">
                                    <Icon size={18} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links Columns */}
                    {[
                        {
                            title: "Platform",
                            links: [
                                { label: "Market Intelligence", href: "/market-intelligence" },
                                { label: "Portfolio Construction", href: "/portfolio" },
                                { label: "Risk Analysis", href: "/risk-analysis" },
                                { label: "Plans", href: "/plans" }
                            ]
                        },
                        {
                            title: "Company",
                            links: [
                                { label: "About Us", href: "/company" },
                                { label: "Careers", href: "/careers" },
                                { label: "Press", href: "/press" },
                                { label: "Contact", href: "/contact" }
                            ]
                        },
                        {
                            title: "Legal",
                            links: [
                                { label: "Privacy Policy", href: "/privacy" },
                                { label: "Terms of Service", href: "/terms" },
                                { label: "Security", href: "/security" },
                                { label: "Disclosures", href: "/disclosures" }
                            ]
                        },
                    ].map((col) => (
                        <div key={col.title}>
                            <h3 className="text-white font-semibold mb-6">{col.title}</h3>
                            <ul className="space-y-4">
                                {col.links.map((link) => (
                                    <li key={link.label}>
                                        <a href={link.href} className="text-white/50 hover:text-white text-sm transition-colors">
                                            {link.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Disclaimers */}
                <div className="border-t border-white/5 pt-10 text-xs text-white/30 leading-relaxed text-center md:text-left">
                    <p className="mb-4">
                        Investing involves risk, including possible loss of principal. Investoo Inc. is an SEC-registered investment adviser.
                        Brokerage services provided to clients of Investoo by Investoo Brokerage LLC, an SEC-registered broker-dealer and member FINRA/SIPC.
                    </p>
                    <p>
                        © 2026 Investoo Inc. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
