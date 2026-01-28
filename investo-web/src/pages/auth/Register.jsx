import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import HeroNetwork from '../../components/layout/HeroNetwork';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import authService from '../../services/auth.service';
import { ArrowRight, Mail, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Register() {
    const [searchParams] = useSearchParams();
    const refCode = searchParams.get('ref') || '';

    const [formData, setFormData] = useState({ name: '', email: '', password: '', referralCode: refCode });
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    // Update referralCode if URL param changes (e.g., user navigates with different ref)
    useEffect(() => {
        if (refCode) {
            setFormData(prev => ({ ...prev, referralCode: refCode }));
        }
    }, [refCode]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            await authService.register(formData);
            setSuccess(true);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    const formFields = [
        { name: 'name', placeholder: 'Full Name', type: 'text', required: true },
        { name: 'email', placeholder: 'Email Address', type: 'email', required: true },
        { name: 'password', placeholder: 'Create Password', type: 'password', required: true },
        { name: 'referralCode', placeholder: 'Referral Code (Optional)', type: 'text', required: false },
    ];

    return (
        <div className="relative h-screen w-full bg-background overflow-hidden flex items-center justify-center p-6">
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <HeroNetwork />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 w-full max-w-md"
            >
                <Card className="p-8 md:p-10 relative overflow-hidden min-h-[500px] flex flex-col justify-center">
                    <AnimatePresence mode="wait">
                        {!success ? (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                            >
                                <div className="text-center mb-8">
                                    <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Create Account</h2>
                                    <p className="text-white/40 text-sm">Join the institutional network</p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {formFields.map((field) => (
                                        <Input
                                            key={field.name}
                                            type={field.type}
                                            placeholder={field.placeholder}
                                            value={formData[field.name]}
                                            onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
                                            required={field.required}
                                        />
                                    ))}

                                    {error && <p className="text-rose-500 text-sm text-center">{error}</p>}

                                    <Button type="submit" isLoading={isLoading} className="w-full mt-6">
                                        Continue <ArrowRight size={18} />
                                    </Button>
                                </form>
                                <div className="mt-8 text-center">
                                    <p className="text-sm text-white/40">
                                        Already member? <Link to="/login" className="text-white hover:underline font-medium">Login</Link>
                                    </p>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-center flex flex-col items-center justify-center h-full space-y-6"
                            >
                                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center text-green-500">
                                    <Mail size={40} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-2">Check your Email</h2>
                                    <p className="text-white/60 text-sm max-w-xs mx-auto">
                                        We sent a verification link to <span className="text-white font-medium">{formData.email}</span>
                                    </p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-lg text-xs text-white/40 max-w-xs">
                                    Click the link in the email to activate your account and access the dashboard.
                                </div>
                                <Link to="/login" className="text-indigo-400 hover:text-indigo-300 text-sm">
                                    Back to Login
                                </Link>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Card>
            </motion.div>
        </div>
    );
}
