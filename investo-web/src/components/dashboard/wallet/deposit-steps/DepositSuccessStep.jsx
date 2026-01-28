import React from 'react';
import { Card } from '../../../ui/Card';
import { Button } from '../../../ui/Button';
import { CheckCircle2 } from 'lucide-react';

export default function DepositSuccessStep({ amount, onReset }) {
    return (
        <Card className="bg-black/40 backdrop-blur-xl border-white/10 p-12 text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={40} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Deposit Submitted</h3>
            <p className="text-white/50 mb-8 max-w-sm mx-auto">Your request for <strong>${Number(amount).toLocaleString()}</strong> is being verified by the network.</p>
            <div className="flex justify-center">
                <Button onClick={onReset} variant="outline" className="border-white/10 text-white hover:bg-white/5">Make another deposit</Button>
            </div>
        </Card>
    );
}
