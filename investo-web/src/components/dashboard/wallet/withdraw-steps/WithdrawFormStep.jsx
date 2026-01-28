import React from 'react';
import { Card } from '../../../ui/Card';
import { Button } from '../../../ui/Button';
import { Input } from '../../../ui/Input';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

export default function WithdrawFormStep({
    balance,
    amount, setAmount,
    chainName, setChainName,
    blockchainAddress, setBlockchainAddress,
    isSubmitting,
    error,
    onSubmit,
    onBack,
    settings
}) {
    // Fixed Fee
    const feeAmount = parseFloat(settings?.withdrawalFee) || 0;
    const minWithdrawal = settings?.minWithdrawal || 0;

    // Calculate details
    const numAmount = parseFloat(amount) || 0;

    const netAmount = numAmount - feeAmount;

    return (
        <Card className="p-8 max-w-xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-2 -ml-2 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <h3 className="text-xl font-bold text-white text-center flex-1 pr-8">Withdraw Funds</h3>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
                    <AlertTriangle size={18} />
                    {error}
                </div>
            )}

            <form onSubmit={onSubmit} className="space-y-6">
                <div>
                    <div className="flex justify-between mb-2">
                        <label className="text-xs font-bold text-white/50 uppercase tracking-wider">Amount</label>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-white/40 font-bold font-mono pt-1">USDT</span>
                        <Input
                            type="number"
                            value={amount}
                            onChange={e => {
                                const val = e.target.value;
                                if (val === '' || parseFloat(val) <= balance) {
                                    setAmount(val);
                                }
                            }}
                            placeholder="0.00"
                            required
                            max={balance}
                            min={minWithdrawal}
                            className="text-lg font-mono flex-1"
                        />
                    </div>
                    {/* Fee & Limits Info */}
                    {/* Min & Balance Limit Hints */}
                    <div className="mt-2 flex justify-between text-xs mb-4">
                        <span className={`font-mono ${numAmount > 0 && numAmount < minWithdrawal ? 'text-red-400 font-bold' : 'text-white/30'}`}>
                            Minimum Withdrawal: USDT {minWithdrawal.toLocaleString()}
                        </span>
                    </div>


                </div>

                <div className="space-y-3">
                    <label className="text-xs font-bold text-white/50 uppercase tracking-wider">Network</label>
                    <div className="grid grid-cols-3 gap-3">
                        {['TRC20', 'ERC20', 'BEP20'].map(c => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => setChainName(c)}
                                className={`py-3 rounded-xl text-sm font-bold border transition-all ${chainName === c ? 'bg-white text-black border-white shadow-lg' : 'bg-white/5 text-white/50 border-white/5 hover:bg-white/10'}`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                </div>

                <Input
                    label="Destination Address"
                    value={blockchainAddress}
                    onChange={e => setBlockchainAddress(e.target.value)}
                    placeholder="Enter wallet address"
                    required
                />

                {blockchainAddress && (
                    <div className="p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-xl flex gap-3 text-yellow-200/70 text-xs leading-relaxed font-medium animate-in slide-in-from-top-2 fade-in">
                        <div className="mt-0.5"><AlertTriangle size={14} /></div>
                        <p>Verify that the address matches the <strong>{chainName}</strong> network. Incorrect withdrawals cannot be reversed.</p>
                    </div>
                )}

                {/* Enterprise Fee Breakdown */}
                {numAmount > 0 && (
                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3 mb-6">
                        <div className="flex justify-between items-center border-b border-white/5 pb-3">
                            <span className="text-sm text-white/60">Processing Fee (Fixed)</span>
                            <span className="font-mono text-white/60">USDT {feeAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-white">Net Amount to Receive</span>
                            <span className="font-mono text-lg font-bold text-green-400 whitespace-nowrap">
                                USDT {netAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                )}

                <Button type="submit" isLoading={isSubmitting} className="w-full py-4 text-sm font-bold" disabled={parseFloat(amount) > balance || (parseFloat(amount) < minWithdrawal)}>
                    Request Withdrawal
                </Button>
            </form>
        </Card>
    );
}
