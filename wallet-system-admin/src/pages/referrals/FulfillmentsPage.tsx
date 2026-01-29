import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CrudContainer } from '../../components/smart/CrudContainer';
import { api } from '../../services';
import type { GridAction } from '../../components/smart/Grid';

export function FulfillmentsPage() {
    const navigate = useNavigate();
    const [showPendingOnly, setShowPendingOnly] = useState(false);

    const handleRowClick = (row: Record<string, unknown>) => {
        navigate(`/referrals/fulfillments/${row.id}`);
    };

    const handleStatusChange = async (action: string, row: Record<string, unknown>) => {
        try {
            await api.patch(`/referrals/fulfillments/admin/${row.id}/status`, { status: action });
            window.location.reload();
        } catch (error) {
            console.error('Action failed', error);
        }
    };

    const actions: GridAction[] = [
        {
            label: 'Mark Processing',
            onClick: (row) => handleStatusChange('PROCESSING', row),
        },
        {
            label: 'Mark Shipped',
            onClick: (row) => handleStatusChange('SHIPPED', row),
        },
        {
            label: 'Mark Delivered',
            onClick: (row) => handleStatusChange('DELIVERED', row),
        }
    ];

    return (
        <div>
            <div>
                <label className="flex justify-end mb-4">
                    <Input
                        type="checkbox"
                        checked={showPendingOnly}
                        onChange={(e) => setShowPendingOnly(e.target.checked)}
                    />
                    <span className="ml-2">Show Pending Only</span>
                </label>
            </div>
            <CrudContainer
                entityName="Fulfillment"
                listEndpoint={showPendingOnly ? "/referrals/fulfillments/admin/pending" : "/referrals/fulfillments/admin/all"}
                actionEndpoint="/referrals/fulfillments"
                schemaName="fulfillments"
                title="Fulfillments Queue"
                allowCreate={false}
                allowEdit={false}
                allowDelete={false}
                onRowClick={handleRowClick}
                actions={actions}
            />
        </div>
    );
}

export default FulfillmentsPage;
