import React from 'react';
import { Card } from '../../../ui/Card';
import { Button } from '../../../ui/Button';
import { Mail } from 'lucide-react';

export default function WithdrawSuccessStep({ onReset }) {
    return (
        <Card className="p-12 max-w-xl mx-auto flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-white/50 mb-2">
                <Mail size={40} />
            </div>
            <div>
                <h3 className="text-xl font-bold text-white mb-2">Verification Email Sent</h3>
                <p className="text-white/50 text-sm leading-relaxed max-w-sm mx-auto">
                    We've sent a confirmation link to your registered email address. Please click the link to verify and process your withdrawal.
                </p>
            </div>
            <div className="p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-xl text-yellow-200/70 text-xs mt-4">
                The link is valid for 15 minutes.
            </div>
            <Button variant="outline" onClick={onReset}>
                Go Back
            </Button>
        </Card>
    );
}
