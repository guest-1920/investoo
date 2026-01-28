import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services';
import { StatusBadge } from '../../components/ui/StatusBadge';
import './FulfillmentDetailPage.css';

interface Fulfillment {
    id: string;
    status: string;
    trackingNumber?: string;
    adminNotes?: string;
    createdAt: string;
    user: {
        id: string;
        name: string;
        email: string;
        phone?: string;
    };
    reward: {
        id: string;
        name: string;
        type: string;
        value: number;
        imageUrl?: string;
    };
    address?: {
        id: string;
        fullName: string;
        phone: string;
        addressLine1: string;
        addressLine2?: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };
}

export function FulfillmentDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [fulfillment, setFulfillment] = useState<Fulfillment | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [trackingNumber, setTrackingNumber] = useState('');
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchFulfillment();
    }, [id]);

    const fetchFulfillment = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/referrals/fulfillments/admin/${id}`);
            setFulfillment(response.data);
            setTrackingNumber(response.data.trackingNumber || '');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load fulfillment');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus: string) => {
        try {
            setUpdating(true);
            await api.patch(`/referrals/fulfillments/admin/${id}/status`, {
                status: newStatus,
                trackingNumber: trackingNumber || undefined,
            });
            await fetchFulfillment();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update status');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="spinner"></div>
            </div>
        );
    }

    if (error || !fulfillment) {
        return (
            <div className="card">
                <div className="card-body">
                    <div className="alert alert-danger">{error || 'Fulfillment not found'}</div>
                    <button className="btn btn-secondary" onClick={() => navigate('/referrals/fulfillments')}>
                        ← Back to Fulfillments
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fulfillment-detail-page">
            <div className="page-header">
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/referrals/fulfillments')}>
                    ← Back
                </button>
                <h1>Fulfillment Details</h1>
            </div>

            <div className="detail-grid">
                {/* User Information */}
                <div className="card">
                    <div className="card-header">
                        <h3>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                            User Information
                        </h3>
                    </div>
                    <div className="card-body">
                        <div className="info-row">
                            <span className="label">Name</span>
                            <span className="value">{fulfillment.user.name}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">Email</span>
                            <span className="value">{fulfillment.user.email}</span>
                        </div>
                        {fulfillment.user.phone && (
                            <div className="info-row">
                                <span className="label">Phone</span>
                                <span className="value">{fulfillment.user.phone}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Reward Information */}
                <div className="card">
                    <div className="card-header">
                        <h3>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                            </svg>
                            Reward Information
                        </h3>
                    </div>
                    <div className="card-body">
                        <div className="info-row">
                            <span className="label">Name</span>
                            <span className="value">{fulfillment.reward.name}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">Type</span>
                            <span className="value">
                                <StatusBadge value={fulfillment.reward.type} />
                            </span>
                        </div>
                        <div className="info-row">
                            <span className="label">Value</span>
                            <span className="value">{fulfillment.reward.value.toLocaleString()} USDT</span>
                        </div>
                    </div>
                </div>

                {/* Delivery Address (if physical) */}
                {fulfillment.address && (
                    <div className="card full-width">
                        <div className="card-header">
                            <h3>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="1" y="3" width="15" height="13" />
                                    <path d="M16 8V3h5l3 5v5h-3m-5 0H1M8 21h8M7 21a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm10 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
                                </svg>
                                Delivery Address
                            </h3>
                        </div>
                        <div className="card-body">
                            <div className="address-grid">
                                <div className="info-row">
                                    <span className="label">Full Name</span>
                                    <span className="value">{fulfillment.address.fullName}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">Phone</span>
                                    <span className="value">{fulfillment.address.phone}</span>
                                </div>
                                <div className="info-row full-width">
                                    <span className="label">Address</span>
                                    <span className="value">
                                        {fulfillment.address.addressLine1}
                                        {fulfillment.address.addressLine2 && `, ${fulfillment.address.addressLine2}`}
                                    </span>
                                </div>
                                <div className="info-row">
                                    <span className="label">City</span>
                                    <span className="value">{fulfillment.address.city}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">State</span>
                                    <span className="value">{fulfillment.address.state}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">Postal Code</span>
                                    <span className="value">{fulfillment.address.postalCode}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Status & Actions */}
                <div className="card full-width">
                    <div className="card-header">
                        <h3>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="3" />
                                <path d="M12 1v6m0 6v6M4.2 4.2l4.2 4.2m5.6 5.6l4.2 4.2M1 12h6m6 0h6M4.2 19.8l4.2-4.2m5.6-5.6l4.2-4.2" />
                            </svg>
                            Status & Actions
                        </h3>
                    </div>
                    <div className="card-body">
                        <div className="info-row">
                            <span className="label">Current Status</span>
                            <span className="value">
                                <StatusBadge value={fulfillment.status} />
                            </span>
                        </div>

                        <div className="action-buttons">
                            {fulfillment.status === 'PENDING' && (
                                <button
                                    className="btn btn-primary"
                                    onClick={() => handleStatusUpdate('PROCESSING')}
                                    disabled={updating}
                                >
                                    {updating ? 'Updating...' : 'Mark as Processing'}
                                </button>
                            )}
                            {fulfillment.status === 'PROCESSING' && fulfillment.reward.type === 'PHYSICAL' && (
                                <button
                                    className="btn btn-primary"
                                    onClick={() => handleStatusUpdate('SHIPPED')}
                                    disabled={updating}
                                >
                                    {updating ? 'Updating...' : 'Mark as Shipped'}
                                </button>
                            )}
                            {fulfillment.status === 'SHIPPED' && (
                                <button
                                    className="btn btn-success"
                                    onClick={() => handleStatusUpdate('DELIVERED')}
                                    disabled={updating}
                                >
                                    {updating ? 'Updating...' : 'Mark as Delivered'}
                                </button>
                            )}
                            {fulfillment.status !== 'DELIVERED' && fulfillment.status !== 'FAILED' && (
                                <button
                                    className="btn btn-danger"
                                    onClick={() => handleStatusUpdate('FAILED')}
                                    disabled={updating}
                                >
                                    Mark as Failed
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FulfillmentDetailPage;
