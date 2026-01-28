import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MoreVerticalIcon } from '../ui/Icons';
import type { GridColumnSchema, TypeaheadOptions } from '../../services';
import { uuidResolverService } from '../../services';
import { StatusBadge } from '../ui/StatusBadge';
import './Grid.css';

export interface GridAction {
    label: string;
    onClick: (row: Record<string, unknown>) => void;
    variant?: 'primary' | 'secondary' | 'danger' | 'success';
    show?: (row: Record<string, unknown>) => boolean;
    disabled?: (row: Record<string, unknown>) => boolean;
    icon?: React.ReactNode;
    title?: string;
}

export interface GridProps {
    columns: GridColumnSchema[];
    data: Record<string, unknown>[];
    loading?: boolean;
    onRowClick?: (row: Record<string, unknown>) => void;
    actions?: GridAction[];
    actionStyle?: 'buttons' | 'menu';
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        onPageChange: (page: number) => void;
    };
}

/**
 * Helper to get nested value from object using dot notation
 */ //
function getValue(row: Record<string, unknown>, path: string): unknown {
    if (!path.includes('.')) {
        return row[path];
    }
    return path.split('.').reduce((acc: any, part) => (acc && acc[part] !== undefined) ? acc[part] : undefined, row);
}

/**
 * Try to get the display value from joined/nested data first.
 * E.g., for column "userId" with typeahead displayField "name",
 * check if row.user?.name exists.
 */
function getJoinedDisplayValue(
    row: Record<string, unknown>,
    columnName: string,
    typeahead: TypeaheadOptions
): string | null {
    // Common pattern: userId -> user object
    // Try to derive relation name from column name
    const relationName = columnName.replace(/Id$/, ''); // userId -> user
    const relation = row[relationName];

    if (relation && typeof relation === 'object') {
        const displayValue = (relation as Record<string, unknown>)[typeahead.displayField];
        if (displayValue !== undefined && displayValue !== null) {
            return String(displayValue);
        }
    }

    // Also check for directly nested property format: user_name or user.name
    const nestedKey = `${relationName}_${typeahead.displayField}`;
    if (row[nestedKey] !== undefined && row[nestedKey] !== null) {
        return String(row[nestedKey]);
    }

    return null;
}

export function Grid({
    columns,
    data,
    loading = false,
    onRowClick,
    actions,
    actionStyle = 'buttons',
    pagination,
}: GridProps) {
    const [resolvedValues, setResolvedValues] = useState<Map<string, string>>(new Map());
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [menuOpenIdx, setMenuOpenIdx] = useState<number | null>(null);
    const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
    const resolvedRef = useRef<Set<string>>(new Set());

    // Click outside to close menu
    useEffect(() => {
        const handleClickOutside = () => {
            setMenuOpenIdx(null);
            setMenuPosition(null);
        };
        window.addEventListener('click', handleClickOutside);
        window.addEventListener('scroll', handleClickOutside, true);
        return () => {
            window.removeEventListener('click', handleClickOutside);
            window.removeEventListener('scroll', handleClickOutside, true);
        };
    }, []);

    // Resolve typeahead UUIDs - only for values not available in joined data
    useEffect(() => {
        const resolveUuids = async () => {
            const typeaheadColumns = columns.filter(col => col.typeahead);
            const newResolvedValues = new Map<string, string>();
            const uuidsToResolve: { uuid: string; column: GridColumnSchema; key: string }[] = [];

            for (const col of typeaheadColumns) {
                if (!col.typeahead) continue;

                for (const row of data) {
                    const value = row[col.name];
                    if (typeof value !== 'string' || !value) continue;

                    const key = `${col.name}:${value}`;

                    // Skip if already resolved
                    if (resolvedRef.current.has(key)) {
                        const cached = resolvedValues.get(key);
                        if (cached) newResolvedValues.set(key, cached);
                        continue;
                    }

                    // First, try to get from joined data
                    const joinedValue = getJoinedDisplayValue(row, col.name, col.typeahead);
                    if (joinedValue) {
                        newResolvedValues.set(key, joinedValue);
                        resolvedRef.current.add(key);
                        continue;
                    }

                    // Mark for API resolution
                    uuidsToResolve.push({ uuid: value, column: col, key });
                }
            }

            // Resolve remaining UUIDs via API (batch by endpoint to minimize calls)
            const byEndpoint = new Map<string, { uuid: string; column: GridColumnSchema; key: string }[]>();
            for (const item of uuidsToResolve) {
                const endpoint = item.column.typeahead!.endpoint;
                if (!byEndpoint.has(endpoint)) {
                    byEndpoint.set(endpoint, []);
                }
                byEndpoint.get(endpoint)!.push(item);
            }

            for (const [_, items] of byEndpoint) {
                for (const item of items) {
                    if (resolvedRef.current.has(item.key)) continue;

                    try {
                        const resolved = await uuidResolverService.resolve(
                            item.uuid,
                            item.column.typeahead!
                        );
                        newResolvedValues.set(item.key, resolved);
                        resolvedRef.current.add(item.key);
                    } catch {
                        newResolvedValues.set(item.key, item.uuid);
                    }
                }
            }

            setResolvedValues(prev => new Map([...prev, ...newResolvedValues]));
        };

        if (data.length > 0 && columns.length > 0) {
            resolveUuids();
        }
    }, [columns, data]);

    const handleSort = useCallback((columnName: string) => {
        if (sortColumn === columnName) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(columnName);
            setSortDirection('asc');
        }
    }, [sortColumn]);

    // Sort data (client-side)
    const sortedData = [...data].sort((a, b) => {
        if (!sortColumn) return 0;

        const aVal = getValue(a, sortColumn) as string | number | null | undefined;
        const bVal = getValue(b, sortColumn) as string | number | null | undefined;

        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        let comparison = 0;
        if (typeof aVal === 'string' && typeof bVal === 'string') {
            comparison = aVal.localeCompare(bVal);
        } else if (typeof aVal === 'number' && typeof bVal === 'number') {
            comparison = aVal - bVal;
        } else {
            comparison = String(aVal).localeCompare(String(bVal));
        }

        return sortDirection === 'asc' ? comparison : -comparison;
    });

    const formatValue = (value: unknown, column: GridColumnSchema, row: Record<string, unknown>): React.ReactNode => {
        if (value === null || value === undefined) {
            return <span className="text-muted">—</span>;
        }

        // Check for typeahead - first try joined data, then resolved values
        if (column.typeahead) {
            // Try joined data first
            const joinedValue = getJoinedDisplayValue(row, column.name, column.typeahead);
            if (joinedValue) {
                return joinedValue;
            }

            // Fall back to resolved values from API
            const resolvedKey = `${column.name}:${value}`;
            const resolved = resolvedValues.get(resolvedKey);
            return resolved || String(value);
        }

        // Format based on column format
        switch (column.format) {
            case 'currency':
                return `${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`;

            case 'date':
                return new Date(String(value)).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                });

            case 'datetime':
                return new Date(String(value)).toLocaleString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                });

            case 'boolean':
                return <StatusBadge value={value ? 'Yes' : 'No'} />;

            case 'badge':
                return <StatusBadge value={String(value)} />;

            default:
                return String(value);
        }
    };

    if (loading) {
        return (
            <div className="grid-loading">
                <div className="spinner"></div>
                <span>Loading...</span>
            </div>
        );
    }

    const isEmpty = data.length === 0;
    const totalColumns = columns.length + (actions && actions.length > 0 ? 1 : 0);

    return (
        <div className="grid-wrapper">
            <div className="grid-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            {columns.map(col => (
                                <th
                                    key={col.name}
                                    className={`align-${col.align}`}
                                    onClick={() => col.sortable && handleSort(col.name)}
                                    style={{ cursor: col.sortable ? 'pointer' : 'default' }}
                                >
                                    {col.label}
                                    {sortColumn === col.name && (
                                        <span className="sort-indicator">
                                            {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                                        </span>
                                    )}
                                </th>
                            ))}
                            {actions && actions.length > 0 && (
                                <th className="align-center" style={{ width: '100px' }}>Actions</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {isEmpty && (
                            <tr className="grid-empty-row">
                                <td colSpan={totalColumns} className="grid-empty-cell">
                                    <div className="grid-empty-message">
                                        <p>No records found</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                        {sortedData.map((row, rowIndex) => (
                            <tr
                                key={row.id as string || rowIndex}
                                className={onRowClick ? 'clickable' : ''}
                                onClick={() => onRowClick?.(row)}
                            >
                                {columns.map(col => (
                                    <td key={col.name} className={`align-${col.align}`}>
                                        {formatValue(getValue(row, col.name), col, row)}
                                    </td>
                                ))}
                                {actions && actions.length > 0 && (
                                    <td className="align-center actions-cell" onClick={e => e.stopPropagation()}>
                                        {actionStyle === 'menu' ? (
                                            <div style={{ display: 'inline-block' }}>
                                                <button
                                                    className="btn btn-sm btn-icon btn-secondary"
                                                    style={{ border: 'none', background: 'transparent' }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (menuOpenIdx === rowIndex) {
                                                            setMenuOpenIdx(null);
                                                            setMenuPosition(null);
                                                        } else {
                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                            setMenuOpenIdx(rowIndex);
                                                            setMenuPosition({
                                                                top: rect.bottom + window.scrollY,
                                                                left: rect.right + window.scrollX,
                                                            });
                                                        }
                                                    }}
                                                >
                                                    <MoreVerticalIcon />
                                                </button>
                                                {menuOpenIdx === rowIndex && menuPosition && createPortal(
                                                    <div
                                                        className="grid-action-menu"
                                                        style={{
                                                            position: 'absolute',
                                                            top: menuPosition.top,
                                                            left: menuPosition.left,
                                                            transform: 'translateX(-100%)',
                                                            marginTop: '4px',
                                                            zIndex: 1000,
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {actions
                                                            .filter(action => !action.show || action.show(row))
                                                            .map((action, actionIndex) => {
                                                                const isDisabled = action.disabled ? action.disabled(row) : false;
                                                                return (
                                                                    <button
                                                                        key={actionIndex}
                                                                        className={`grid-action-menu-item ${action.variant === 'danger' ? 'text-error' : ''}`}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            if (!isDisabled) {
                                                                                action.onClick(row);
                                                                                setMenuOpenIdx(null);
                                                                                setMenuPosition(null);
                                                                            }
                                                                        }}
                                                                        disabled={isDisabled}
                                                                    >
                                                                        {action.icon && <span className="icon-wrapper">{action.icon}</span>}
                                                                        {action.label || action.title}
                                                                    </button>
                                                                );
                                                            })}
                                                    </div>,
                                                    document.body
                                                )}
                                            </div>
                                        ) : (
                                            <div className="actions-wrapper">
                                                {actions
                                                    .filter(action => !action.show || action.show(row))
                                                    .map((action, actionIndex) => {
                                                        const isDisabled = action.disabled ? action.disabled(row) : false;
                                                        return (
                                                            <button
                                                                key={actionIndex}
                                                                className={`btn btn-sm btn-${action.variant || 'secondary'} ${action.icon ? 'btn-icon' : ''}`}
                                                                onClick={() => !isDisabled && action.onClick(row)}
                                                                title={action.title}
                                                                disabled={isDisabled}
                                                            >
                                                                {action.icon || action.label}
                                                            </button>
                                                        );
                                                    })}
                                            </div>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {pagination && (
                <div className="pagination">
                    <div className="pagination-info">
                        {pagination.total === 0 ? (
                            'No entries found'
                        ) : (
                            <>
                                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                                {pagination.total} entries
                            </>
                        )}
                    </div>
                    <div className="pagination-controls">
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => pagination.onPageChange(pagination.page - 1)}
                            disabled={pagination.page <= 1}
                        >
                            Previous
                        </button>
                        <span className="pagination-page">
                            Page {pagination.page} of {pagination.totalPages}
                        </span>
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => pagination.onPageChange(pagination.page + 1)}
                            disabled={pagination.page >= pagination.totalPages}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Grid;
