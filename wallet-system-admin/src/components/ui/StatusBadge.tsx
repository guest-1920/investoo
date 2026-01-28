import { ClockIcon } from './Icons';
import './StatusBadge.css';

interface StatusBadgeProps {
    value: string;
    className?: string;
}

const statusVariants: Record<string, string> = {
    // Common status values
    ACTIVE: 'success',
    INACTIVE: 'neutral',
    PENDING: 'warning',
    APPROVED: 'success',
    REJECTED: 'error',
    COMPLETED: 'success',
    CANCELLED: 'error',

    // Roles
    ADMIN: 'info',
    USER: 'neutral',

    // Transaction types
    CREDIT: 'success',
    DEBIT: 'error',

    // Boolean-like
    true: 'success',
    false: 'neutral',
};

export function StatusBadge({ value, className = '' }: StatusBadgeProps) {
    const normalizedValue = String(value).toUpperCase();
    const variant = statusVariants[normalizedValue] || statusVariants[value] || 'neutral';
    const isPending = normalizedValue === 'PENDING';

    return (
        <span className={`badge badge-${variant} ${className}`}>
            {isPending && <ClockIcon />}
            {value}
        </span>
    );
}

export default StatusBadge;
