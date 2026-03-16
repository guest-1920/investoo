import React, { useState, useEffect } from 'react';
import rechargeService from '../../../services/recharge.service';
import settingsService from '../../../services/settings.service';
import DepositIntentStep from './deposit-steps/DepositIntentStep';
import DepositFormStep from './deposit-steps/DepositFormStep';
import DepositConfirmStep from './deposit-steps/DepositConfirmStep';
import DepositSuccessStep from './deposit-steps/DepositSuccessStep';

export default function DepositTab() {
    const [step, setStep] = useState('intent'); // intent | form | confirm
    const [amount, setAmount] = useState('');
    const [transactionId, setTransactionId] = useState('');
    const [chainName, setChainName] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [settings, setSettings] = useState(null);

    useEffect(() => {
        settingsService.getFinancialSettings().then(setSettings).catch(console.error);
    }, []);

    const handleInitialSubmit = () => {
        if (!chainName) {
            alert('Please select a network first');
            return;
        }
        setStep('confirm');
        setError(null);
    };

    const handleFinalSubmit = async () => {
        setIsSubmitting(true);
        setError(null);
        try {
            await rechargeService.requestRecharge(Number(amount), transactionId, chainName);
            setSuccess(true);
        } catch (err) {
            let errorMessage = err.response?.data?.message || err.message;
            if (errorMessage && errorMessage.includes('Internal server error')) {
                errorMessage = "This transaction ID has likely already been used. Please check your history or contact support.";
            }
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (success) {
        return (
            <DepositSuccessStep
                amount={amount}
                onReset={() => {
                    setSuccess(false);
                    setStep('intent');
                    setError(null);
                    setAmount('');
                    setAmount('');
                    setTransactionId('');
                }}
            />
        );
    }

    if (step === 'intent') {
        return <DepositIntentStep onNext={() => setStep('form')} />;
    }

    if (step === 'confirm') {
        return (
            <DepositConfirmStep
                amount={amount}
                chainName={chainName}
                transactionId={transactionId}
                isSubmitting={isSubmitting}
                error={error}
                onBack={() => setStep('form')}
                onConfirm={handleFinalSubmit}
            />
        );
    }

    // Default to 'form' step
    return (
        <DepositFormStep
            amount={amount}
            setAmount={setAmount}
            transactionId={transactionId}
            setTransactionId={setTransactionId}
            chainName={chainName}
            setChainName={setChainName}
            isSubmitting={isSubmitting}
            onCancel={() => setStep('intent')}
            onSubmit={handleInitialSubmit}
            settings={settings}
        />
    );
}
