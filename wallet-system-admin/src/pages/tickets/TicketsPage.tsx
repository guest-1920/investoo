import { useState, useEffect, useCallback, useRef } from 'react';
import { api, type PaginatedResponse, type GridColumnSchema } from '../../services';
import { Grid, type GridAction } from '../../components/smart/Grid';
import { Modal } from '../../components/ui/Modal';
import { EyeIcon, MessageIcon } from '../../components/ui/Icons';
import './TicketsPage.css';

type StatusFilter = 'all' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

interface TicketReply {
    id: string;
    userId: string;
    message: string;
    isAdminReply: boolean;
    createdAt: string;
    user?: { name: string; email: string };
}

interface Ticket {
    id: string;
    ticketNumber: string;
    subject: string;
    department: string;
    priority: string;
    status: string;
    createdAt: string;
    user?: { name: string; email: string };
    replies?: TicketReply[];
}

const COLUMNS: GridColumnSchema[] = [
    { name: 'ticketNumber', label: 'Ticket #', type: 'string', order: 0, hidden: false, sortable: true, filterable: false, align: 'left' },
    { name: 'user.name', label: 'User', type: 'string', order: 1, hidden: false, sortable: true, filterable: false, align: 'left' },
    { name: 'subject', label: 'Subject', type: 'string', order: 2, hidden: false, sortable: true, filterable: false, align: 'left' },
    { name: 'department', label: 'Department', type: 'string', order: 3, hidden: false, sortable: true, filterable: false, align: 'left', format: 'badge' },
    { name: 'priority', label: 'Priority', type: 'string', order: 4, hidden: false, sortable: true, filterable: false, align: 'left', format: 'badge' },
    { name: 'status', label: 'Status', type: 'string', order: 5, hidden: false, sortable: true, filterable: false, align: 'left', format: 'badge' },
    { name: 'createdAt', label: 'Created', type: 'string', order: 6, hidden: false, sortable: true, filterable: false, align: 'left', format: 'datetime' },
];

export function TicketsPage() {
    const [data, setData] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const hasFetched = useRef(false);

    // Detail modal
    const [detailModal, setDetailModal] = useState<{
        isOpen: boolean;
        ticket: Ticket | null;
        loading: boolean;
    }>({
        isOpen: false,
        ticket: null,
        loading: false,
    });

    // Reply modal
    const [replyModal, setReplyModal] = useState<{
        isOpen: boolean;
        ticketId: string | null;
        message: string;
        saving: boolean;
    }>({
        isOpen: false,
        ticketId: null,
        message: '',
        saving: false,
    });

    // Status modal
    const [statusModal, setStatusModal] = useState<{
        isOpen: boolean;
        ticketId: string | null;
        currentStatus: string;
        newStatus: string;
        saving: boolean;
    }>({
        isOpen: false,
        ticketId: null,
        currentStatus: '',
        newStatus: '',
        saving: false,
    });

    const fetchData = useCallback(async (currentPage: number, currentFilter: StatusFilter) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(currentPage),
                limit: '10',
            });

            if (currentFilter !== 'all') {
                params.append('filters', JSON.stringify({ status: currentFilter }));
            }

            const response = await api.get<PaginatedResponse<Ticket>>(`/support?${params}`);
            const responseData = response.data;

            if (Array.isArray(responseData)) {
                setData(responseData);
                setTotal(responseData.length);
                setTotalPages(1);
            } else {
                const meta = responseData.meta;
                setData(responseData.data || []);
                setTotal(meta?.totalItems ?? 0);
                setTotalPages(meta?.totalPages ?? 1);
            }
        } catch (err) {
            console.error('Failed to fetch tickets:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!hasFetched.current) {
            hasFetched.current = true;
            fetchData(page, statusFilter);
        }
    }, []);

    const handleViewDetail = async (row: Record<string, unknown>) => {
        setDetailModal({ isOpen: true, ticket: null, loading: true });
        try {
            const response = await api.get<Ticket>(`/support/${row.id}`);
            setDetailModal({ isOpen: true, ticket: response.data, loading: false });
        } catch (err) {
            console.error('Failed to fetch ticket detail:', err);
            setDetailModal({ isOpen: false, ticket: null, loading: false });
        }
    };

    const handleOpenReply = (row: Record<string, unknown>) => {
        setReplyModal({
            isOpen: true,
            ticketId: row.id as string,
            message: '',
            saving: false,
        });
    };

    const handleSendReply = async () => {
        if (!replyModal.ticketId || !replyModal.message.trim()) return;

        setReplyModal(prev => ({ ...prev, saving: true }));
        try {
            await api.post(`/support/${replyModal.ticketId}/reply`, {
                message: replyModal.message,
            });
            setReplyModal({ isOpen: false, ticketId: null, message: '', saving: false });
            fetchData(page, statusFilter);
        } catch (err) {
            console.error('Failed to send reply:', err);
            setReplyModal(prev => ({ ...prev, saving: false }));
        }
    };

    const handleOpenStatusChange = (row: Record<string, unknown>) => {
        setStatusModal({
            isOpen: true,
            ticketId: row.id as string,
            currentStatus: row.status as string,
            newStatus: row.status as string,
            saving: false,
        });
    };

    const handleUpdateStatus = async () => {
        if (!statusModal.ticketId || statusModal.newStatus === statusModal.currentStatus) return;

        setStatusModal(prev => ({ ...prev, saving: true }));
        try {
            await api.patch(`/support/${statusModal.ticketId}/status`, {
                status: statusModal.newStatus,
            });
            setStatusModal({ isOpen: false, ticketId: null, currentStatus: '', newStatus: '', saving: false });
            fetchData(page, statusFilter);
        } catch (err) {
            console.error('Failed to update status:', err);
            setStatusModal(prev => ({ ...prev, saving: false }));
        }
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newFilter = e.target.value as StatusFilter;
        setStatusFilter(newFilter);
        setPage(1);
        fetchData(1, newFilter);
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        fetchData(newPage, statusFilter);
    };

    const actions: GridAction[] = [
        {
            label: '',
            variant: 'secondary',
            onClick: handleViewDetail,
            icon: <EyeIcon />,
            title: 'View Details',
        },
        {
            label: '',
            variant: 'secondary',
            onClick: handleOpenReply,
            icon: <MessageIcon />,
            title: 'Reply',
        },
        {
            label: 'Status',
            variant: 'secondary',
            onClick: handleOpenStatusChange,
            title: 'Change Status',
        },
    ];

    const getPriorityClass = (priority: string) => {
        switch (priority) {
            case 'URGENT': return 'priority-urgent';
            case 'HIGH': return 'priority-high';
            default: return 'priority-normal';
        }
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'OPEN': return 'status-open';
            case 'IN_PROGRESS': return 'status-in-progress';
            case 'RESOLVED': return 'status-resolved';
            case 'CLOSED': return 'status-closed';
            default: return '';
        }
    };

    return (
        <div className="tickets-page">
            <div className="page-header">
                <h2>Support Tickets</h2>
                <div className="page-filters">
                    <label className="filter-label">Filter:</label>
                    <select
                        className="form-input form-select filter-select"
                        value={statusFilter}
                        onChange={handleFilterChange}
                    >
                        <option value="all">All Tickets</option>
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                    </select>
                </div>
            </div>

            <Grid
                columns={COLUMNS}
                data={data as unknown as Record<string, unknown>[]}
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

            {/* Detail Modal */}
            <Modal
                isOpen={detailModal.isOpen}
                onClose={() => setDetailModal({ isOpen: false, ticket: null, loading: false })}
                title={detailModal.ticket ? `Ticket ${detailModal.ticket.ticketNumber}` : 'Loading...'}
                size="lg"
            >
                {detailModal.loading ? (
                    <div className="loading-spinner">Loading...</div>
                ) : detailModal.ticket && (
                    <div className="ticket-detail">
                        <div className="ticket-meta">
                            <div className="meta-item">
                                <span className="meta-label">Subject:</span>
                                <span className="meta-value">{detailModal.ticket.subject}</span>
                            </div>
                            <div className="meta-item">
                                <span className="meta-label">User:</span>
                                <span className="meta-value">{detailModal.ticket.user?.name} ({detailModal.ticket.user?.email})</span>
                            </div>
                            <div className="meta-row">
                                <div className="meta-item">
                                    <span className="meta-label">Department:</span>
                                    <span className="badge">{detailModal.ticket.department}</span>
                                </div>
                                <div className="meta-item">
                                    <span className="meta-label">Priority:</span>
                                    <span className={`badge ${getPriorityClass(detailModal.ticket.priority)}`}>
                                        {detailModal.ticket.priority}
                                    </span>
                                </div>
                                <div className="meta-item">
                                    <span className="meta-label">Status:</span>
                                    <span className={`badge ${getStatusClass(detailModal.ticket.status)}`}>
                                        {detailModal.ticket.status.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="conversation">
                            <h4>Conversation</h4>
                            <div className="messages">
                                {detailModal.ticket.replies?.map((reply) => (
                                    <div key={reply.id} className={`message ${reply.isAdminReply ? 'admin' : 'user'}`}>
                                        <div className="message-header">
                                            <span className="message-author">
                                                {reply.isAdminReply ? 'Admin' : reply.user?.name || 'User'}
                                            </span>
                                            <span className="message-time">
                                                {new Date(reply.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="message-body">{reply.message}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Reply Modal */}
            <Modal
                isOpen={replyModal.isOpen}
                onClose={() => setReplyModal({ isOpen: false, ticketId: null, message: '', saving: false })}
                title="Reply to Ticket"
                footer={
                    <>
                        <button
                            className="btn btn-secondary"
                            onClick={() => setReplyModal({ isOpen: false, ticketId: null, message: '', saving: false })}
                            disabled={replyModal.saving}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleSendReply}
                            disabled={replyModal.saving || !replyModal.message.trim()}
                        >
                            {replyModal.saving ? 'Sending...' : 'Send Reply'}
                        </button>
                    </>
                }
            >
                <div className="form-group">
                    <label className="form-label" htmlFor="reply-message">
                        Your Reply
                    </label>
                    <textarea
                        id="reply-message"
                        className="form-input"
                        rows={5}
                        value={replyModal.message}
                        onChange={(e) => setReplyModal(prev => ({ ...prev, message: e.target.value }))}
                        placeholder="Type your reply here..."
                    />
                </div>
            </Modal>

            {/* Status Modal */}
            <Modal
                isOpen={statusModal.isOpen}
                onClose={() => setStatusModal({ isOpen: false, ticketId: null, currentStatus: '', newStatus: '', saving: false })}
                title="Change Ticket Status"
                footer={
                    <>
                        <button
                            className="btn btn-secondary"
                            onClick={() => setStatusModal({ isOpen: false, ticketId: null, currentStatus: '', newStatus: '', saving: false })}
                            disabled={statusModal.saving}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleUpdateStatus}
                            disabled={statusModal.saving || statusModal.newStatus === statusModal.currentStatus}
                        >
                            {statusModal.saving ? 'Updating...' : 'Update Status'}
                        </button>
                    </>
                }
            >
                <div className="form-group">
                    <label className="form-label" htmlFor="ticket-status">
                        New Status
                    </label>
                    <select
                        id="ticket-status"
                        className="form-input form-select"
                        value={statusModal.newStatus}
                        onChange={(e) => setStatusModal(prev => ({ ...prev, newStatus: e.target.value }))}
                    >
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                    </select>
                </div>
            </Modal>
        </div>
    );
}

export default TicketsPage;
