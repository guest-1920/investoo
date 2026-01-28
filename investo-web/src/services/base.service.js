import client from '../api/client';

/**
 * Base Service Class
 * Provides standard CRUD operations for frontend services.
 * Mirrors the backend's BaseController pattern.
 */
class BaseService {
    /**
     * @param {string} endpoint - The base endpoint for this service (e.g., '/plans')
     */
    constructor(endpoint) {
        this.endpoint = endpoint;
    }

    /**
     * Get all items with optional pagination and filtering
     * @param {Object} params - Query parameters (page, limit, sortBy, etc.)
     * @returns {Promise} Axios response
     */
    getAll(params = {}) {
        return client.get(this.endpoint, { params });
    }

    /**
     * Get a single item by ID
     * @param {string} id - Item UUID
     * @returns {Promise} Axios response
     */
    getById(id) {
        return client.get(`${this.endpoint}/${id}`);
    }

    /**
     * Create a new item
     * @param {Object} data - Payload
     * @returns {Promise} Axios response
     */
    create(data) {
        return client.post(this.endpoint, data);
    }

    /**
     * Update an item by ID
     * @param {string} id - Item UUID
     * @param {Object} data - Update payload
     * @returns {Promise} Axios response
     */
    update(id, data) {
        return client.patch(`${this.endpoint}/${id}`, data);
    }

    /**
     * Delete (soft delete) an item by ID
     * @param {string} id - Item UUID
     * @returns {Promise} Axios response
     */
    remove(id) {
        return client.delete(`${this.endpoint}/${id}`);
    }
}

export default BaseService;
