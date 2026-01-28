import { useState, useEffect, useCallback, useRef } from 'react';
import { api, schemaService, type GridColumnSchema, type PaginatedResponse } from '../../services';
import { Grid, type GridAction } from './Grid';
import './ViewContainer.css';

export interface ViewTab {
    id: string;
    label: string;
    schemaName: string;
    apiEndpoint: string;
    filters?: Record<string, string | number>;
    actions?: GridAction[];
}

export interface HeaderField {
    label: string;
    value: React.ReactNode;
}

export interface ViewContainerProps {
    entityId: string;
    headerFields: HeaderField[];
    tabs: ViewTab[];
    onBack?: () => void;
}

interface TabData {
    data: Record<string, unknown>[];
    columns: GridColumnSchema[];
    loading: boolean;
    page: number;
    total: number;
    totalPages: number;
    initialized: boolean; // Track if we have successfully fetched at least once
}

export function ViewContainer({
    entityId: _entityId,
    headerFields,
    tabs,
    onBack,
}: ViewContainerProps) {
    const [activeTab, setActiveTab] = useState(tabs[0]?.id || '');
    const [tabData, setTabData] = useState<Record<string, TabData>>({});

    const currentTab = tabs.find(t => t.id === activeTab);

    const fetchingRef = useRef<Record<string, boolean>>({});

    // Fetch tab data
    const fetchTabData = useCallback(async (tabId: string, page = 1, cachedColumns?: GridColumnSchema[]) => {
        const tab = tabs.find(t => t.id === tabId);
        if (!tab) return;

        // Prevent duplicate fetches
        if (fetchingRef.current[tabId]) return;
        fetchingRef.current[tabId] = true;

        // Set loading state
        setTabData(prev => ({
            ...prev,
            [tabId]: {
                // Preserve existing data, columns, total, totalPages, initialized if available
                ...(prev[tabId] || {
                    data: [],
                    columns: [],
                    page: 1,
                    total: 0,
                    totalPages: 1,
                    initialized: false,
                }),
                // Override specific properties for the loading state
                loading: true,
                page, // Update page to the one being fetched
                // Use cached columns if provided, otherwise existing ones
                columns: cachedColumns || prev[tabId]?.columns || [],
            },
        }));

        try {
            // Fetch schema if not cached
            let columns = cachedColumns || [];
            if (columns.length === 0) {
                const schema = await schemaService.getGridSchema(tab.schemaName);
                columns = schema.columns;
            }

            // Fetch data
            const params = new URLSearchParams({
                page: String(page),
                limit: '10',
            });

            if (tab.filters && Object.keys(tab.filters).length > 0) {
                params.append('filters', JSON.stringify(tab.filters));
            }

            const response = await api.get<PaginatedResponse<Record<string, unknown>>>(
                `${tab.apiEndpoint}?${params}`
            );

            const responseData = response.data;
            const updates = Array.isArray(responseData) ? {
                data: responseData,
                total: responseData.length,
                totalPages: 1
            } : {
                data: responseData.data || [],
                total: responseData.total || 0,
                totalPages: responseData.totalPages || 1
            };

            setTabData(prev => ({
                ...prev,
                [tabId]: {
                    columns,
                    loading: false,
                    page,
                    initialized: true,
                    ...updates
                },
            }));
        } catch (err) {
            console.error('Failed to fetch tab data:', err);
            setTabData(prev => ({
                ...prev,
                [tabId]: {
                    ...prev[tabId]!, // assertions safe here as we initialized above
                    loading: false,
                    initialized: true, // Mark as initialized even on error to stop loop
                },
            }));
        } finally {
            fetchingRef.current[tabId] = false;
        }
    }, [tabs]); // Removed fetchingRef from dependencies as it's a ref

    // Fetch data when active tab changes
    useEffect(() => {
        if (activeTab) {
            // Check if we need to fetch
            const currentTabState = tabData[activeTab];
            const isInitialized = currentTabState?.initialized;
            const isLoading = currentTabState?.loading;

            // Only fetch if not initialized and not currently loading
            // We ignore empty data check because initialized covers that
            if (!isInitialized && !isLoading) {
                // Safe to call fetch since it has ref guard too
                fetchTabData(activeTab, 1, currentTabState?.columns);
            }
        }
        // We intentionally exclude tabData from dependencies to avoid loop on update.
        // We only care about activeTab changing.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, fetchTabData]);

    const handlePageChange = (page: number) => {
        fetchTabData(activeTab, page, tabData[activeTab]?.columns);
    };

    const currentTabData = tabData[activeTab];

    return (
        <div className="view-container">
            {/* Header Section */}
            <div className="view-header">
                {onBack && (
                    <button className="btn btn-secondary btn-sm mb-4" onClick={onBack}>
                        ← Back
                    </button>
                )}
                <div className="view-header-fields">
                    {headerFields.map((field, index) => (
                        <div key={index} className="view-header-field">
                            <span className="view-header-label">{field.label}</span>
                            <span className="view-header-value">{field.value}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="view-tab-content">
                {currentTab && currentTabData?.initialized ? (
                    <Grid
                        columns={currentTabData.columns}
                        data={currentTabData.data}
                        loading={currentTabData.loading}
                        actions={currentTab.actions}
                        pagination={{
                            page: currentTabData.page,
                            limit: 10,
                            total: currentTabData.total,
                            totalPages: currentTabData.totalPages,
                            onPageChange: handlePageChange,
                        }}
                    />
                ) : (
                    <div className="loading-overlay">
                        <div className="spinner"></div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ViewContainer;
