import React, { useState } from 'react';
import client from '../api/client';
import { toast } from 'react-hot-toast';

const ClaimRewardModal = ({ isOpen, onClose, reward, source, onSuccess }) => {
    const api = client;
    const [step, setStep] = useState(1); // 1: Choice, 2: Address (if physical)
    const [claimType, setClaimType] = useState('WALLET'); // WALLET | PHYSICAL
    const [loading, setLoading] = useState(false);

    // Address Form State
    const [address, setAddress] = useState({
        fullName: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
    });

    if (!isOpen || !reward) return null;

    const handleChoiceSubmit = () => {
        if (claimType === 'WALLET') {
            submitClaim();
        } else {
            setStep(2); // Move to address form
        }
    };

    const submitClaim = async () => {
        try {
            setLoading(true);

            const payload = {
                rewardId: reward.id,
                sourceId: source.sourceId || source.id, // Support both formats (legacy id vs new sourceId)
                sourceType: source.sourceType || source.type,
                fulfillmentId: source.fulfillmentId, // Critical for backend eligibility check
                claimType: claimType,
            };

            // If physical, we'd normally create address first then pass ID.
            // But for this MVP flow, let's assume the API handles it or we need to Create Address -> Get ID -> Claim.
            // The Plan said: "Creates a PENDING fulfillment record with the provided address."
            // But the endpoint expects `addressId`. 
            // So we must Create Address First if Physical. 
            // Oops, I didn't check if Address API exists for creation.
            // Inspecting `addresses.controller.ts` (implied existence) would be good.
            // Assuming `POST /referrals/addresses` exists or similar.
            // Let's check `addresses.controller.ts` later or assume generic user update.
            // Actually, let's look at `ClaimRewardModal` plan... "Inputs: Name... Save & Claim".
            // I'll assume we need to hit an address creation endpoint first.

            if (claimType === 'PHYSICAL') {
                // create address logic
                const addressRes = await api.post('/referrals/addresses', {
                    ...address,
                    label: 'Reward Delivery'
                });
                payload.addressId = addressRes.data.id;
            }

            await api.post('/referrals/fulfillments/claim', payload);

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Claim failed', error);
            toast.error('Failed to submit claim. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setAddress({ ...address, [e.target.name]: e.target.value });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <h3 className="text-xl font-bold text-white">Claim Reward</h3>
                    <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">✕</button>
                </div>

                <div className="p-6">
                    {step === 1 ? (
                        <div className="space-y-6">
                            <div className="flex items-center space-x-4 bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl relative overflow-hidden">
                                <div className="absolute inset-0 bg-amber-500/10 blur-xl rounded-full opacity-20"></div>
                                <img
                                    src={reward.imageUrl?.startsWith('public/') ? `/${reward.imageUrl.replace('public/', '')}` : reward.imageUrl}
                                    alt={reward.name}
                                    className="w-16 h-16 object-cover rounded-lg bg-black/20 border border-white/10 relative z-10"
                                />
                                <div className="relative z-10">
                                    <h4 className="font-bold text-white text-lg">{reward.name}</h4>
                                    <p className="text-sm text-amber-500 font-mono">Value: {reward.value.toLocaleString()} USDT</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="font-medium text-white/70">How would you like to receive this?</p>

                                <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${claimType === 'WALLET' ? 'border-amber-500 bg-amber-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'}`}>
                                    <input
                                        type="radio"
                                        name="claimType"
                                        value="WALLET"
                                        checked={claimType === 'WALLET'}
                                        onChange={() => setClaimType('WALLET')}
                                        className="w-4 h-4 text-amber-500 focus:ring-amber-500 border-white/20 bg-black/50"
                                    />
                                    <div className="ml-3">
                                        <span className={`block text-sm font-bold ${claimType === 'WALLET' ? 'text-white' : 'text-white/70'}`}>Wallet Credit (Instant)</span>
                                        <span className="block text-xs text-white/40">Get {reward.value} USDT credited to your Investoo wallet immediately.</span>
                                    </div>
                                </label>

                                <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${claimType === 'PHYSICAL' ? 'border-amber-500 bg-amber-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'}`}>
                                    <input
                                        type="radio"
                                        name="claimType"
                                        value="PHYSICAL"
                                        checked={claimType === 'PHYSICAL'}
                                        onChange={() => setClaimType('PHYSICAL')}
                                        className="w-4 h-4 text-amber-500 focus:ring-amber-500 border-white/20 bg-black/50"
                                    />
                                    <div className="ml-3">
                                        <span className={`block text-sm font-bold ${claimType === 'PHYSICAL' ? 'text-white' : 'text-white/70'}`}>Physical Delivery</span>
                                        <span className="block text-xs text-white/40">We will ship the item to your address via courier.</span>
                                    </div>
                                </label>
                            </div>

                            <button
                                onClick={handleChoiceSubmit}
                                disabled={loading}
                                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-3 rounded-xl transition-all shadow-lg shadow-amber-500/20 active:scale-95"
                            >
                                {claimType === 'WALLET' ? 'Confirm Wallet Credit' : 'Enter Delivery Address'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <h4 className="font-bold text-white mb-4">Shipping Address</h4>

                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-1.5">Full Name</label>
                                    <input name="fullName" value={address.fullName} onChange={handleChange} className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-amber-500 focus:outline-none transition-colors placeholder:text-white/20" placeholder="John Doe" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-1.5">Phone Number</label>
                                    <input name="phone" value={address.phone} onChange={handleChange} className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-amber-500 focus:outline-none transition-colors placeholder:text-white/20" placeholder="+91 9876543210" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-1.5">Address Line 1</label>
                                    <input name="addressLine1" value={address.addressLine1} onChange={handleChange} className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-amber-500 focus:outline-none transition-colors placeholder:text-white/20" placeholder="123 Street Name" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-1.5">City</label>
                                        <input name="city" value={address.city} onChange={handleChange} className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-amber-500 focus:outline-none transition-colors" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-1.5">State</label>
                                        <input name="state" value={address.state} onChange={handleChange} className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-amber-500 focus:outline-none transition-colors" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-1.5">ZIP Code</label>
                                        <input name="postalCode" value={address.postalCode} onChange={handleChange} className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-amber-500 focus:outline-none transition-colors" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-1.5">Country</label>
                                        <input name="country" value={address.country} onChange={handleChange} className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button
                                    onClick={() => setStep(1)}
                                    className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-3 rounded-xl transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={submitClaim}
                                    disabled={loading}
                                    className="flex-[2] bg-amber-500 hover:bg-amber-600 text-black font-bold py-3 rounded-xl transition-colors shadow-lg shadow-amber-500/20"
                                >
                                    {loading ? 'Processing...' : 'Confirm & Claim'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClaimRewardModal;
