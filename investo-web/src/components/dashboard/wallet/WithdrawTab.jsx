import React, { useState, useEffect } from 'react';
import withdrawalsService from '../../../services/withdrawals.service';
import settingsService from '../../../services/settings.service';
import WithdrawIntentStep from './withdraw-steps/WithdrawIntentStep';
import WithdrawFormStep from './withdraw-steps/WithdrawFormStep';
import WithdrawConfirmStep from './withdraw-steps/WithdrawConfirmStep';
import WithdrawSuccessStep from './withdraw-steps/WithdrawSuccessStep';

export default function WithdrawTab({ balance }) {
    const [step, setStep] = useState('intent'); // intent | form | confirm | success
    const [amount, setAmount] = useState('');
    const [chainName, setChainName] = useState('TRC20');
    const [blockchainAddress, setBlockchainAddress] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [settings, setSettings] = useState(null);

    useEffect(() => {
        settingsService.getFinancialSettings().then(setSettings).catch(console.error);
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (!settings) return;

        const numAmount = parseFloat(amount);

        // Frontend Balance Check
        if (numAmount > balance) {
            setError('Insufficient balance in your wallet.');
            return;
        }

        if (numAmount < settings.minWithdrawal) {
            setError(`Minimum withdrawal amount is $${settings.minWithdrawal}`);
            return;
        }

        setStep('confirm');
    };

    // ... existing handleConfirm code ...

    const handleConfirm = async () => {
        setIsSubmitting(true);
        setError('');
        try {
            await withdrawalsService.requestWithdrawal(amount, blockchainAddress, chainName);
            setStep('success');
            setAmount('');
            setBlockchainAddress('');
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to request withdrawal');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (step === 'success') {
        return <WithdrawSuccessStep onReset={() => setStep('intent')} />;
    }

    if (step === 'intent') {
        return <WithdrawIntentStep onNext={() => setStep('form')} />;
    }

    if (step === 'confirm') {
        return (
            <WithdrawConfirmStep
                amount={amount}
                chainName={chainName}
                blockchainAddress={blockchainAddress}
                isSubmitting={isSubmitting}
                error={error}
                onBack={() => setStep('form')}
                onConfirm={handleConfirm}
                settings={settings}
            />
        );
    }

    return (
        <WithdrawFormStep
            balance={balance}
            amount={amount}
            setAmount={setAmount}
            chainName={chainName}
            setChainName={setChainName}
            blockchainAddress={blockchainAddress}
            setBlockchainAddress={setBlockchainAddress}
            isSubmitting={isSubmitting}
            error={error}
            onSubmit={handleSubmit}
            onBack={() => setStep('intent')}
            settings={settings}
        />
    )
}
