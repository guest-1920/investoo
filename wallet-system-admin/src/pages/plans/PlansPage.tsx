import { useNavigate } from 'react-router-dom';
import { CrudContainer } from '../../components/smart/CrudContainer';
import { api } from '../../services';
import type { GridAction } from '../../components/smart/Grid';

export function PlansPage() {
    const navigate = useNavigate();

    const handleRowClick = (row: Record<string, unknown>) => {
        navigate(`/plans/${row.id}`);
    };

    const handleAction = async (action: string, row: Record<string, unknown>) => {
        try {
            if (action === 'activate') {
                await api.patch(`/plans/${row.id}/activate`, {});
            } else if (action === 'deactivate') {
                await api.patch(`/plans/${row.id}/deactivate`, {});
            }
            // Trigger refresh - CrudContainer will need a way to refresh, 
            // for now forcing page reload or we can enhance CrudContainer later.
            // A simple hack is window.location.reload() for quick verification, 
            // or we rely on CrudContainer's own state if we could trigger it. 
            // Better: Let's assume CrudContainer re-fetches if we pass a key or use ref.
            // For MVP:
            window.location.reload();
        } catch (error) {
            console.error('Action failed', error);
        }
    };

    const actions: GridAction[] = [
        {
            label: 'Activate',
            onClick: (row) => handleAction('activate', row),
            // Show only if INACTIVE? Need conditional actions in Grid?
            // For now show both or generic.
        },
        {
            label: 'Deactivate',
            onClick: (row) => handleAction('deactivate', row),
        }
    ];

    return (
        <CrudContainer
            entityName="Plan"
            listEndpoint="/plans/admin/all"
            actionEndpoint="/plans"
            schemaName="plans"
            formSchemaName="create-plan"
            title="Plan Dashboard"
            allowCreate={true}
            allowEdit={true}
            allowDelete={false}
            onRowClick={handleRowClick}
            actions={actions}
        />
    );
}

export default PlansPage;
