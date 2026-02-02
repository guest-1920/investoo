import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
    BarChart2,
    PieChart,
    Wallet,
    Settings,
    LogOut,
    Menu,
    User,
    ChevronRight,
    Users,
    Shield,
    Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import authService from '../services/auth.service';
import Footer from '../components/layout/Footer';

export default function DashboardLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [user, setUser] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        authService.getProfile()
            .then(setUser)
            .catch(() => {
                // If fetching profile fails, maybe redirect to login or just stay (protected route usually handles this)
            });
    }, []);

    const handleLogout = async () => {
        try {
            await authService.logout();
            navigate('/login');
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    const navItems = [
        { label: 'Overview', icon: BarChart2, path: '/dashboard' },
        { label: 'Index', icon: PieChart, path: '/dashboard/plans' },
        { label: 'My Index', icon: Briefcase, path: '/dashboard/my-indexes' },
        { label: 'My Wallet', icon: Wallet, path: '/dashboard/wallet' },
        { label: 'Referrals & Rewards', icon: Users, path: '/dashboard/referrals' },
        // { label: 'Verification', icon: Shield, path: '/dashboard/verification' },
        { label: 'Support', icon: Menu, path: '/dashboard/support' }, // Using Menu as placeholder if Headphones missing, checking imports later
        { label: 'Settings', icon: Settings, path: '/dashboard/settings' },
    ];

    const currentPath = location.pathname;

    return (
        <div className="flex h-screen w-screen bg-background text-white overflow-hidden">

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.aside
                className={`fixed md:relative z-50 h-full w-64 bg-[#0A0A0A] border-r border-white/10 flex flex-col transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
            >
                {/* Brand */}
                <div className="h-20 flex items-center px-6 border-b border-white/5">
                    <Link to="/" className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-white flex items-center justify-center">
                            <div className="w-4 h-4 rounded-full bg-black" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-bold tracking-tight leading-none">Investoo</span>
                            <span className="text-[12px] font-medium text-white/50 tracking-wide camelcase transition-colors">Future Of Investing</span>
                        </div>
                    </Link>
                </div>

                {/* Nav Links */}
                <nav className="flex-1 py-8 px-4 space-y-2">
                    {navItems.map((item) => {
                        const isActive = currentPath === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${isActive
                                    ? 'bg-white text-black shadow-lg hover:scale-[1.02]'
                                    : 'text-white/60 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <item.icon size={18} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Footer */}
                <div className="p-4 border-t border-white/5 bg-[#050505]/50">
                    <div className="flex items-center gap-3 px-4 py-3">
                        <Link to="/dashboard/settings" className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity min-w-0">
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shrink-0">
                                <User size={18} className="text-white/70" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <div className="text-sm font-bold truncate">{user?.name || 'Loading...'}</div>
                            </div>
                        </Link>
                        <button onClick={handleLogout} className="text-white/40 hover:text-white transition-colors shrink-0">
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </motion.aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full bg-background relative min-w-0">
                {/* Background Glow */}
                <div className="absolute top-0 left-0 w-full h-[500px] bg-white/[0.02] pointer-events-none blur-3xl rounded-full" />

                {/* Topbar */}
                <header className="h-20 flex items-center justify-between px-6 md:px-10 border-b border-white/10 relative z-10 bg-[#0A0A0A]/50 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="md:hidden text-white/70 hover:text-white"
                        >
                            <Menu />
                        </button>
                        {/* Breadcrumbs */}
                        <div className="hidden md:flex items-center gap-2 text-sm font-medium text-white/40">
                            <span>Dashboard</span>
                            {currentPath !== '/dashboard' && (
                                <>
                                    <ChevronRight size={12} />
                                    <span className="text-white">
                                        {navItems.find(i => i.path === currentPath)?.label || 'Page'}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>


                </header>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden relative z-10 w-full scrollbar-hide">
                    <div className="min-h-full flex flex-col">
                        <div className="flex-1 p-4 md:p-10">
                            <div className="max-w-6xl mx-auto pb-20">
                                <Outlet />
                            </div>
                        </div>
                        <Footer />
                    </div>
                </div>
            </div>

        </div>
    );
}
