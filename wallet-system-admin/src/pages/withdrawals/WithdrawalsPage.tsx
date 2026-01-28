import { useState, useEffect, useCallback, useRef } from 'react';
import { api, schemaService, type GridColumnSchema, type PaginatedResponse } from '../../services';
import { Grid, type GridAction } from '../../components/smart/Grid';
import { Modal } from '../../components/ui/Modal';
import { CheckIcon, CrossIcon } from '../../components/ui/Icons';
import './WithdrawalsPage.css';

type StatusFilter = 'all' | 'PENDING' | 'APPROVED' | 'REJECTED';

export function WithdrawalsPage() {
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
        saving: boolean;
    }>({
        isOpen: false,
        action: null,
        itemId: null,
        remark: '',
        saving: false,
    });

    const fetchData = useCallback(async (currentPage: number, currentFilter: StatusFilter, cols: GridColumnSchema[]) => {
        setLoading(true);
        try {
            let columnsToUse = cols;
            if (columnsToUse.length === 0) {
                const schema = await schemaService.getGridSchema('withdrawals');
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
                `/withdrawals?${params}`
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
            console.error('Failed to fetch withdrawals:', err);
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
            saving: false,
        });
    };

    const handleReject = (row: Record<string, unknown>) => {
        setRemarkModal({
            isOpen: true,
            action: 'REJECTED',
            itemId: row.id as string,
            remark: '',
            saving: false,
        });
    };

    const handleDecision = async () => {
        if (!remarkModal.itemId || !remarkModal.action) return;

        setRemarkModal(prev => ({ ...prev, saving: true }));

        try {
            await api.patch(`/withdrawals/${remarkModal.itemId}`, {
                status: remarkModal.action,
                adminRemark: remarkModal.remark,
            });

            setRemarkModal({
                isOpen: false,
                action: null,
                itemId: null,
                remark: '',
                saving: false,
            });

            fetchData(page, statusFilter, columns);
        } catch (err) {
            console.error('Failed to update withdrawal:', err);
            setRemarkModal(prev => ({ ...prev, saving: false }));
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
                <h2>Withdrawal Requests</h2>
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

            {/* Decision Modal */}
            <Modal
                isOpen={remarkModal.isOpen}
                onClose={() => setRemarkModal(prev => ({ ...prev, isOpen: false }))}
                title={remarkModal.action === 'APPROVED' ? 'Approve Withdrawal' : 'Reject Withdrawal'}
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
                            className={`btn ${remarkModal.action === 'APPROVED' ? 'btn-success' : 'btn-danger'}`}
                            onClick={handleDecision}
                            disabled={remarkModal.saving}
                        >
                            {remarkModal.saving ? 'Processing...' : remarkModal.action === 'APPROVED' ? 'Approve' : 'Reject'}
                        </button>
                    </>
                }
            >
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
            </Modal>
        </div>
    );
}

export default WithdrawalsPage;
