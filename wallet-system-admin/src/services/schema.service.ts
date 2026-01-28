import api from './api';

export interface TypeaheadOptions {
    endpoint: string;
    displayField: string;
    valueField: string;
    label: string;
}

export interface GridColumnSchema {
    name: string;
    type: string;
    label: string;
    hidden: boolean;
    order: number;
    sortable: boolean;
    filterable: boolean;
    width?: number | string;
    align: 'left' | 'center' | 'right';
    format?: 'currency' | 'date' | 'datetime' | 'boolean' | 'badge';
    options?: { label: string; value: string | number }[];
    typeahead?: TypeaheadOptions;
}

export interface GridSchemaResponse {
    name: string;
    columns: GridColumnSchema[];
}

export interface FieldSchema {
    name: string;
    type: string;
    label: string;
    placeholder?: string;
    required: boolean;
    hidden: boolean;
    order: number;
    validation: {
        minLength?: number;
        maxLength?: number;
        min?: number;
        max?: number;
        pattern?: string;
    };
    typeahead?: TypeaheadOptions;
    options?: { label: string; value: string | number }[];
}

export interface FormSchemaResponse {
    name: string;
    fields: FieldSchema[];
}

// Cache for schemas
const gridSchemaCache = new Map<string, GridSchemaResponse>();
const formSchemaCache = new Map<string, FormSchemaResponse>();

export const schemaService = {
    /**
     * Get grid schema for an entity
     */
    async getGridSchema(entityName: string): Promise<GridSchemaResponse> {
        // Check cache first
        const cached = gridSchemaCache.get(entityName);
        if (cached) {
            return cached;
        }

        const response = await api.get<GridSchemaResponse>(`/schemas/grid/${entityName}`);
        gridSchemaCache.set(entityName, response.data);
        return response.data;
    },

    /**
     * Get form schema for a DTO
     */
    async getFormSchema(dtoName: string): Promise<FormSchemaResponse> {
        // Check cache first
        const cached = formSchemaCache.get(dtoName);
        if (cached) {
            return cached;
        }

        const response = await api.get<FormSchemaResponse>(`/schemas/${dtoName}`);
        formSchemaCache.set(dtoName, response.data);
        return response.data;
    },

    /**
     * Get all available grid schema names
     */
    async getAvailableGridSchemas(): Promise<string[]> {
        const response = await api.get<{ schemas: string[] }>('/schemas/grids');
        return response.data.schemas;
    },

    /**
     * Get all available form schema names
     */
    async getAvailableFormSchemas(): Promise<string[]> {
        const response = await api.get<{ schemas: string[] }>('/schemas');
        return response.data.schemas;
    },

    /**
     * Clear schema cache
     */
    clearCache() {
        gridSchemaCache.clear();
        formSchemaCache.clear();
    },
};

export default schemaService;
