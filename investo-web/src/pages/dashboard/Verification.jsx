import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ShieldCheck, UserCheck, Camera, UploadCloud, CheckCircle, AlertCircle, FileStack } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Verification() {
    const [status, setStatus] = useState('unverified'); // unverified | pending | verified | rejected
    const [step, setStep] = useState(1); // 1: Info, 2: Docs, 3: Selfie

    if (status === 'verified') {
        return <StatusCard icon={ShieldCheck} title="Identity Verified" desc="Your account is fully compliant. You have access to unlimited withdrawals and higher deposit limits." color="text-green-500" bg="bg-green-500/10" btn={null} />;
    }

    if (status === 'pending') {
        return <StatusCard icon={Clock} title="Verification in Progress" desc="Our compliance team is reviewing your documents. This usually takes 24-48 hours." color="text-yellow-500" bg="bg-yellow-500/10" btn={<Button variant="outline" className="mt-4">Check Status</Button>} />;
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Identity Verification (KYC)</h1>
                <p className="text-white/50 max-w-lg mx-auto">To comply with global AML/CFT regulations, we require all investors to verify their identity.</p>
            </div>

            {/* Stepper */}
            <div className="flex justify-between items-center px-12 relative">
                <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-white/10 -z-10" />
                <StepIndicator num={1} label="Personal Info" current={step} />
                <StepIndicator num={2} label="Documents" current={step} />
                <StepIndicator num={3} label="Liveness" current={step} />
            </div>

            <Card className="p-8 md:p-12 overflow-hidden relative">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {step === 1 && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-white">Personal Information</h3>
                            <div className="grid grid-cols-2 gap-6">
                                <Input label="First Name" />
                                <Input label="Last Name" />
                            </div>
                            <Input label="Date of Birth" type="date" />
                            <Input label="Residential Address" />
                            <div className="grid grid-cols-2 gap-6">
                                <Input label="City" />
                                <Input label="Country" />
                            </div>
                            <Button className="w-full" onClick={() => setStep(2)}>Continue to Documents</Button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-white">Document Upload</h3>
                                <button onClick={() => setStep(1)} className="text-sm text-white/40">Back</button>
                            </div>

                            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex gap-3 text-sm text-blue-200">
                                <AlertCircle className="shrink-0" size={20} />
                                <p>Please upload a valid Passport, National ID, or Driver's License. Ensure corners are visible and text is readable.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <UploadBox label="Front of ID" />
                                <UploadBox label="Back of ID" />
                            </div>

                            <Button className="w-full" onClick={() => setStep(3)}>Continue to Liveness</Button>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-8 text-center">
                            <div className="flex items-center justify-between text-left">
                                <h3 className="text-xl font-bold text-white">Liveness Check</h3>
                                <button onClick={() => setStep(2)} className="text-sm text-white/40">Back</button>
                            </div>

                            <div className="w-48 h-48 mx-auto rounded-full bg-black border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-2 text-white/40 relative overflow-hidden group hover:border-white/50 transition-colors cursor-pointer">
                                <Camera size={32} />
                                <span className="text-xs font-bold uppercase">Take Selfie</span>
                            </div>

                            <p className="text-white/50 text-sm max-w-sm mx-auto">
                                Please allow camera access. Position your face within the circle and follow the on-screen instructions.
                            </p>

                            <Button className="w-full" onClick={() => setStatus('pending')}>Submit for Review</Button>
                        </div>
                    )}
                </motion.div>
            </Card>
        </div>
    );
}

function StepIndicator({ num, label, current }) {
    const active = current >= num;
    const currentStep = current === num;
    return (
        <div className="flex flex-col items-center gap-2 bg-background px-2 z-10">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${active ? 'bg-white text-black border-white' : 'bg-black text-white/30 border-white/10'
                }`}>
                {active ? <CheckCircle size={16} /> : num}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${currentStep ? 'text-white' : 'text-white/30'}`}>{label}</span>
        </div>
    )
}

function UploadBox({ label }) {
    return (
        <div className="h-40 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-2 text-white/40 hover:bg-white/5 hover:border-white/20 transition-all cursor-pointer">
            <UploadCloud size={24} />
            <span className="text-xs font-bold uppercase">{label}</span>
        </div>
    )
}

function StatusCard({ icon: Icon, title, desc, color, bg, btn }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[500px] text-center max-w-lg mx-auto">
            <div className={`w-24 h-24 rounded-full ${bg} ${color} flex items-center justify-center mb-6`}>
                <Icon size={48} />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">{title}</h2>
            <p className="text-white/50 mb-8">{desc}</p>
            {btn}
        </div>
    )
}

const Clock = ({ size, className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
)
