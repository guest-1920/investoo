import React from 'react';
import { Card } from '../../../ui/Card';
import { Button } from '../../../ui/Button';
import { Input } from '../../../ui/Input';
import { Copy, UploadCloud, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import rechargeService from '../../../../services/recharge.service';

export default function DepositFormStep({
    amount, setAmount,
    proofKey, setProofKey,
    chainName, setChainName,
    isSubmitting,
    onCancel,
    onSubmit,
    settings
}) {
    const depositAddress = chainName ? import.meta.env[`VITE_WALLET_${chainName}`] : '';
    const [uploading, setUploading] = React.useState(false);
    const [error, setError] = React.useState('');
    const minRecharge = settings?.minRecharge || 10;

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setError(''); // Clear previous errors

        // 5MB Limit Check
        if (file.size > 5 * 1024 * 1024) {
            setError('File size exceeds the 5MB limit. Please upload a smaller file.');
            e.target.value = null; // Clear input
            return;
        }

        setUploading(true);
        try {
            const key = await rechargeService.uploadProof(file);
            setProofKey(key);
        } catch (err) {
            console.error(err);
            setError('Failed to upload proof. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(e);
    };

    return (
        <div className={`grid grid-cols-1 ${chainName ? 'lg:grid-cols-2' : 'max-w-xl mx-auto'} gap-8 transition-all duration-300`}>
            {/* QR Section - Only visible when chain is selected */}
            {chainName && (
                <Card className="p-8 flex flex-col items-center justify-center gap-6 text-center relative overflow-hidden border-white/5 bg-black/20 animate-in slide-in-from-left-4 duration-500">
                    <div className="relative z-10 w-full flex flex-col items-center">
                        {/* Cool Scanner Frame */}
                        <div className="relative p-1 mb-8 group">
                            {/* Glow Effect */}
                            <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                            <div
                                className="relative bg-[#000] p-6 rounded-2xl border border-white/10 shadow-2xl cursor-pointer hover:border-white/20 transition-colors"
                                onClick={() => navigator.clipboard.writeText(depositAddress)}
                            >
                                {/* Corner Markers */}
                                <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-blue-500 rounded-tl-lg -translate-x-2 -translate-y-2 opacity-50 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300" />
                                <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-purple-500 rounded-tr-lg translate-x-2 -translate-y-2 opacity-50 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300" />
                                <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-purple-500 rounded-bl-lg -translate-x-2 translate-y-2 opacity-50 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300" />
                                <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-blue-500 rounded-br-lg translate-x-2 translate-y-2 opacity-50 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300" />

                                {/* QR Image */}
                                <img
                                    src={`/${chainName.toLowerCase()}.svg`}
                                    alt={`${chainName} QR`}
                                    className="w-64 h-64 object-contain relative z-10"
                                />

                                {/* Scanning Line */}
                                <motion.div
                                    initial={{ top: "0%" }}
                                    animate={{ top: "100%" }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "linear",
                                        repeatType: "reverse"
                                    }}
                                    className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_15px_rgba(59,130,246,0.6)] z-20"
                                />
                            </div>
                        </div>

                        <div className="w-full">
                            <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">
                                Scan or Copy Address
                            </div>
                            <div
                                className="bg-white/5 p-4 rounded-xl text-xs font-mono break-all text-white/80 flex items-center justify-between gap-3 border border-white/10 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all group cursor-pointer"
                                onClick={() => navigator.clipboard.writeText(depositAddress)}
                            >
                                <span className="tracking-tight">{depositAddress}</span>
                                <div className="p-2 rounded-lg bg-white/5 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors">
                                    <Copy size={14} />
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {/* Form Section */}
            <Card className="p-8 space-y-8">
                <div className="flex items-center justify-between border-b border-white/5 pb-6">
                    <h3 className="text-lg font-bold text-white">Payment Details</h3>
                    <button onClick={onCancel} className="text-xs font-bold text-white/40 hover:text-white uppercase tracking-wider">Cancel</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-white/50 uppercase tracking-wider">Select Network</label>
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
                        label="Amount (USDT)"
                        type="number"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        placeholder="Enter amount"
                        required min={minRecharge}
                    />
                    <div className="mt-1.5 flex justify-between text-xs">
                        <span className={`font-mono transition-colors ${amount && parseFloat(amount) < minRecharge ? 'text-red-400 font-bold' : 'text-white/30'}`}>
                            Minimum Deposit: ${minRecharge}
                        </span>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="text-red-500 text-sm font-medium bg-red-500/10 p-3 rounded-lg border border-red-500/20 animate-in fade-in slide-in-from-top-1">
                            {error}
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-white/50 uppercase tracking-wider">Payment Proof (Screenshot)</label>
                        <div className={`relative group transition-all duration-300 ${proofKey ? 'opacity-100' : 'hover:opacity-90'}`}>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                disabled={uploading}
                                required={!proofKey}
                            />

                            <div className={`border border-dashed rounded-xl p-4 transition-all duration-300 flex items-center justify-between gap-4 ${proofKey
                                ? 'bg-green-500/10 border-green-500/30'
                                : uploading
                                    ? 'bg-blue-500/5 border-blue-500/30'
                                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                                }`}>
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`p-2.5 rounded-lg shrink-0 transition-colors ${proofKey ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/60'
                                        }`}>
                                        {uploading ? (
                                            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        ) : proofKey ? (
                                            <Check size={20} />
                                        ) : (
                                            <UploadCloud size={20} />
                                        )}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className={`text-sm font-bold truncate transition-colors ${proofKey ? 'text-green-400' : 'text-white/80'
                                            }`}>
                                            {uploading ? 'Uploading Proof...' : proofKey ? 'Screenshot Attached' : 'Upload Screenshot'}
                                        </span>
                                        {!proofKey && !uploading && (
                                            <span className="text-[10px] text-white/40 truncate">Tap to browse or drop file</span>
                                        )}
                                    </div>
                                </div>

                                {proofKey && (
                                    <div className="shrink-0 text-[10px] font-bold bg-green-500/20 text-green-400 px-2 py-1 rounded border border-green-500/20">
                                        CHANGE
                                    </div>
                                )}
                            </div>
                        </div>
                        <p className="text-[10px] text-white/30">Upload a screenshot of your transaction confirmation. Max 5MB.</p>
                    </div>

                    <Button type="submit" isLoading={isSubmitting} className="w-full py-4 text-sm font-bold">
                        Proceed to Confirm
                    </Button>
                </form>
            </Card>
        </div>
    );
}
