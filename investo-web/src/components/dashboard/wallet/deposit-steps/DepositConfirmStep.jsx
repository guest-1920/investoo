import React from 'react';
import { Card } from '../../../ui/Card';
import { Button } from '../../../ui/Button';
import { AlertTriangle, AlertCircle } from 'lucide-react';

export default function DepositConfirmStep({
    amount,
    chainName,
    proofKey,
    isSubmitting,
    error,
    onBack,
    onConfirm
}) {
    return (
        <Card className="p-8 max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-3 text-yellow-500 bg-yellow-500/10 p-4 rounded-xl border border-yellow-500/20 mb-2">
                <AlertTriangle size={24} />
                <div className="text-sm font-medium">Please review your deposit details carefully before confirming.</div>
            </div>

            {error && (
                <div className="flex items-center gap-3 text-red-500 bg-red-500/10 p-4 rounded-xl border border-red-500/20 animate-in slide-in-from-top-2">
                    <AlertCircle size={24} />
                    <div className="text-sm font-medium">{error}</div>
                </div>
            )}

            <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-white/5">
                    <span className="text-white/40 text-sm font-bold uppercase tracking-wider">Network</span>
                    <span className="text-white font-mono font-bold">{chainName}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-white/5">
                    <span className="text-white/40 text-sm font-bold uppercase tracking-wider">Amount</span>
                    <span className="text-green-500 text-xl font-bold tracking-tight">${amount}</span>
                </div>
                <div className="space-y-1 py-3 border-b border-white/5">
                    <span className="text-white/40 text-sm font-bold uppercase tracking-wider block mb-1">Payment Proof</span>
                    <span className="text-green-400 font-mono text-xs font-bold block">✓ Screenshot Attached</span>
                    <span className="text-white/20 font-mono text-[10px] break-all block">{proofKey}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
                <Button variant="outline" onClick={onBack} className="py-4 border-white/10 hover:bg-white/5">
                    Back to Edit
                </Button>
                <Button onClick={onConfirm} isLoading={isSubmitting} className="py-4 font-bold bg-white text-black hover:bg-zinc-200">
                    Confirm & Submit
                </Button>
            </div>
        </Card>
    );
}
