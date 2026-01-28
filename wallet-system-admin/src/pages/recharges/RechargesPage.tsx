import { useState, useEffect, useCallback, useRef } from 'react';
import { api, schemaService, type GridColumnSchema, type PaginatedResponse } from '../../services';
import { Grid, type GridAction } from '../../components/smart/Grid';
import { Modal } from '../../components/ui/Modal';
import { CheckIcon, CrossIcon, EyeIcon } from '../../components/ui/Icons';
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
        extractedData: { text: string; geometry?: any }[];
        proofUrl: string | null;
        scanning: boolean;
        saving: boolean;
        error: string | null;
    }>({
        isOpen: false,
        action: null,
        itemId: null,
        remark: '',
        transactionId: '',
        extractedData: [],
        proofUrl: null,
        scanning: false,
        saving: false,
        error: null,
    });

    const [viewProofModal, setViewProofModal] = useState<{
        isOpen: boolean;
        proofUrl: string | null;
    }>({
        isOpen: false,
        proofUrl: null,
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
            transactionId: '',
            extractedData: [],
            proofUrl: row.proofUrl as string || null,
            scanning: false,
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
            transactionId: '',
            extractedData: [],
            proofUrl: row.proofUrl as string || null,
            scanning: false,
            saving: false,
            error: null,
        });
    };

    const handleViewProof = (row: Record<string, unknown>) => {
        if (row.proofUrl) {
            setViewProofModal({ isOpen: true, proofUrl: row.proofUrl as string });
        }
    };

    const handleDownloadProof = async () => {
        if (!viewProofModal.proofUrl) return;
        try {
            const response = await fetch(viewProofModal.proofUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `proof-${Date.now()}.jpg`; // Give it a name
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Download failed', err);
            window.open(viewProofModal.proofUrl, '_blank'); // Fallback
        }
    };

    const handleScanProof = async () => {
        if (!remarkModal.itemId) return;
        setRemarkModal(prev => ({ ...prev, scanning: true, extractedData: [] }));

        try {
            const response = await api.post<{ text: string, geometry: any }[]>(`/recharges/${remarkModal.itemId}/scan-proof`);
            setRemarkModal(prev => ({
                ...prev,
                scanning: false,
                extractedData: response.data
            }));
        } catch (err) {
            console.error('Scan failed', err);
            setRemarkModal(prev => ({ ...prev, scanning: false, error: 'Failed to scan proof' }));
        }
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
                extractedData: [],
                proofUrl: null,
                scanning: false,
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
        {
            label: '',
            variant: 'secondary',
            onClick: handleViewProof,
            disabled: (row) => !row.proofUrl,
            icon: <EyeIcon />,
            title: 'View Proof',
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
                size={remarkModal.proofUrl ? 'lg' : 'md'}
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
                <div style={{ display: 'flex', gap: '20px', flexDirection: 'row' }}>
                    {/* Left Column: Form */}
                    <div style={{ flex: 1, minWidth: '300px' }}>
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
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-secondary"
                                        onClick={handleScanProof}
                                        disabled={remarkModal.scanning}
                                    >
                                        {remarkModal.scanning ? 'Scanning...' : 'Scan Proof'}
                                    </button>
                                </div>

                                {remarkModal.extractedData.length > 0 && (
                                    <div style={{
                                        marginBottom: '0.5rem',
                                        fontSize: '0.85rem',
                                        color: '#333'
                                    }}>
                                        <small className="text-muted">
                                            Text extracted. Please select the distinct transaction segments from the image.
                                        </small>
                                    </div>
                                )}

                                <div style={{ position: 'relative' }}>
                                    <input
                                        id="txId"
                                        type="text"
                                        className="form-input"
                                        value={remarkModal.transactionId}
                                        onChange={(e) => setRemarkModal(prev => ({ ...prev, transactionId: e.target.value }))}
                                        placeholder="Enter Transaction ID"
                                        style={{ paddingRight: '30px' }}
                                    />
                                    {remarkModal.transactionId && (
                                        <button
                                            type="button"
                                            onClick={() => setRemarkModal(prev => ({ ...prev, transactionId: '' }))}
                                            style={{
                                                position: 'absolute',
                                                right: '8px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                border: 'none',
                                                background: 'transparent',
                                                cursor: 'pointer',
                                                color: '#999',
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}
                                            title="Clear"
                                        >
                                            <CrossIcon />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Interactive Scan */}
                    {remarkModal.proofUrl && (
                        <div style={{ flex: 1, borderLeft: '1px solid #eee', paddingLeft: '20px', display: 'flex', flexDirection: 'column' }}>
                            <label className="form-label" style={{ marginBottom: '10px' }}>Proof Preview</label>
                            <div style={{
                                position: 'relative',
                                width: '100%',
                                height: '400px',
                                background: '#f8f9fa',
                                borderRadius: '4px',
                                overflow: 'auto',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}>
                                <div style={{ position: 'relative', display: 'inline-block' }}>
                                    <img
                                        src={remarkModal.proofUrl}
                                        alt="Proof"
                                        style={{ maxWidth: '100%', maxHeight: '100%', display: 'block' }}
                                    />
                                    {remarkModal.extractedData.map((item, idx) => {
                                        if (!item.geometry) return null;
                                        const { Left, Top, Width, Height } = item.geometry;
                                        return (
                                            <div
                                                key={idx}
                                                onClick={() => setRemarkModal(prev => ({
                                                    ...prev,
                                                    transactionId: prev.transactionId ? prev.transactionId + item.text : item.text
                                                }))}
                                                style={{
                                                    position: 'absolute',
                                                    left: `${Left * 100}%`,
                                                    top: `${Top * 100}%`,
                                                    width: `${Width * 100}%`,
                                                    height: `${Height * 100}%`,
                                                    border: '2px solid rgba(37, 99, 235, 0.6)', // Primary Blue
                                                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                                                    cursor: 'pointer',
                                                    zIndex: 10
                                                }}
                                                title={item.text}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                            <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#666', textAlign: 'center' }}>
                                {remarkModal.extractedData.length > 0
                                    ? "Click highlighted boxes to copy text."
                                    : "Click 'Scan Proof' to extract text."}
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Proof Viewer Modal */}
            <Modal
                isOpen={viewProofModal.isOpen}
                onClose={() => setViewProofModal({ isOpen: false, proofUrl: null })}
                title="Proof Screenshot"
                footer={
                    <>
                        <button
                            className="btn btn-secondary"
                            onClick={() => setViewProofModal({ isOpen: false, proofUrl: null })}
                        >
                            Close
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleDownloadProof}
                        >
                            Download
                        </button>
                    </>
                }
            >
                <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px', background: '#000', overflow: 'auto' }}>
                    {viewProofModal.proofUrl ? (
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            <img
                                src={viewProofModal.proofUrl}
                                alt="Payment Proof"
                                style={{ maxWidth: '100%', maxHeight: '600px', objectFit: 'contain', display: 'block' }}
                            />
                            {/* OCR Overlays */}
                            {remarkModal.extractedData.map((item, idx) => {
                                if (!item.geometry) return null;
                                const { Left, Top, Width, Height } = item.geometry;
                                return (
                                    <div
                                        key={idx}
                                        onClick={() => setRemarkModal(prev => ({
                                            ...prev,
                                            transactionId: prev.transactionId ? prev.transactionId + item.text : item.text
                                        }))}
                                        style={{
                                            position: 'absolute',
                                            left: `${Left * 100}%`,
                                            top: `${Top * 100}%`,
                                            width: `${Width * 100}%`,
                                            height: `${Height * 100}%`,
                                            border: '2px solid rgba(37, 99, 235, 0.6)',
                                            backgroundColor: 'rgba(37, 99, 235, 0.1)',
                                            cursor: 'pointer',
                                            zIndex: 10
                                        }}
                                        title={`Click to append: ${item.text}`}
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <span style={{ color: '#fff' }}>No proof available</span>
                    )}
                </div>
            </Modal>
        </div>
    );
}

export default RechargesPage;
