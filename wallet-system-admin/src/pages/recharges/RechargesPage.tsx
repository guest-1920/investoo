import { useState, useEffect, useCallback, useRef } from 'react';
import { api, schemaService, type GridColumnSchema, type PaginatedResponse } from '../../services';
import { Grid, type GridAction } from '../../components/smart/Grid';
import { Modal } from '../../components/ui/Modal';
import { CheckIcon, CrossIcon } from '../../components/ui/Icons';
import './RechargesPage.css';

type StatusFilter = 'all' | 'PENDING' | 'APPROVED' | 'REJECTED';

export function RechargesPage() {
    const [data, setData] = useState<Record<string, unknown>[]>([]);
    const [columns, setColumns] = useState<GridColumnSchema[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const hasFetched = useRef(false);

    const [remarkModal, setRemarkModal] = useState<{
        isOpen: boolean;
        action: 'APPROVED' | 'REJECTED' | null;
        itemId: string | null;
        remark: string;
        transactionId: string;
        saving: boolean;
        error: string | null;
    }>({
        isOpen: false,
        action: null,
        itemId: null,
        remark: '',
        transactionId: '',
        saving: false,
        error: null,
    });

    const fetchData = useCallback(async (currentPage: number, currentFilter: StatusFilter, cols: GridColumnSchema[]) => {
        setLoading(true);
        try {
            let columnsToUse = cols;
            if (columnsToUse.length === 0) {
                const schema = await schemaService.getGridSchema('recharges');
                columnsToUse = schema.columns;
                setColumns(columnsToUse);
            }

            const params = new URLSearchParams({
                page: String(currentPage),
                limit: '10',
            });

            if (currentFilter !== 'all') {
                params.append('filters', JSON.stringify({ status: currentFilter }));
            }

            const response = await api.get<PaginatedResponse<Record<string, unknown>>>(
                `/recharges?${params}`
            );

            const responseData = response.data;
            if (Array.isArray(responseData)) {
                setData(responseData);
                setTotal(responseData.length);
                setTotalPages(1);
            } else {
                // Support both flat structure and nested meta structure
                const meta = (responseData as any).meta;

                setData(responseData.data || []);
                setTotal(meta?.totalItems ?? (responseData as any).total ?? 0);
                setTotalPages(meta?.totalPages ?? (responseData as any).totalPages ?? 1);
            }
        } catch (err) {
            console.error('Failed to fetch recharges:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!hasFetched.current) {
            hasFetched.current = true;
            fetchData(page, statusFilter, columns);
        }
    }, []);

    const handleApprove = (row: Record<string, unknown>) => {
        setRemarkModal({
            isOpen: true,
            action: 'APPROVED',
            itemId: row.id as string,
            remark: '',
            transactionId: (row.transactionId as string) || '',
            saving: false,
            error: null,
        });
    };

    const handleReject = (row: Record<string, unknown>) => {
        setRemarkModal({
            isOpen: true,
            action: 'REJECTED',
            itemId: row.id as string,
            remark: '',
            transactionId: (row.transactionId as string) || '',
            saving: false,
            error: null,
        });
    };



    const handleDecision = async () => {
        if (!remarkModal.itemId || !remarkModal.action) return;

        setRemarkModal(prev => ({ ...prev, saving: true, error: null }));

        try {
            await api.patch(`/recharges/${remarkModal.itemId}`, {
                status: remarkModal.action,
                adminRemark: remarkModal.remark,
                transactionId: remarkModal.action === 'APPROVED' ? remarkModal.transactionId : undefined
            });

            setRemarkModal({
                isOpen: false,
                action: null,
                itemId: null,
                remark: '',
                transactionId: '',
                saving: false,
                error: null,
            });

            fetchData(page, statusFilter, columns);
        } catch (err: any) {
            console.error('Failed to update recharge:', err);

            if (err.response && err.response.status === 409) {
                // Auto-switch to REJECTED mode
                setRemarkModal(prev => ({
                    ...prev,
                    saving: false,
                    error: `Transaction ID ${prev.transactionId} already used. Form switched to REJECT mode.`,
                    action: 'REJECTED',
                    remark: `Rejected due to duplicate Transaction ID: ${prev.transactionId}`
                }));
            } else {
                setRemarkModal(prev => ({
                    ...prev,
                    saving: false,
                    error: 'Failed to update recharge status. Please try again.'
                }));
            }
        }
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newFilter = e.target.value as StatusFilter;
        setStatusFilter(newFilter);
        setPage(1);
        fetchData(1, newFilter, columns);
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        fetchData(newPage, statusFilter, columns);
    };

    const actions: GridAction[] = [
        {
            label: '',
            variant: 'secondary',
            onClick: handleApprove,
            disabled: (row) => row.status !== 'PENDING',
            icon: <span className="text-success"><CheckIcon /></span>,
            title: 'Approve',
        },
        {
            label: '',
            variant: 'secondary',
            onClick: handleReject,
            disabled: (row) => row.status !== 'PENDING',
            icon: <span className="text-error"><CrossIcon /></span>,
            title: 'Reject',
        },

    ];

    return (
        <div className="requests-page">
            <div className="page-header">
                <h2>Recharge Requests</h2>
                <div className="page-filters">
                    <label className="filter-label">Filter:</label>
                    <select
                        className="form-input form-select filter-select"
                        value={statusFilter}
                        onChange={handleFilterChange}
                    >
                        <option value="all">All Requests</option>
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                    </select>
                </div>
            </div>

            <Grid
                columns={columns}
                data={data}
                loading={loading}
                actions={actions}
                pagination={{
                    page,
                    limit: 10,
                    total,
                    totalPages,
                    onPageChange: handlePageChange,
                }}
            />

            <Modal
                isOpen={remarkModal.isOpen}
                onClose={() => setRemarkModal(prev => ({ ...prev, isOpen: false }))}
                title={remarkModal.action === 'APPROVED' ? 'Approve Recharge' : 'Reject Recharge'}
                size="md"
                footer={
                    <>
                        <button
                            className="btn btn-secondary"
                            onClick={() => setRemarkModal(prev => ({ ...prev, isOpen: false }))}
                            disabled={remarkModal.saving}
                        >
                            Cancel
                        </button>
                        <button
                            className={`btn ${remarkModal.action === 'APPROVED' ? 'btn-primary' : 'btn-danger'}`}
                            onClick={handleDecision}
                            disabled={remarkModal.saving || (remarkModal.action === 'APPROVED' && !remarkModal.transactionId)}
                        >
                            {remarkModal.saving ? 'Processing...' : remarkModal.action === 'APPROVED' ? 'Approve' : 'Reject'}
                        </button>
                    </>
                }
            >
                <div style={{ display: 'flex', gap: '20px', flexDirection: 'column' }}>
                    {remarkModal.error && (
                        <div style={{
                            backgroundColor: 'var(--color-error-bg)',
                            color: 'var(--color-error)',
                            padding: 'var(--spacing-3)',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: 'var(--spacing-4)',
                            fontSize: 'var(--font-size-sm)',
                            border: '1px solid var(--color-border)',
                            borderColor: 'var(--color-error)'
                        }}>
                            {remarkModal.error}
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label" htmlFor="remark">
                            Admin Remark (Optional)
                        </label>
                        <textarea
                            id="remark"
                            className="form-input"
                            rows={3}
                            value={remarkModal.remark}
                            onChange={(e) => setRemarkModal(prev => ({ ...prev, remark: e.target.value }))}
                            placeholder="Enter a remark..."
                        />
                    </div>

                    {remarkModal.action === 'APPROVED' && (
                        <div className="form-group" style={{ marginTop: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <label className="form-label" htmlFor="txId">
                                    Transaction ID <span className="text-error">*</span>
                                </label>
                            </div>

                            <div style={{ position: 'relative' }}>
                                <input
                                    id="txId"
                                    type="text"
                                    className="form-input"
                                    value={remarkModal.transactionId}
                                    onChange={(e) => setRemarkModal(prev => ({ ...prev, transactionId: e.target.value }))}
                                    placeholder="Enter Transaction ID"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </Modal>


        </div>
    );
}

export default RechargesPage;
