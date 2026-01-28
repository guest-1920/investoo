import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import HeroNetwork from '../../components/layout/HeroNetwork';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import authService from '../../services/auth.service';
import { useAuth } from '../../context/AuthContext';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    const { user, setUser } = useAuth();

    useEffect(() => {
        if (user) {
            navigate('/dashboard', { replace: true });
        }
    }, [user, navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            await authService.login(email, password);
            // Fetch full profile after login to get all user data including referralCode
            const profile = await authService.getProfile();
            setUser(profile);
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Invalid credentials');
        } finally {
            setIsLoading(false);
        }
    };

    const fields = [
        {
            key: 'email',
            label: 'Email Address',
            type: 'email',
            placeholder: 'Enter email address',
            value: email,
            setValue: setEmail
        },
        {
            key: 'password',
            label: 'Password',
            type: 'password',
            placeholder: 'Enter password',
            value: password,
            setValue: setPassword
        }
    ];

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
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Welcome Back</h2>
                        <p className="text-white/40 text-sm">Access your institutional portfolio</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {fields.map((field) => (
                            <Input
                                key={field.key}
                                label={field.label}
                                type={field.type}
                                placeholder={field.placeholder}
                                value={field.value}
                                onChange={(e) => field.setValue(e.target.value)}
                                required
                                labelRight={field.labelRight}
                            />
                        ))}

                        {error && <p className="text-rose-500 text-sm">{error}</p>}

                        <Button type="submit" isLoading={isLoading} className="w-full">
                            Log In <ArrowRight size={18} />
                        </Button>
                    </form>

                    <div className="mt-8 text-center space-y-4">
                        <div>
                            <Link to="/forgot-password" className="text-sm text-white/40 hover:text-white transition-colors">
                                Forgot Password?
                            </Link>
                        </div>
                        <p className="text-sm text-white/40">
                            New User? <Link to="/register" className="text-white hover:underline font-medium">Apply for Access</Link>
                        </p>
                    </div>
                </Card>
            </motion.div>
        </div>
    );
}
