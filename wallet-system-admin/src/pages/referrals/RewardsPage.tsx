import { useNavigate } from 'react-router-dom';
import { CrudContainer } from '../../components/smart/CrudContainer';

export function RewardsPage() {
    const navigate = useNavigate();

    const handleRowClick = (row: Record<string, unknown>) => {
        navigate(`/referrals/rewards/${row.id}`);
    };

    return (
        <CrudContainer
            entityName="Reward"
            listEndpoint="/referrals/rewards/admin/all"
            actionEndpoint="/referrals/rewards"
            schemaName="rewards"
            formSchemaName="create-reward"
            title="Rewards Catalog"
            allowCreate={true}
            allowEdit={true}
            allowDelete={true}
            onRowClick={handleRowClick}
        />
    );
}

export default RewardsPage;
