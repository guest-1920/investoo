import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { MessageSquare, Plus, Mail, Clock, AlertCircle, CheckCircle, ArrowLeft, Send, Loader } from 'lucide-react';
import ticketsService from '../../services/tickets.service';

const DEPARTMENTS = [
    { value: 'GENERAL', label: 'General Inquiry' },
    { value: 'BILLING', label: 'Billing & Deposits' },
    { value: 'TECHNICAL', label: 'Technical Support' },
];

const PRIORITIES = [
    { value: 'NORMAL', label: 'Normal' },
    { value: 'HIGH', label: 'High' },
    { value: 'URGENT', label: 'Urgent' },
];

export default function Support() {
    const [view, setView] = useState('list'); // 'list', 'create', 'detail'
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [replyMessage, setReplyMessage] = useState('');
    const [replySending, setReplySending] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        subject: '',
        department: 'GENERAL',
        priority: 'NORMAL',
        message: '',
    });
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const response = await ticketsService.getMyTickets({ limit: 50 });
            const data = response.data.data || response.data || [];
            // Filter out closed tickets
            const activeTickets = data.filter(ticket => ticket.status !== 'CLOSED');
            setTickets(activeTickets);
        } catch (error) {
            console.error('Failed to fetch tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewTicket = async (ticketId) => {
        window.scrollTo(0, 0);
        setDetailLoading(true);
        setView('detail');
        try {
            const response = await ticketsService.getTicketDetail(ticketId);
            setSelectedTicket(response.data);
        } catch (error) {
            console.error('Failed to fetch ticket detail:', error);
            setView('list');
        } finally {
            setDetailLoading(false);
        }
    };

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        setFormError('');
        setFormLoading(true);

        try {
            await ticketsService.create(formData);
            setFormData({ subject: '', department: 'GENERAL', priority: 'NORMAL', message: '' });
            window.scrollTo(0, 0);
            setView('list');
            fetchTickets();
        } catch (error) {
            console.error('Failed to create ticket:', error);
            setFormError(error.response?.data?.message || 'Failed to create ticket. Please try again.');
        } finally {
            setFormLoading(false);
        }
    };

    const handleSendReply = async () => {
        if (!replyMessage.trim() || !selectedTicket) return;

        setReplySending(true);
        try {
            await ticketsService.addReply(selectedTicket.id, replyMessage.trim());
            setReplyMessage('');
            // Refresh ticket detail
            const response = await ticketsService.getTicketDetail(selectedTicket.id);
            setSelectedTicket(response.data);
        } catch (error) {
            console.error('Failed to send reply:', error);
        } finally {
            setReplySending(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'OPEN': return 'bg-blue-500/10 text-blue-500';
            case 'IN_PROGRESS': return 'bg-yellow-500/10 text-yellow-500';
            case 'RESOLVED': return 'bg-green-500/10 text-green-500';
            case 'CLOSED': return 'bg-white/5 text-white/40';
            default: return 'bg-white/5 text-white/40';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'URGENT': return 'text-red-500';
            case 'HIGH': return 'text-yellow-500';
            default: return 'text-white/50';
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(hours / 24);

        if (hours < 1) return 'Just now';
        if (hours < 24) return `${hours} hours ago`;
        if (days < 7) return `${days} days ago`;
        return date.toLocaleDateString();
    };

    // Ticket Detail View
    if (view === 'detail') {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <button
                    onClick={() => { window.scrollTo(0, 0); setView('list'); setSelectedTicket(null); }}
                    className="flex items-center gap-2 text-white/50 hover:text-white transition-colors"
                >
                    <ArrowLeft size={18} />
                    Back to Tickets
                </button>

                {detailLoading ? (
                    <Card className="p-8 text-center">
                        <Loader className="animate-spin mx-auto mb-4" size={32} />
                        <p className="text-white/50">Loading ticket details...</p>
                    </Card>
                ) : selectedTicket && (
                    <>
                        <Card className="p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                                        <h2 className="text-lg sm:text-xl font-bold text-white break-words">{selectedTicket.subject}</h2>
                                        <span className="text-[10px] font-mono text-white/30 bg-white/5 px-1.5 py-0.5 rounded whitespace-nowrap">
                                            #{selectedTicket.ticketNumber}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-white/50">
                                        <span>{DEPARTMENTS.find(d => d.value === selectedTicket.department)?.label}</span>
                                        <span className={getPriorityColor(selectedTicket.priority)}>
                                            {selectedTicket.priority}
                                        </span>
                                        <span>{formatDate(selectedTicket.createdAt)}</span>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide self-start sm:self-center whitespace-nowrap ${getStatusColor(selectedTicket.status)}`}>
                                    {selectedTicket.status.replace('_', ' ')}
                                </span>
                            </div>
                        </Card>

                        <Card className="p-4 sm:p-6">
                            <h3 className="text-lg font-bold text-white mb-4">Conversation</h3>
                            <div className="space-y-4 max-h-[300px] sm:max-h-[400px] overflow-y-auto mb-4 sm:mb-6 pr-2 scrollbar-thin-dark">
                                {selectedTicket.replies?.map((reply) => (
                                    <div
                                        key={reply.id}
                                        className={`p-3 sm:p-4 rounded-xl ${reply.isAdminReply
                                            ? 'bg-blue-500/10 border-l-2 border-blue-500'
                                            : 'bg-white/5 border-l-2 border-white/20'
                                            }`}
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <span className={`text-sm font-bold ${reply.isAdminReply ? 'text-blue-400' : 'text-white'
                                                }`}>
                                                {reply.isAdminReply ? 'Support Team' : 'You'}
                                            </span>
                                            <span className="text-[10px] sm:text-xs text-white/40">
                                                {formatDate(reply.createdAt)}
                                            </span>
                                        </div>
                                        <p className="text-sm sm:text-base text-white/70 whitespace-pre-wrap break-words">{reply.message}</p>
                                    </div>
                                ))}
                            </div>

                            {selectedTicket.status !== 'CLOSED' && selectedTicket.status !== 'RESOLVED' && (
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <textarea
                                        className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 resize-none text-sm sm:text-base"
                                        rows={3}
                                        value={replyMessage}
                                        onChange={(e) => setReplyMessage(e.target.value)}
                                        placeholder="Type your reply..."
                                    />
                                    <Button
                                        onClick={handleSendReply}
                                        disabled={!replyMessage.trim() || replySending}
                                        className="self-end sm:self-center w-full sm:w-auto justify-center"
                                    >
                                        {replySending ? <Loader className="animate-spin" size={18} /> : <div className="flex items-center gap-2"><Send size={18} /> <span className="sm:hidden">Send Reply</span></div>}
                                    </Button>
                                </div>
                            )}
                        </Card>
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">Support Center</h1>
                    <p className="text-white/50 text-sm sm:text-base">Get help with your account, investments, or technical issues.</p>
                </div>
                <Button onClick={() => { window.scrollTo(0, 0); setView('create'); }} className="w-full sm:w-auto justify-center">
                    <Plus size={18} /> New Ticket
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                {/* Main Content: Ticket List or Form */}
                <div className="lg:col-span-2 space-y-6">
                    {view === 'create' ? (
                        <Card className="p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg sm:text-xl font-bold text-white">Create New Request</h3>
                                <button onClick={() => { window.scrollTo(0, 0); setView('list'); }} className="text-sm text-white/40 hover:text-white">Cancel</button>
                            </div>

                            {formError && (
                                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                                    {formError}
                                </div>
                            )}

                            <form className="space-y-6" onSubmit={handleCreateTicket}>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-white/70">Department</label>
                                        <select
                                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30"
                                            value={formData.department}
                                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        >
                                            {DEPARTMENTS.map(d => (
                                                <option key={d.value} value={d.value}>{d.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-white/70">Priority</label>
                                        <select
                                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30"
                                            value={formData.priority}
                                            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                        >
                                            {PRIORITIES.map(p => (
                                                <option key={p.value} value={p.value}>{p.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <Input
                                    label="Subject"
                                    placeholder="Brief summary of the issue"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    required
                                />
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-white/70">Description</label>
                                    <textarea
                                        className="w-full h-32 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 resize-none"
                                        placeholder="Describe your issue in detail..."
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={formLoading}>
                                    {formLoading ? 'Submitting...' : 'Submit Ticket'}
                                </Button>
                            </form>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest px-1">Your Tickets</h3>
                            {loading ? (
                                <Card className="p-6 sm:p-8 text-center">
                                    <Loader className="animate-spin mx-auto mb-4" size={32} />
                                    <p className="text-white/50">Loading tickets...</p>
                                </Card>
                            ) : tickets.length === 0 ? (
                                <Card className="p-6 sm:p-8 text-center">
                                    <MessageSquare className="mx-auto mb-4 text-white/20" size={48} />
                                    <p className="text-white/50">No tickets yet. Create one to get help!</p>
                                </Card>
                            ) : (
                                tickets.map(ticket => (
                                    <TicketRow key={ticket.id} ticket={ticket} onClick={() => handleViewTicket(ticket.id)} />
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Sidebar: Contact Info */}
                <div className="space-y-6">
                    <Card className="p-6">
                        <h3 className="font-bold text-white mb-4">Direct Contact</h3>
                        <div className="space-y-4">
                            <ContactItem icon={Mail} label="Email Support" value="support@Investoo.co.in" />
                        </div>
                    </Card>

                    <Card className="p-6 bg-gradient-to-br from-blue-900/20 to-transparent border-blue-500/20">
                        <div className="flex items-center gap-3 mb-4 text-blue-400">
                            <Clock size={20} />
                            <span className="font-bold">Operating Hours</span>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-white/60">
                                <span>Mon - Fri</span>
                                <span className="text-white">24 Hours</span>
                            </div>
                            <div className="flex justify-between text-white/60">
                                <span>Weekends</span>
                                <span className="text-white">9AM - 5PM EST</span>
                            </div>
                        </div>
                    </Card>

                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                        <h4 className="font-bold text-white text-sm mb-2">FAQ Highlights</h4>
                        <ul className="space-y-2 text-xs text-white/50">
                            <li className="hover:text-white cursor-pointer transition-colors">• How long do withdrawals take?</li>
                            <li className="hover:text-white cursor-pointer transition-colors">• How works the affiliate program?</li>
                            <li className="hover:text-white cursor-pointer transition-colors">• Resetting 2FA credentials</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TicketRow({ ticket, onClick }) {
    const getStatusColor = (status) => {
        switch (status) {
            case 'OPEN': return 'bg-blue-500/10 text-blue-500';
            case 'IN_PROGRESS': return 'bg-yellow-500/10 text-yellow-500';
            case 'RESOLVED': return 'bg-green-500/10 text-green-500';
            case 'CLOSED': return 'bg-white/5 text-white/40';
            default: return 'bg-white/5 text-white/40';
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(hours / 24);

        if (hours < 1) return 'Just now';
        if (hours < 24) return `${hours} hours ago`;
        if (days < 7) return `${days} days ago`;
        return date.toLocaleDateString();
    };

    const isOpen = ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS';

    return (
        <Card hover className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group cursor-pointer" onClick={onClick}>
            <div className="flex items-start gap-4 max-w-full">
                <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${isOpen ? 'bg-blue-500/10 text-blue-500' : 'bg-white/5 text-white/40'}`}>
                    {isOpen ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-bold text-white truncate max-w-[200px] sm:max-w-md">{ticket.subject}</span>
                        <span className="text-[10px] font-mono text-white/30 bg-white/5 px-1.5 py-0.5 rounded whitespace-nowrap">#{ticket.ticketNumber}</span>
                    </div>
                    <div className="text-xs text-white/50 flex flex-wrap items-center gap-2">
                        <span>{ticket.department}</span>
                        <span>•</span>
                        <span>{formatDate(ticket.createdAt)}</span>
                    </div>
                </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide self-start sm:self-center whitespace-nowrap ${getStatusColor(ticket.status)}`}>
                {ticket.status.replace('_', ' ')}
            </div>
        </Card>
    );
}

function ContactItem({ icon, label, value, sub }) {
    const Icon = icon;
    return (
        <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/50 group-hover:bg-white/10 group-hover:text-white transition-all">
                <Icon size={18} />
            </div>
            <div>
                <div className="text-xs font-bold text-white/40 uppercase tracking-widest">{label}</div>
                <div className="text-white font-medium">{value}</div>
                {sub && <div className="text-[10px] text-yellow-500 font-bold mt-0.5">{sub}</div>}
            </div>
        </div>
    );
}
