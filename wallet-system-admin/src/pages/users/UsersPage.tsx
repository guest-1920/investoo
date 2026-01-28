import { useNavigate } from 'react-router-dom';
import { CrudContainer } from '../../components/smart/CrudContainer';

export function UsersPage() {
    const navigate = useNavigate();

    const handleRowClick = (row: Record<string, unknown>) => {
        navigate(`/users/${row.id}`);
    };

    return (
        <CrudContainer
            entityName="User"
            listEndpoint="/users"
            schemaName="users"
            title="User Dashboard"
            allowCreate={false}
            allowEdit={false}
            allowDelete={false}
            onRowClick={handleRowClick}
        />
    );
}

export default UsersPage;
