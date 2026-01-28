import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { plansService } from '../../services/plans.service';
import settingsService from '../../services/settings.service';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Check, FileText, PenTool, Gift } from 'lucide-react';
import { motion } from 'framer-motion';
import PlanCard from '../../components/PlanCard';

export default function Plans() {
    const { user } = useAuth();
    const [plans, setPlans] = useState([]);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState(null);

    useEffect(() => {
        Promise.all([
            plansService.getAllPlans(),
            settingsService.getFinancialSettings()
        ]).then(([plansData, settingsData]) => {
            setPlans(plansData);
            setSettings(settingsData);
        }).catch(err => {
            console.error('Failed to load data:', err);
        }).finally(() => {
            setLoading(false);
        });
    }, []);

    if (loading) {
        return <div className="text-white/50 p-8">Loading indexes...</div>;
    }

    return (
        <div className="space-y-6 sm:space-y-8">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2 tracking-tight">Indexes</h1>
                    <p className="text-sm sm:text-base text-white/50">Select an index tailored to your liquidity and risk profile.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {plans.filter(p => p.status === 'ACTIVE').map((plan) => (
                    <PlanCard
                        key={plan.id}
                        plan={plan}
                        onSelect={() => setSelectedPlan(plan)}
                        showPrincipalTax={true}
                        principalTax={settings?.principalTax || 0}
                    />
                ))}
            </div>

            <AgreementModal plan={selectedPlan} onClose={() => setSelectedPlan(null)} user={user} settings={settings} />
        </div>
    );
}

function AgreementModal({ plan, onClose, user, settings }) {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Read, 2: Sign, 3: Success
    const [isSigning, setIsSigning] = useState(false);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (!plan) setStep(1);
    }, [plan]);

    if (!plan) return null;

    const handleSign = async () => {
        setIsSigning(true);
        try {
            await plansService.purchasePlan(plan.id);
            setStep(3);
        } catch (err) {
            alert(err.response?.data?.message || err.message || "Failed to purchase plan");
            onClose();
        } finally {
            setIsSigning(false);
        }
    };

    return (
        <Modal isOpen={!!plan} onClose={onClose} maxWidth="max-w-3xl">
            {step === 3 ? (
                <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center h-full">
                    <motion.div
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="w-16 h-16 sm:w-24 sm:h-24 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-4 sm:mb-6"
                    >
                        <Check size={32} className="sm:w-12 sm:h-12" />
                    </motion.div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Portfolio Activated</h2>
                    <p className="text-sm sm:text-base text-white/50 mb-6 max-w-md px-4">Your capital has been successfully allocated to the {plan.name} strategy. Returns will initiate within 24 hours.</p>

                    {/* Reward Claim Prompt */}
                    {plan.reward && (
                        <div className="mb-6 p-4 sm:p-6 bg-amber-500/10 border border-amber-500/30 rounded-xl max-w-sm w-full">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                                    <Gift size={20} className="text-amber-500" />
                                </div>
                                <div className="text-left">
                                    <p className="text-xs text-amber-500/80 uppercase font-bold tracking-wider">You've Earned a Gift!</p>
                                    <p className="text-white font-bold">{plan.reward.name}</p>
                                </div>
                            </div>
                            <p className="text-xs text-white/50 mb-4 text-left">Claim your reward now - choose wallet credit or physical delivery.</p>
                            <Button
                                onClick={() => { onClose(); setStep(1); navigate('/dashboard/referrals', { state: { justPurchased: true } }); }}
                                className="w-full bg-amber-500 hover:bg-amber-600 text-black"
                            >
                                <Gift size={16} /> Claim Your Reward
                            </Button>
                        </div>
                    )}

                    <Button variant="ghost" onClick={() => { onClose(); setStep(1); }}>
                        Return to Dashboard
                    </Button>
                </div>
            ) : (
                <div className="space-y-4 sm:space-y-6">
                    <div className="flex items-center gap-3 text-white mb-4 sm:mb-6">
                        <FileText size={20} className="sm:w-6 sm:h-6 text-white/60" />
                        <h3 className="text-lg sm:text-xl font-bold">Investment Agreement</h3>
                    </div>

                    <div className="bg-black/40 border border-white/5 rounded-xl p-4 sm:p-8 font-mono text-xs sm:text-sm text-white/60 leading-relaxed h-[40vh] sm:h-[50vh] overflow-y-auto scrollbar-thin-dark">
                        <p className="mb-4 text-[10px] sm:text-xs font-bold text-white/30 uppercase">Contract ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                        <p className="mb-6">
                            This CLIENT AGREEMENT (the "Agreement") is entered into by and between Investoo Inc. ("Manager") and the undersigned investor ("{user?.name || 'Client'}").
                        </p>
                        <div className="space-y-4 pl-3 sm:pl-4 border-l-2 border-white/10 my-6 sm:my-8">
                            <p>
                                <strong>1. ALLOCATION</strong><br />
                                Client accepts to allocate <span className="text-white">{parseFloat(plan.price).toLocaleString()} USDT</span> into the <span className="text-white">{plan.name}</span> strategy.
                            </p>
                            <p>
                                <strong>2. LOCK-IN PERIOD</strong><br />
                                The capital will be deployed for a minimum of <span className="text-white">{plan.validity} days</span>. Early withdrawal is subject to penalty.
                            </p>
                            <p>
                                <strong>3. RISK DISCLOSURE</strong><br />
                                Past performance is not indicative of future results. Algorithmic trading involves significant risk.
                            </p>
                            {settings?.principalTax > 0 && (
                                <p>
                                    <strong>4. EXIT TAX</strong><br />
                                    A principal tax of <span className="text-white">{settings.principalTax}%</span> will be deducted from the capital amount upon maturity.
                                </p>
                            )}
                        </div>
                        <p className="mt-6 sm:mt-8 text-[10px] sm:text-xs opacity-50">
                            Generated: {new Date().toLocaleString()}
                        </p>
                    </div>

                    <div className="pt-4 sm:pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                        <Button variant="ghost" onClick={onClose} className="order-2 sm:order-1">Decline</Button>
                        <Button onClick={handleSign} isLoading={isSigning} className="min-w-[200px] order-1 sm:order-2">
                            <PenTool size={16} /> Digitally Sign & Execute
                        </Button>
                    </div>
                </div>
            )
            }
        </Modal >
    )
}
