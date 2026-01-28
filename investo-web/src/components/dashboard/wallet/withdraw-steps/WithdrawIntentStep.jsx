import React from 'react';
import { Card } from '../../../ui/Card';
import { Button } from '../../../ui/Button';
import { ArrowUpRight } from 'lucide-react';

export default function WithdrawIntentStep({ onNext }) {
    return (
        <Card className="p-12 text-center flex flex-col items-center justify-center gap-6 min-h-[400px]">
            <div className="w-24 h-24 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4 border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.1)]">
                <ArrowUpRight size={48} />
            </div>
            <div>
                <h3 className="text-2xl font-bold text-white mb-3">Withdraw Funds</h3>
                <p className="text-white/50 max-w-md mx-auto leading-relaxed">
                    Securely withdraw your earnings to your external wallet.
                    Requests are processed within 24 hours after email verification.
                </p>
            </div>
            <Button onClick={onNext} className="px-10 py-4 text-base font-bold rounded-xl shadow-xl shadow-blue-500/10 bg-white text-black hover:bg-white/90">
                Start Withdrawal
            </Button>
        </Card>
    );
}
