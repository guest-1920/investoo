import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import HeroNetwork from '../../components/layout/HeroNetwork';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import authService from '../../services/auth.service';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        setIsLoading(true);
        try {
            await authService.resetPassword(token, password);
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to reset password. Link may be expired.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="h-screen w-full bg-background flex items-center justify-center text-white">
                <p>Invalid Reset Link</p>
            </div>
        );
    }

    return (
        <div className="relative h-screen w-full bg-background overflow-hidden flex items-center justify-center p-6">
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <HeroNetwork />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-md"
            >
                <Card className="p-8 md:p-10">
                    <AnimatePresence mode="wait">
                        {!success ? (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <div className="text-center mb-10">
                                    <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Reset Password</h2>
                                    <p className="text-white/40 text-sm">Choose a strong password</p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <Input
                                        label="New Password"
                                        type="password"
                                        placeholder="Min 8 characters"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <Input
                                        label="Confirm Password"
                                        type="password"
                                        placeholder="Re-enter password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />

                                    {error && <p className="text-rose-500 text-sm">{error}</p>}

                                    <Button type="submit" isLoading={isLoading} className="w-full">
                                        Update Password <ArrowRight size={18} />
                                    </Button>
                                </form>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center"
                            >
                                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mx-auto mb-6">
                                    <CheckCircle2 size={32} />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">Password Updated</h2>
                                <p className="text-white/60 text-sm mb-6">
                                    Your password has been changed successfully. Redirecting to login...
                                </p>
                                <Button onClick={() => navigate('/login')} className="w-full">
                                    Go to Login
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Card>
            </motion.div>
        </div>
    );
}
