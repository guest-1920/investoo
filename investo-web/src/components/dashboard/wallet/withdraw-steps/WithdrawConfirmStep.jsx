import React from 'react';
import { Card } from '../../../ui/Card';
import { Button } from '../../../ui/Button';
import { ArrowLeft, ArrowUpRight, Wallet, AlertTriangle, Globe } from 'lucide-react';

export default function WithdrawConfirmStep({
    amount,
    chainName,
    blockchainAddress,
    isSubmitting,
    error,
    onBack,
    onConfirm,
    settings
}) {
    const feeAmount = parseFloat(settings?.withdrawalFee) || 0;
    const numAmount = parseFloat(amount) || 0;
    // const feeAmount = (numAmount * feePercent) / 100;
    const netAmount = numAmount - feeAmount;

    return (
        <Card className="p-8 max-w-xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <button onClick={onBack} disabled={isSubmitting} className="p-2 -ml-2 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-colors disabled:opacity-50">
                    <ArrowLeft size={20} />
                </button>
                <h3 className="text-xl font-bold text-white text-center flex-1 pr-8">Confirm Withdrawal</h3>
            </div>

            <div className="text-center py-6">
                <div className="text-white/40 text-sm font-medium mb-2 uppercase tracking-wide">You will receive</div>
                <div className="text-4xl font-mono text-white font-bold tracking-tight">
                    {netAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-lg text-white/40">USDT</span>
                </div>
                {feeAmount > 0 && (
                    <div className="text-xs text-white/40 mt-2 bg-white/5 inline-block px-3 py-1 rounded-full border border-white/5">
                        Requested: USDT {numAmount.toLocaleString()} — Fee: USDT {feeAmount.toLocaleString()}
                    </div>
                )}
            </div>

            <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden divide-y divide-white/5">
                {/* Network Row */}
                <div className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                            <Globe size={14} />
                        </div>
                        <span className="text-white/60 text-sm font-medium">Network</span>
                    </div>
                    <span className="text-white font-bold tracking-wide">{chainName}</span>
                </div>

                {/* Destination Row */}
                <div className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
                            <Wallet size={14} />
                        </div>
                        <span className="text-white/60 text-sm font-medium">Destination Address</span>
                    </div>
                    <div className="bg-black/40 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors">
                        <p className="text-white/90 font-mono text-xs break-all text-center leading-relaxed tracking-wide select-all">
                            {blockchainAddress}
                        </p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
                    <AlertTriangle size={18} />
                    {error}
                </div>
            )}

            <div className="space-y-3">
                <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl flex gap-3 text-blue-200/70 text-xs leading-relaxed font-medium">
                    <div className="mt-0.5"><Wallet size={14} /></div>
                    <p>Funds will be sent to the address above. Please ensure it is correct and on the <strong>{chainName}</strong> network. We are not responsible for lost funds due to incorrect addresses.</p>
                </div>

                <Button
                    onClick={onConfirm}
                    isLoading={isSubmitting}
                    className="w-full py-4 text-md font-bold bg-white text-black hover:bg-white/90"
                >
                    Confirm & Verify Email
                </Button>
            </div>
        </Card>
    );
}
