import React, { useEffect, useState } from 'react';
import { plansService } from '../../services/plans.service';
import { useNavigate } from 'react-router-dom';
import PlanCard from '../PlanCard';

export default function PlansPreview() {
    const [plans, setPlans] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        plansService.getAllPlans().then(setPlans).catch(console.error);
    }, []);

    return (
        <section className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6 relative overflow-hidden">
            {/* Decorative Background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[800px] h-[400px] sm:h-[500px] bg-white/[0.02] blur-3xl rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-12 sm:mb-16 lg:mb-20">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6 tracking-tight">Institutional Yields</h2>
                    <p className="text-white/50 max-w-2xl mx-auto text-sm sm:text-base lg:text-lg px-4">
                        Access algorithmic trading strategies previously reserved for hedge funds.
                        <br className="hidden sm:block" />Select your tier to begin.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                    {plans.filter(p => p.status === 'ACTIVE').map((plan) => (
                        <PlanCard
                            key={plan.id}
                            plan={plan}
                            onSelect={() => navigate('/register')}
                            buttonText="Start Investing"
                            buttonVariant="secondary"
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
