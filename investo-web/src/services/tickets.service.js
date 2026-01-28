import client from '../api/client';
import BaseService from './base.service';

/**
 * Support Tickets Service
 * Provides CRUD operations for support tickets.
 */
class TicketsService extends BaseService {
    constructor() {
        super('/support');
    }

    /**
     * Get user's tickets with pagination
     * @param {Object} params - Query parameters (page, limit)
     * @returns {Promise} Axios response
     */
    getMyTickets(params = {}) {
        return client.get('/support/my', { params });
    }

    /**
     * Get a single ticket with replies
     * @param {string} id - Ticket UUID
     * @returns {Promise} Axios response
     */
    getTicketDetail(id) {
        return client.get(`/support/${id}`);
    }

    /**
     * Add a reply to a ticket
     * @param {string} id - Ticket UUID
     * @param {string} message - Reply message
     * @returns {Promise} Axios response
     */
    addReply(id, message) {
        return client.post(`/support/${id}/reply`, { message });
    }
}

const ticketsService = new TicketsService();
export default ticketsService;
