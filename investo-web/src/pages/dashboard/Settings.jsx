import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { User, Shield, Key, Bell, Smartphone, Monitor, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import authService from '../../services/auth.service';

export default function Settings() {
    const [activeTab, setActiveTab] = useState('profile'); // profile | security | notifications

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-white tracking-tight">Account Settings</h1>

            <div className="flex gap-4 border-b border-white/10 pb-1">
                {['profile'/* , 'security', 'notifications' */].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-3 px-2 text-sm font-bold uppercase tracking-wider transition-colors relative ${activeTab === tab ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
                    >
                        {tab}
                        {activeTab === tab && (
                            <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
                        )}
                    </button>
                ))}
            </div>

            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                {activeTab === 'profile' && <ProfileTab />}
                {/* {activeTab === 'security' && <SecurityTab />} */}
                {/* {activeTab === 'notifications' && <NotificationsTab />} */}
            </motion.div>
        </div>
    );
}

function ProfileTab() {
    const [user, setUser] = useState(null);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        authService.getProfile()
            .then(userData => {
                setUser(userData);
                // Split name
                const parts = (userData.name || '').split(' ');
                setFirstName(parts[0] || '');
                setLastName(parts.slice(1).join(' ') || '');
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    const handleSave = async () => {
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            const fullName = `${firstName} ${lastName}`.trim();
            const updatedUser = await authService.updateProfile({ name: fullName });
            setUser(updatedUser);
            setSuccess('Profile updated successfully');
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-white/40 animate-pulse">Loading profile...</div>;
    }

    if (!user) return <div className="text-red-500 text-center">Failed to load profile</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Avatar Section */}
                <Card className="p-8 flex flex-col items-center gap-4 h-fit md:w-1/3">
                    <div className="w-32 h-32 rounded-full bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center text-white/20 relative overflow-hidden">
                        <User size={48} />
                    </div>
                    <div className="text-center">
                        <div className="font-bold text-white text-xl">{firstName} {lastName}</div>
                        <div className="text-xs text-white/40 mt-2 font-mono tracking-wider bg-white/5 px-3 py-1.5 rounded-full inline-block">
                            Refferal id: {user.referralCode || 'N/A'}
                        </div>
                    </div>
                    <div className="w-full pt-6 border-t border-white/5 mt-2">
                        <div className="flex justify-between text-sm py-2">
                            <span className="text-white/50">Joined</span>
                            <span className="text-white">
                                {new Date(user.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </span>
                        </div>
                    </div>
                </Card>

                {/* Form Section */}
                <Card className="p-8 flex-1 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            label="First Name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                        />
                        <Input
                            label="Last Name"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                        />
                    </div>
                    <Input
                        label="Email Address"
                        value={user.email}
                        disabled
                        className="opacity-50 cursor-not-allowed"
                    />

                    <div className="pt-4 space-y-4">
                        <div className="text-xs text-white/40">
                            To update restricted fields like Email, please contact support.
                        </div>

                        {success && (
                            <div className="text-white text-sm font-medium bg-white/5 p-3 rounded-lg border border-white/10 animate-in fade-in slide-in-from-top-1">
                                {success}
                            </div>
                        )}

                        {error && (
                            <div className="text-red-500 text-sm font-medium bg-red-500/10 p-3 rounded-lg border border-red-500/20 animate-in fade-in slide-in-from-top-1">
                                {error}
                            </div>
                        )}

                        <Button onClick={handleSave} isLoading={saving} disabled={saving}>
                            Save Changes
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    )
}

function SecurityTab() {
    return (
        <div className="space-y-6">
            <Card className="p-8">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Key size={20} className="text-green-500" />
                    Password & Authentication
                </h3>

                <div className="grid md:grid-cols-2 gap-12">
                    <div className="space-y-4">
                        <Input label="Current Password" type="password" placeholder="••••••••" />
                        <Input label="New Password" type="password" placeholder="••••••••" />
                        <Input label="Confirm New Password" type="password" placeholder="••••••••" />
                        <Button variant="outline" className="w-full">Update Password</Button>
                    </div>

                    <div className="space-y-6">
                        <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-orange-400 text-sm">Two-Factor Authentication (2FA)</span>
                                <span className="px-2 py-0.5 rounded bg-black/40 text-[10px] font-bold text-white/50 uppercase">Disabled</span>
                            </div>
                            <p className="text-xs text-orange-200/60 mb-4 leading-relaxed">
                                Secure your account by requiring a code from your authenticator app for every login.
                            </p>
                            <Button className="w-full bg-orange-500 hover:bg-orange-600 text-black border-none">Enable 2FA</Button>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                            <div>
                                <div className="text-sm font-bold text-white">Withdrawal Whitelist</div>
                                <div className="text-xs text-white/40">Only allow withdrawals to saved addresses</div>
                            </div>
                            {/* Toggle Switch Mock */}
                            <div className="w-10 h-6 rounded-full bg-white/10 relative cursor-pointer">
                                <div className="w-4 h-4 rounded-full bg-white/50 absolute top-1 left-1" />
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            <Card className="p-8">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Shield size={20} className="text-blue-500" />
                    Active Sessions
                </h3>
                <div className="space-y-4">
                    <SessionRow device="Chrome on Windows" location="New York, USA" ip="192.168.1.1" active />
                    <SessionRow device="Safari on iPhone 14" location="New York, USA" ip="192.168.1.45" lastActive="2 hours ago" />
                </div>
            </Card>
        </div>
    )
}

function SessionRow({ device, location, ip, active, lastActive }) {
    return (
        <div className="flex items-center justify-between p-4 border border-white/5 rounded-xl hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40">
                    {device.includes('iPhone') ? <Smartphone size={20} /> : <Monitor size={20} />}
                </div>
                <div>
                    <div className="text-sm font-bold text-white">{device}</div>
                    <div className="text-xs text-white/40 flex items-center gap-2">
                        <Globe size={10} /> {location} • {ip}
                    </div>
                </div>
            </div>
            <div className="text-right">
                {active ? (
                    <span className="text-green-500 text-xs font-bold uppercase tracking-wide bg-green-500/10 px-2 py-1 rounded">Current Session</span>
                ) : (
                    <div className="text-white/40 text-xs font-medium">{lastActive}</div>
                )}
            </div>
        </div>
    )
}

function NotificationsTab() {
    return (
        <Card className="p-8 max-w-2xl">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Bell size={20} className="text-purple-500" />
                Notification Preferences
            </h3>
            <div className="space-y-6">
                <NotificationToggle title="Investment Updates" desc="Daily returns, maturations, and reinvestment alerts" />
                <NotificationToggle title="Security Alerts" desc="New logins, password changes, and 2FA settings" defaultChecked />
                <NotificationToggle title="Promotions & News" desc="New features, platform updates, and newsletters" />
                <NotificationToggle title="Support Tickets" desc="Replies to your support inquiries" defaultChecked />
            </div>
        </Card>
    )
}

function NotificationToggle({ title, desc, defaultChecked }) {
    const [checked, setChecked] = useState(defaultChecked || false);
    return (
        <div className="flex items-start justify-between">
            <div>
                <div className="text-sm font-bold text-white mb-1">{title}</div>
                <div className="text-xs text-white/40">{desc}</div>
            </div>
            <button
                onClick={() => setChecked(!checked)}
                className={`w-12 h-6 rounded-full transition-colors relative ${checked ? 'bg-green-500' : 'bg-white/10'}`}
            >
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${checked ? 'left-7' : 'left-1'}`} />
            </button>
        </div>
    )
}
