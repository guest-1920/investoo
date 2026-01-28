import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';
import { useAuth } from '../context/AuthContext';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { setUser } = useAuth();
    const token = searchParams.get('token');

    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('Verifying your email...');

    const processed = React.useRef(false);

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Invalid or missing verification token.');
            return;
        }

        if (processed.current) return;
        processed.current = true;

        const verify = async () => {
            try {
                await authService.verifyEmail(token);
                // Fetch full profile after verification to get all user data including referralCode
                const profile = await authService.getProfile();
                setUser(profile);
                setStatus('success');
                setMessage('Email verified successfully! Redirecting...');

                setTimeout(() => {
                    navigate('/dashboard');
                }, 2000);
            } catch (err) {
                console.error(err);
                setStatus('error');
                setMessage(err.response?.data?.message || 'Verification failed. Link may be expired.');
            }
        };

        verify();
    }, [token, navigate, setUser]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">

                {status === 'verifying' && (
                    <>
                        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto" />
                        <h2 className="text-xl font-semibold text-white">Verifying Email</h2>
                        <p className="text-zinc-400">{message}</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                        <h2 className="text-xl font-semibold text-white">Verified!</h2>
                        <p className="text-zinc-400">{message}</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
                        <h2 className="text-xl font-semibold text-white">Verification Failed</h2>
                        <p className="text-zinc-400">{message}</p>
                        <button
                            onClick={() => navigate('/login')}
                            className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
                        >
                            Back to Login
                        </button>
                    </>
                )}

            </div>
        </div>
    );
};

export default VerifyEmail;
