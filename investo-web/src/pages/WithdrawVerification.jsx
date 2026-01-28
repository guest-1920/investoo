import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import withdrawalsService from '../services/withdrawals.service';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export default function WithdrawVerification() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [status, setStatus] = useState('verifying'); // verifying | success | error
    const [message, setMessage] = useState('Verifying your withdrawal request...');
    const processed = useRef(false);

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Invalid verification link.');
            return;
        }

        if (processed.current) return;
        processed.current = true;


        withdrawalsService.verifyWithdrawal(token)
            .then(() => {
                setStatus('success');
                setMessage('Withdrawal request verified successfully!');
            })
            .catch(err => {
                setStatus('error');
                setMessage(err.response?.data?.message || 'Verification failed. The link may have expired or you have insufficient funds.');
            });
    }, [token]);

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <Card className="max-w-md w-full p-8 text-center space-y-6">
                {status === 'verifying' && (
                    <>
                        <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto" />
                        <h2 className="text-xl font-bold text-white">Verifying...</h2>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto animate-in zoom-in" />
                        <h2 className="text-xl font-bold text-white">Verification Successful</h2>
                        <p className="text-white/60">{message}</p>
                        <Button className="w-full mt-4" onClick={() => navigate('/dashboard/wallet')}>
                            Go to Wallet <ArrowRight size={16} className="ml-2" />
                        </Button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <XCircle className="w-16 h-16 text-red-500 mx-auto animate-in zoom-in" />
                        <h2 className="text-xl font-bold text-white">Verification Failed</h2>
                        <p className="text-white/60">{message}</p>
                        <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/dashboard')}>
                            Return to Dashboard
                        </Button>
                    </>
                )}
            </Card>
        </div>
    )
}
