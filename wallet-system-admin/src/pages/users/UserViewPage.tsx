import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services';
import { ViewContainer, type ViewTab, type HeaderField } from '../../components/smart/ViewContainer';
import { StatusBadge } from '../../components/ui/StatusBadge';

interface UserData {
    id: string;
    name: string;
    email: string;
    role: string;
    walletBalance: number;
    referralCode: string;
}

export function UserViewPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await api.get<UserData>(`/users/${id}`);
                setUser(response.data);
            } catch (err) {
                console.error('Failed to fetch user:', err);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchUser();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="card">
                <div className="card-body text-center">
                    <p>User not found</p>
                    <button className="btn btn-primary" onClick={() => navigate('/users')}>
                        Back to Users
                    </button>
                </div>
            </div>
        );
    }

    const headerFields: HeaderField[] = [
        { label: 'Name', value: user.name },
        { label: 'Email', value: user.email },
        { label: 'Role', value: <StatusBadge value={user.role} /> },
        {
            label: 'Wallet Balance',
            value: `${user.walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`
        },
        { label: 'Referral Code', value: user.referralCode },
    ];

    const tabs: ViewTab[] = [
        {
            id: 'transactions',
            label: 'Transactions',
            schemaName: 'wallet-transactions',
            apiEndpoint: '/wallet/all',
            filters: { userId: id! },
        },
        {
            id: 'subscriptions',
            label: 'Active Subscriptions',
            schemaName: 'subscriptions',
            apiEndpoint: '/subscriptions',
            filters: { userId: id!, isActive: 'true' },
        },
        {
            id: 'withdrawals',
            label: 'Pending Withdrawals',
            schemaName: 'withdrawals',
            apiEndpoint: '/withdrawals',
            filters: { userId: id!, status: 'PENDING' },
        },
        {
            id: 'recharges',
            label: 'Pending Recharges',
            schemaName: 'recharges',
            apiEndpoint: '/recharges',
            filters: { userId: id!, status: 'PENDING' },
        },
    ];

    return (
        <ViewContainer
            entityId={id!}
            headerFields={headerFields}
            tabs={tabs}
            onBack={() => navigate('/users')}
        />
    );
}

export default UserViewPage;
