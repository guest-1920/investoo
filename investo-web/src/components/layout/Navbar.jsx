import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { label: 'Plans', path: '/plans' },
        { label: 'Methodology', path: '/methodology' },
        { label: 'Insights', path: '/insights' },
        { label: 'Company', path: '/company' },
    ];

    return (
        <nav
            className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled || isMobileMenuOpen ? 'bg-background/80 backdrop-blur-md border-b border-white/5' : 'bg-transparent'
                }`}
        >
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-lg shadow-white/5">
                        <div className="w-5 h-5 rounded-full bg-black" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-bold tracking-tight text-white group-hover:opacity-100 transition-opacity leading-none">
                            Investoo
                        </span>
                        <span className="text-[12px] font-medium text-white/50 tracking-wide camelcase transition-colors">
                            Future Of Investing
                        </span>
                    </div>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map((item) => (
                        <Link
                            key={item.label}
                            to={item.path}
                            className="text-sm font-medium text-white/70 hover:text-white transition-colors flex items-center gap-1"
                        >
                            {item.label}
                            {item.path === '#' && <ChevronDown className="w-3 h-3 opacity-50" />}
                        </Link>
                    ))}
                </div>

                {/* CTA */}
                <div className="hidden md:flex items-center gap-4">
                    <Link to="/login" className="text-sm font-medium text-white hover:text-white/80 transition-colors">
                        Log In
                    </Link>
                    <Link to="/register">
                        <button className="bg-white text-black px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-white/90 transition-all transform hover:scale-105">
                            Get Started
                        </button>
                    </Link>
                </div>

                {/* Mobile Toggle */}
                <button
                    className="md:hidden text-white"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-background border-b border-white/5 overflow-hidden"
                    >
                        <div className="px-6 py-8 flex flex-col gap-6">
                            {navLinks.map((item) => (
                                <Link
                                    key={item.label}
                                    to={item.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="text-lg font-medium text-white/80 hover:text-white"
                                >
                                    {item.label}
                                </Link>
                            ))}
                            <div className="h-px bg-white/10 my-2" />
                            <Link to="/login" className="text-lg font-medium text-white/80 hover:text-white">
                                Log In
                            </Link>
                            <Link to="/register" className="w-full">
                                <button className="bg-white text-black px-5 py-3 rounded-full text-base font-semibold w-full">
                                    Get Started
                                </button>
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
