import { useState, useEffect, useCallback } from 'react';
import { api, schemaService, type GridColumnSchema, type PaginatedResponse } from '../../services';
import { Grid, type GridAction } from './Grid';
import { Modal } from '../ui/Modal';
import { DynamicForm } from './DynamicForm';
import type { FieldSchema } from '../../services';
import './CrudContainer.css';

export interface CrudContainerProps {
    entityName: string;
    listEndpoint: string; // Endpoint to fetch grid data
    actionEndpoint?: string; // Optional endpoint for Create/Update/Delete if different from listEndpoint
    schemaName: string;
    formSchemaName?: string;
    title: string;
    allowCreate?: boolean;
    allowEdit?: boolean;
    allowDelete?: boolean;
    onRowClick?: (row: Record<string, unknown>) => void;
    actions?: GridAction[];
    filters?: Record<string, string | number>;
}

interface CrudState {
    data: Record<string, unknown>[];
    columns: GridColumnSchema[];
    formFields: FieldSchema[];
    loading: boolean;
    error: string | null;
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export function CrudContainer({
    entityName,
    listEndpoint,
    actionEndpoint,
    schemaName,
    formSchemaName,
    title,
    allowCreate = false,
    allowEdit = false,
    allowDelete = false,
    onRowClick,
    actions = [],
    filters = {},
}: CrudContainerProps) {
    const [state, setState] = useState<CrudState>({
        data: [],
        columns: [],
        formFields: [],
        loading: true,
        error: null,
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    });

    const [modalState, setModalState] = useState<{
        isOpen: boolean;
        mode: 'create' | 'edit';
        editingItem: Record<string, unknown> | null;
        saving: boolean;
    }>({
        isOpen: false,
        mode: 'create',
        editingItem: null,
        saving: false,
    });

    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        item: Record<string, unknown> | null;
        deleting: boolean;
    }>({
        isOpen: false,
        item: null,
        deleting: false,
    });

    // Fetch schema
    useEffect(() => {
        const fetchSchema = async () => {
            try {
                const gridSchema = await schemaService.getGridSchema(schemaName);
                setState(prev => ({ ...prev, columns: gridSchema.columns }));

                if (formSchemaName && (allowCreate || allowEdit)) {
                    const formSchema = await schemaService.getFormSchema(formSchemaName);
                    setState(prev => ({ ...prev, formFields: formSchema.fields }));
                }
            } catch (err) {
                console.error('Failed to fetch schema:', err);
            }
        };
        fetchSchema();
    }, [schemaName, formSchemaName, allowCreate, allowEdit]);

    // Fetch data
    const fetchData = useCallback(async (page: number, limit: number) => {
        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: String(limit),
                ...Object.fromEntries(
                    Object.entries(filters).map(([k, v]) => [k, String(v)])
                ),
            });

            const response = await api.get<PaginatedResponse<Record<string, unknown>>>(
                `${listEndpoint}?${params}`
            );

            // Handle both paginated and non-paginated responses
            const responseData = response.data;
            if (Array.isArray(responseData)) {
                setState(prev => ({
                    ...prev,
                    data: responseData,
                    total: responseData.length,
                    totalPages: 1,
                    loading: false,
                }));
            } else {
                // Support both structures:
                // 1. Nested meta: { data, meta: { totalItems, totalPages, page, limit } }
                // 2. Flat structure: { data, totalItems, totalPages, page, limit }
                const meta = (responseData as any).meta;
                const rd = responseData as any;

                setState(prev => ({
                    ...prev,
                    data: rd.data || [],
                    total: meta?.totalItems ?? rd.totalItems ?? rd.total ?? 0,
                    totalPages: meta?.totalPages ?? rd.totalPages ?? 1,
                    page: meta?.page ?? rd.page ?? prev.page,
                    loading: false,
                }));
            }
        } catch (err: unknown) {
            const error = err as { message?: string };
            setState(prev => ({
                ...prev,
                error: error.message || 'Failed to fetch data',
                loading: false,
            }));
        }
    }, [listEndpoint, filters]);

    // Initial data fetch when schema is loaded
    useEffect(() => {
        if (state.columns.length > 0) {
            fetchData(state.page, state.limit);
        }
        // Only run when columns are first loaded
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.columns.length]);

    const handlePageChange = (newPage: number) => {
        setState(prev => ({ ...prev, page: newPage }));
        fetchData(newPage, state.limit);
    };

    const handleCreate = () => {
        setModalState({
            isOpen: true,
            mode: 'create',
            editingItem: null,
            saving: false,
        });
    };

    const handleEdit = (item: Record<string, unknown>) => {
        setModalState({
            isOpen: true,
            mode: 'edit',
            editingItem: item,
            saving: false,
        });
    };

    const handleDelete = (item: Record<string, unknown>) => {
        setDeleteModal({
            isOpen: true,
            item,
            deleting: false,
        });
    };

    const handleFormSubmit = async (values: Record<string, unknown>) => {
        setModalState(prev => ({ ...prev, saving: true }));

        const targetEndpoint = actionEndpoint || listEndpoint;

        try {
            if (modalState.mode === 'create') {
                await api.post(targetEndpoint, values);
            } else {
                await api.patch(`${targetEndpoint}/${modalState.editingItem?.id}`, values);
            }
            setModalState({ isOpen: false, mode: 'create', editingItem: null, saving: false });
            fetchData(state.page, state.limit);
        } catch (err) {
            console.error('Form submit error:', err);
            setModalState(prev => ({ ...prev, saving: false }));
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deleteModal.item) return;

        setDeleteModal(prev => ({ ...prev, deleting: true }));

        const targetEndpoint = actionEndpoint || listEndpoint;

        try {
            await api.delete(`${targetEndpoint}/${deleteModal.item.id}`);
            setDeleteModal({ isOpen: false, item: null, deleting: false });
            fetchData(state.page, state.limit);
        } catch (err) {
            console.error('Delete error:', err);
            setDeleteModal(prev => ({ ...prev, deleting: false }));
        }
    };

    // Build actions array
    const allActions: GridAction[] = [
        ...actions,
        ...(allowEdit ? [{
            label: 'Edit',
            variant: 'secondary' as const,
            onClick: handleEdit,
        }] : []),
        ...(allowDelete ? [{
            label: 'Delete',
            variant: 'danger' as const,
            onClick: handleDelete,
        }] : []),
    ];

    return (
        <div className="crud-container">
            <div className="crud-header">
                <h2>{title}</h2>
                {allowCreate && (
                    <button className="btn btn-primary" onClick={handleCreate}>
                        + Create New
                    </button>
                )}
            </div>

            {state.error && (
                <div className="crud-error">
                    {state.error}
                </div>
            )}

            <Grid
                columns={state.columns}
                data={state.data}
                loading={state.loading}
                onRowClick={onRowClick}
                actions={allActions.length > 0 ? allActions : undefined}
                actionStyle="menu"
                pagination={{
                    page: state.page,
                    limit: state.limit,
                    total: state.total,
                    totalPages: state.totalPages,
                    onPageChange: handlePageChange,
                }}
            />

            {/* Create/Edit Modal */}
            <Modal
                isOpen={modalState.isOpen}
                onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
                title={modalState.mode === 'create' ? `Create ${entityName}` : `Edit ${entityName}`}
                size="lg"
            >
                <DynamicForm
                    fields={state.formFields}
                    initialValues={modalState.editingItem || {}}
                    onSubmit={handleFormSubmit}
                    onCancel={() => setModalState(prev => ({ ...prev, isOpen: false }))}
                    submitLabel={modalState.mode === 'create' ? 'Create' : 'Save Changes'}
                    loading={modalState.saving}
                />
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
                title="Confirm Delete"
                footer={
                    <>
                        <button
                            className="btn btn-secondary"
                            onClick={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
                            disabled={deleteModal.deleting}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn btn-danger"
                            onClick={handleDeleteConfirm}
                            disabled={deleteModal.deleting}
                        >
                            {deleteModal.deleting ? 'Deleting...' : 'Delete'}
                        </button>
                    </>
                }
            >
                <p>Are you sure you want to delete this item? This action cannot be undone.</p>
            </Modal>
        </div>
    );
}

export default CrudContainer;
