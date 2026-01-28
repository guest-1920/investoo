import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services';
import { ViewContainer, type ViewTab, type HeaderField } from '../../components/smart/ViewContainer';
import { StatusBadge } from '../../components/ui/StatusBadge';

interface PlanData {
    id: string;
    name: string;
    price: number;
    validity: number;
    status: string;
    dailyReturn: number;
    referralReward: number;
}

export function PlanViewPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [plan, setPlan] = useState<PlanData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPlan = async () => {
            try {
                const response = await api.get<PlanData>(`/plans/${id}`);
                setPlan(response.data);
            } catch (err) {
                console.error('Failed to fetch plan:', err);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchPlan();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!plan) {
        return (
            <div className="card">
                <div className="card-body text-center">
                    <p>Plan not found</p>
                    <button className="btn btn-primary" onClick={() => navigate('/plans')}>
                        Back to Plans
                    </button>
                </div>
            </div>
        );
    }

    const formatCurrency = (value: number) =>
        `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`;

    const headerFields: HeaderField[] = [
        { label: 'Plan Name', value: plan.name },
        { label: 'Price', value: formatCurrency(plan.price) },
        { label: 'Validity', value: `${plan.validity} Days` },
        { label: 'Status', value: <StatusBadge value={plan.status} /> },
        { label: 'Daily Return', value: formatCurrency(plan.dailyReturn) },
        { label: 'Referral Reward', value: formatCurrency(plan.referralReward) },
    ];

    const tabs: ViewTab[] = [
        {
            id: 'subscriptions',
            label: 'Subscriptions',
            schemaName: 'subscriptions',
            apiEndpoint: '/subscriptions',
            filters: { planId: id! },
        },
    ];

    return (
        <ViewContainer
            entityId={id!}
            headerFields={headerFields}
            tabs={tabs}
            onBack={() => navigate('/plans')}
        />
    );
}

export default PlanViewPage;
