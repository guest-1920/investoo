import api from './api';
import type { TypeaheadOptions } from './schema.service';

// Cache for resolved UUIDs
const resolvedCache = new Map<string, { value: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export interface TypeaheadSearchResult {
    id: string;
    [key: string]: string | number | boolean | null;
}

export const uuidResolverService = {
    /**
     * Resolve a single UUID to display value
     */
    async resolve(uuid: string, typeahead: TypeaheadOptions): Promise<string> {
        const cacheKey = `${typeahead.endpoint}:${uuid}`;

        // Check cache
        const cached = resolvedCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return cached.value;
        }

        try {
            const response = await api.get(`${typeahead.endpoint}/${uuid}`);
            const displayValue = response.data[typeahead.displayField] || uuid;

            // Cache the result
            resolvedCache.set(cacheKey, {
                value: displayValue,
                timestamp: Date.now(),
            });

            return displayValue;
        } catch {
            return uuid; // Return UUID if resolution fails
        }
    },

    /**
     * Resolve multiple UUIDs in batch
     */
    async resolveMany(
        uuids: string[],
        typeahead: TypeaheadOptions
    ): Promise<Map<string, string>> {
        const results = new Map<string, string>();
        const uncachedUuids: string[] = [];

        // Check cache for each UUID
        for (const uuid of uuids) {
            const cacheKey = `${typeahead.endpoint}:${uuid}`;
            const cached = resolvedCache.get(cacheKey);

            if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
                results.set(uuid, cached.value);
            } else {
                uncachedUuids.push(uuid);
            }
        }

        // Fetch uncached UUIDs
        // For now, fetch individually. Backend should support batch endpoint in future.
        for (const uuid of uncachedUuids) {
            try {
                const displayValue = await this.resolve(uuid, typeahead);
                results.set(uuid, displayValue);
            } catch {
                results.set(uuid, uuid);
            }
        }

        return results;
    },

    /**
     * Search for typeahead suggestions
     */
    async search(
        query: string,
        typeahead: TypeaheadOptions,
        limit = 10
    ): Promise<TypeaheadSearchResult[]> {
        try {
            const response = await api.get(typeahead.endpoint, {
                params: {
                    search: query,
                    limit,
                },
            });

            // Handle paginated response
            const data = response.data.data || response.data;
            return Array.isArray(data) ? data : [];
        } catch {
            return [];
        }
    },

    /**
     * Clear resolver cache
     */
    clearCache() {
        resolvedCache.clear();
    },
};

export default uuidResolverService;
