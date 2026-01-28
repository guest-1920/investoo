import { useNavigate } from 'react-router-dom';
import { CrudContainer } from '../../components/smart/CrudContainer';
import { api } from '../../services';
import type { GridAction } from '../../components/smart/Grid';

export function ReferralWindowsPage() {
    const navigate = useNavigate();

    const handleRowClick = (row: Record<string, unknown>) => {
        navigate(`/referrals/windows/${row.id}`);
    };

    const handleAction = async (action: string, row: Record<string, unknown>) => {
        try {
            if (action === 'activate') {
                await api.patch(`/referrals/windows/${row.id}/activate`, {});
            } else if (action === 'deactivate') {
                await api.patch(`/referrals/windows/${row.id}/deactivate`, {});
            }
            window.location.reload();
        } catch (error) {
            console.error('Action failed', error);
        }
    };

    const actions: GridAction[] = [
        {
            label: 'Activate',
            onClick: (row) => handleAction('activate', row),
        },
        {
            label: 'Deactivate',
            onClick: (row) => handleAction('deactivate', row),
        }
    ];

    return (
        <CrudContainer
            entityName="Referral Window"
            listEndpoint="/referrals/windows/admin/all"
            actionEndpoint="/referrals/windows"
            schemaName="referral-windows"
            formSchemaName="create-referral-window"
            title="Referral Windows Dashboard"
            allowCreate={true}
            allowEdit={true}
            allowDelete={true}
            onRowClick={handleRowClick}
            actions={actions}
        />
    );
}

export default ReferralWindowsPage;
