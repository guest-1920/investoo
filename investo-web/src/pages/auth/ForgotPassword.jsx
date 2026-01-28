import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import HeroNetwork from '../../components/layout/HeroNetwork';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import authService from '../../services/auth.service';
import { ArrowRight, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            await authService.forgotPassword(email);
            setIsSent(true);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

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
                        {!isSent ? (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                            >
                                <div className="text-center mb-10">
                                    <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Forgot Password</h2>
                                    <p className="text-white/40 text-sm">Enter your email to receive a reset link</p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <Input
                                        label="Email Address"
                                        type="email"
                                        placeholder="Enter email address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />

                                    {error && <p className="text-rose-500 text-sm">{error}</p>}

                                    <Button type="submit" isLoading={isLoading} className="w-full">
                                        Send Reset Link <ArrowRight size={18} />
                                    </Button>
                                </form>

                                <div className="mt-8 text-center">
                                    <Link to="/login" className="text-sm text-white/40 hover:text-white transition-colors">
                                        Back to Login
                                    </Link>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-center"
                            >
                                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mx-auto mb-6">
                                    <Mail size={32} />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">Check your Email</h2>
                                <p className="text-white/60 text-sm mb-8">
                                    If an account exists for <span className="text-white">{email}</span>, you will receive a password reset link shortly.
                                </p>
                                <Link to="/login">
                                    <Button className="w-full" variant="outline">
                                        Back to Login
                                    </Button>
                                </Link>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Card>
            </motion.div>
        </div>
    );
}
